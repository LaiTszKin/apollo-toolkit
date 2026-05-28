/**
 * Promise pool 並發控制。
 * 限制同時執行的 Promise 數量。
 *
 * @param {Array} items - 要處理的項目陣列
 * @param {Function} fn - 處理函數，接受 (item, index) 並回傳 Promise
 * @param {number} concurrency - 最大同時執行數量
 * @returns {Promise<Array>} 處理結果陣列
 */
export async function promisePool(items, fn, concurrency) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = [];
  const limit = Math.min(concurrency, items.length);
  for (let i = 0; i < limit; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}
