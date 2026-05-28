/**
 * Judge model API utilities.
 *
 * Shared callJudgeModel and parseJudgeJSON implementations used by
 * score.mjs and optimize.mjs.
 */

/**
 * Call the judge model API (OpenAI-compatible /v1/chat/completions).
 *
 * @param {string} prompt - 評分提示詞
 * @param {object} env - 環境變數 (JUDGE_BASE_URL, JUDGE_MODEL, JUDGE_API_KEY, JUDGE_REASONING_EFFORT)
 * @param {object} [options] - 額外選項
 * @param {boolean} [options.jsonMode] - 是否啟用 response_format json_object (預設 false)
 * @param {number} [options.timeoutMs] - 逾時毫秒數
 * @returns {Promise<object>} 解析後的 JSON 物件
 */
export async function callJudgeModel(prompt, env, options = {}) {
  const { jsonMode = false, timeoutMs = 0 } = options;
  const url = `${env.JUDGE_BASE_URL}/v1/chat/completions`;

  const body = {
    model: env.JUDGE_MODEL,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  };

  // Only add reasoning_effort if explicitly set (only supported by OpenAI o-series models)
  if (env.JUDGE_REASONING_EFFORT) {
    body.reasoning_effort = env.JUDGE_REASONING_EFFORT;
  }

  // Only add response_format when explicitly requested (not all APIs support it)
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  let timeoutId;
  if (typeof timeoutMs === 'number' && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.JUDGE_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: timeoutMs > 0 ? controller.signal : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '(unable to read error body)');
      throw new Error(`Judge API error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Judge 模型回覆中沒有 content');
    }

    return parseJudgeOutput(content);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Safely parse JSON from judge model output, with multi-level fallback.
 *
 * Fallback chain:
 *   1. Direct JSON.parse()
 *   2. Extract ```json ... ``` block
 *   3. Extract { ... } brace block
 *   4. Return error structure (never throws)
 *
 * @param {string} content - Judge 模型回覆的文字
 * @returns {object} 解析後的 JSON 物件
 */
export function parseJudgeOutput(content) {
  // 1. Direct parse
  try {
    return JSON.parse(content);
  } catch (_) {
    // not valid JSON directly
  }

  // 2. Extract ```json ... ``` block
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1]);
    } catch (_) {
      // still not valid
    }
  }

  // 3. Extract { ... } brace block
  const braceMatch = content.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch (_) {
      // still not valid
    }
  }

  // 4. Final fallback
  return {
    overallScore: 0,
    dimensions: [],
    issues: [{
      severity: 'P1',
      category: 'other',
      description: 'Judge 模型回覆無法解析為有效 JSON',
      evidence: content.substring(0, 500),
    }],
    summary: 'Judge 輸出解析失敗',
    _parseError: true,
    _rawContent: content.substring(0, 1000),
  };
}

/**
 * Call the exec model API (OpenAI-compatible /v1/chat/completions).
 *
 * @param {Array<{role: string, content: string}>} messages - 對話訊息
 * @param {object} env - 環境變數 (EXEC_BASE_URL, EXEC_MODEL, EXEC_API_KEY, EXEC_REASONING_EFFORT)
 * @param {AbortSignal} [signal] - 用於超時取消的 AbortSignal
 * @returns {Promise<object>} API 的回應 JSON
 */
export async function callExecModel(messages, env, signal) {
  const url = `${env.EXEC_BASE_URL}/v1/chat/completions`;

  const body = {
    model: env.EXEC_MODEL,
    messages,
    stream: false,
  };

  // Only add reasoning_effort if explicitly set
  if (env.EXEC_REASONING_EFFORT) {
    body.reasoning_effort = env.EXEC_REASONING_EFFORT;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.EXEC_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '(unable to read error body)');
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}
