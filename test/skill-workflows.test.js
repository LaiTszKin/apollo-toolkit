const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('commit-and-push requires changelog alignment before commit', () => {
  const skill = read('commit-and-push/SKILL.md');
  const agent = read('commit-and-push/agents/openai.yaml');

  assert.match(skill, /Treat root `CHANGELOG\.md` `Unreleased` coverage as mandatory/i);
  assert.match(skill, /Re-open the final `CHANGELOG\.md` diff/i);
  assert.match(agent, /confirm root CHANGELOG\.md Unreleased reflects the actual pending change set/i);
});

test('code changes make review-change-set a blocking submit gate', () => {
  const commitSkill = read('commit-and-push/SKILL.md');
  const releaseSkill = read('version-release/SKILL.md');
  const commitAgent = read('commit-and-push/agents/openai.yaml');
  const releaseAgent = read('version-release/agents/openai.yaml');

  assert.match(commitSkill, /`review-change-set` is required for code-affecting changes/i);
  assert.match(commitSkill, /Run `review-change-set` for every code-affecting change before continuing; treat unresolved review findings as blocking/i);
  assert.match(releaseSkill, /`review-change-set` is required for code-affecting releases/i);
  assert.match(releaseSkill, /run `review-change-set` for the same release scope before continuing; treat unresolved review findings as blocking/i);
  assert.match(commitAgent, /if the change set includes code changes, run \$review-change-set/i);
  assert.match(releaseAgent, /if the release includes code changes, run \$review-change-set/i);
});

test('scenario-matched conditional gates become blocking', () => {
  const commitSkill = read('commit-and-push/SKILL.md');
  const releaseSkill = read('version-release/SKILL.md');
  const readinessSkill = read('submission-readiness-check/SKILL.md');
  const commitAgent = read('commit-and-push/agents/openai.yaml');
  const releaseAgent = read('version-release/agents/openai.yaml');

  assert.match(commitSkill, /Any conditional gate whose trigger is confirmed by this classification becomes mandatory before commit/i);
  assert.match(commitSkill, /Treat every scenario-matched gate as blocking before commit/i);
  assert.match(releaseSkill, /Any conditional gate whose trigger is confirmed by this classification becomes mandatory before version bumping, tagging, or release publication/i);
  assert.match(releaseSkill, /Treat every scenario-matched gate as blocking before versioning or release publication/i);
  assert.match(readinessSkill, /every conditional gate whose scenario is met has actually been completed/i);
  assert.match(readinessSkill, /If the archive scenario is met, treat `\$archive-specs` as blocking/i);
  assert.match(commitAgent, /Treat every conditional gate whose scenario is met as blocking before any commit/i);
  assert.match(releaseAgent, /Treat every conditional gate whose scenario is met as blocking before any version bump, tag, or release step/i);
});

test('risk-driven edge and security reviews are blocking when applicable', () => {
  const commitSkill = read('commit-and-push/SKILL.md');
  const releaseSkill = read('version-release/SKILL.md');
  const commitAgent = read('commit-and-push/agents/openai.yaml');
  const releaseAgent = read('version-release/agents/openai.yaml');

  assert.match(commitSkill, /`discover-edge-cases` and `harden-app-security` are important review gates/i);
  assert.match(commitSkill, /treat them as blocking review gates, not optional polish/i);
  assert.match(releaseSkill, /`discover-edge-cases` and `harden-app-security` are important review gates/i);
  assert.match(releaseSkill, /treat them as blocking review gates, not optional polish/i);
  assert.match(commitAgent, /run \$discover-edge-cases and \$harden-app-security as blocking gates too/i);
  assert.match(releaseAgent, /run \$discover-edge-cases and \$harden-app-security as blocking gates too/i);
});

test('version-release requires version inspection and matching tag plus release', () => {
  const skill = read('version-release/SKILL.md');
  const agent = read('version-release/agents/openai.yaml');

  assert.match(skill, /Inspect existing local and remote tags plus any existing GitHub Release for the target version/i);
  assert.match(skill, /Do not continue until you can state the current version, the intended next version, and the exact tag name/i);
  assert.match(skill, /Never stop after the release commit or tag alone; creating the matching GitHub release is part of done criteria/i);
  assert.match(agent, /read the current version plus existing tag\/release state/i);
  assert.match(agent, /publish the matching GitHub release before reporting success/i);
});

test('feature planning skills share test-case-strategy for test decisions', () => {
  const strategy = read('test-case-strategy/SKILL.md');
  const unitReference = read('test-case-strategy/references/unit-tests.md');
  const generateSpec = read('generate-spec/SKILL.md');
  const generateTasks = read('generate-spec/references/templates/tasks.md');
  const develop = read('develop-new-features/SKILL.md');
  const enhance = read('enhance-existing-features/SKILL.md');

  assert.match(strategy, /unit drift checks/i);
  assert.match(strategy, /Define the oracle before implementation/i);
  assert.match(unitReference, /Unit drift check:/i);
  assert.match(unitReference, /Define the oracle from the spec, design, contract, official docs, or established intended behavior before implementation/i);

  assert.match(generateSpec, /Required: `test-case-strategy`/i);
  assert.match(generateTasks, /Unit drift check: \[UT-xx target unit; expected result\/assertion, or N\/A with reason\]/i);
  assert.match(develop, /Required: `generate-spec`.*`test-case-strategy`/is);
  assert.match(enhance, /Required: `test-case-strategy`/i);
});

test('preparation docs stay minimal and non-business', () => {
  const generateSpec = read('generate-spec/SKILL.md');
  const preparation = read('generate-spec/references/templates/preparation.md');
  const coordination = read('generate-spec/references/templates/coordination.md');
  const subagents = read('implement-specs-with-subagents/SKILL.md');

  assert.match(generateSpec, /keep that preparation minimal and free of core business logic or target outcomes/i);
  assert.match(generateSpec, /Exclude core business logic, target business outcomes, user-visible behavior changes/i);
  assert.match(preparation, /smallest shared prerequisite state/i);
  assert.match(preparation, /No core business logic or target outcome is implemented here/i);
  assert.doesNotMatch(coordination, /Shared Baseline And Preparation Reference/i);
  assert.match(subagents, /Complete and commit explicitly documented prerequisite preparation/i);
});
