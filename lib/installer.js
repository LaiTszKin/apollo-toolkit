const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const VALID_MODES = ['codex', 'openclaw', 'trae', 'agents', 'claude-code'];
const COPY_FILES = new Set(['AGENTS.md', 'CHANGELOG.md', 'LICENSE', 'README.md', 'package.json']);
const COPY_DIRS = new Set(['scripts']);

function resolveHomeDirectory(env = process.env) {
  return env.HOME || env.USERPROFILE || os.homedir();
}

function expandUserPath(inputPath, env = process.env) {
  if (!inputPath) {
    return inputPath;
  }

  if (inputPath === '~') {
    return resolveHomeDirectory(env);
  }

  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(resolveHomeDirectory(env), inputPath.slice(2));
  }

  return inputPath;
}

function resolveToolkitHome(env = process.env) {
  if (env.APOLLO_TOOLKIT_HOME) {
    return path.resolve(expandUserPath(env.APOLLO_TOOLKIT_HOME, env));
  }

  return path.join(resolveHomeDirectory(env), '.apollo-toolkit');
}

function normalizeModes(inputModes) {
  const modes = [];

  for (const rawMode of inputModes) {
    const mode = String(rawMode).toLowerCase();
    if (mode === 'all') {
      for (const candidate of VALID_MODES) {
        if (!modes.includes(candidate)) {
          modes.push(candidate);
        }
      }
      continue;
    }

    if (!VALID_MODES.includes(mode)) {
      throw new Error(`Invalid mode: ${rawMode}`);
    }

    if (!modes.includes(mode)) {
      modes.push(mode);
    }
  }

  return modes;
}

async function listSkillNames(rootDir, modes = []) {
  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  const skillNames = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (fs.existsSync(path.join(rootDir, entry.name, 'SKILL.md'))) {
      skillNames.push(entry.name);
    }
  }

  // For codex mode, also include codex-specific skills
  if (modes.includes('codex')) {
    const codexDir = path.join(rootDir, 'codex');
    if (fs.existsSync(codexDir)) {
      const codexEntries = await fsp.readdir(codexDir, { withFileTypes: true });
      for (const entry of codexEntries) {
        if (entry.isDirectory() && fs.existsSync(path.join(codexDir, entry.name, 'SKILL.md'))) {
          skillNames.push(entry.name);
        }
      }
    }
  }

  return skillNames.sort();
}

function shouldCopyEntry(sourceRoot, entry) {
  if (entry.isFile()) {
    return COPY_FILES.has(entry.name);
  }

  if (!entry.isDirectory()) {
    return false;
  }

  if (COPY_DIRS.has(entry.name)) {
    return true;
  }

  return fs.existsSync(path.join(sourceRoot, entry.name, 'SKILL.md'));
}

function shouldCopyCodexContainer({ sourceRoot, entry, modes = [] }) {
  if (entry.name !== 'codex' || !entry.isDirectory() || !modes.includes('codex')) {
    return false;
  }

  const codexDir = path.join(sourceRoot, entry.name);
  if (!fs.existsSync(codexDir)) {
    return false;
  }

  const childNames = fs.readdirSync(codexDir);
  return childNames.some((childName) => fs.existsSync(path.join(codexDir, childName, 'SKILL.md')));
}

async function stageToolkitContents({ sourceRoot, destinationRoot, version, modes = [] }) {
  const entries = await fsp.readdir(sourceRoot, { withFileTypes: true });
  const copiedEntries = [];

  await fsp.mkdir(destinationRoot, { recursive: true });

  for (const entry of entries) {
    if (!shouldCopyEntry(sourceRoot, entry) && !shouldCopyCodexContainer({ sourceRoot, entry, modes })) {
      continue;
    }

    const sourcePath = path.join(sourceRoot, entry.name);
    const destinationPath = path.join(destinationRoot, entry.name);
    await fsp.cp(sourcePath, destinationPath, { recursive: true, force: true });
    copiedEntries.push(entry.name);
  }

  const metadata = {
    version,
    installedAt: new Date().toISOString(),
    source: 'npm-package',
  };
  await fsp.writeFile(
    path.join(destinationRoot, '.apollo-toolkit-install.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8',
  );

  return copiedEntries.sort();
}

async function syncToolkitHome({ sourceRoot, toolkitHome, version, modes = [] }) {
  const parentDir = path.dirname(toolkitHome);
  const tempDir = path.join(parentDir, `.apollo-toolkit.tmp-${process.pid}-${Date.now()}`);
  const previousSkillNames = await listSkillNames(toolkitHome, modes).catch(() => []);

  await fsp.rm(tempDir, { recursive: true, force: true });
  await stageToolkitContents({ sourceRoot, destinationRoot: tempDir, version, modes });

  const stat = await fsp.lstat(toolkitHome).catch(() => null);
  if (stat && !stat.isDirectory()) {
    throw new Error(`Apollo Toolkit home exists but is not a directory: ${toolkitHome}`);
  }

  await fsp.rm(toolkitHome, { recursive: true, force: true });
  await fsp.mkdir(parentDir, { recursive: true });
  await fsp.rename(tempDir, toolkitHome);

  return {
    toolkitHome,
    previousSkillNames,
    skillNames: await listSkillNames(toolkitHome, modes),
  };
}

async function getTargetRoots(modes, env = process.env) {
  const homeDir = resolveHomeDirectory(env);
  const targets = [];

  for (const mode of normalizeModes(modes)) {
    if (mode === 'codex') {
      targets.push({
        mode,
        label: 'Codex',
        root: env.CODEX_SKILLS_DIR
          ? path.resolve(expandUserPath(env.CODEX_SKILLS_DIR, env))
          : path.join(homeDir, '.codex', 'skills'),
      });
      continue;
    }

    if (mode === 'trae') {
      targets.push({
        mode,
        label: 'Trae',
        root: env.TRAE_SKILLS_DIR
          ? path.resolve(expandUserPath(env.TRAE_SKILLS_DIR, env))
          : path.join(homeDir, '.trae', 'skills'),
      });
      continue;
    }

    if (mode === 'agents') {
      targets.push({
        mode,
        label: 'Agents',
        root: env.AGENTS_SKILLS_DIR
          ? path.resolve(expandUserPath(env.AGENTS_SKILLS_DIR, env))
          : path.join(homeDir, '.agents', 'skills'),
      });
      continue;
    }

    if (mode === 'openclaw') {
      const openclawHome = env.OPENCLAW_HOME
        ? path.resolve(expandUserPath(env.OPENCLAW_HOME, env))
        : path.join(homeDir, '.openclaw');
      const entries = await fsp.readdir(openclawHome, { withFileTypes: true }).catch(() => []);
      const workspaceNames = entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('workspace'))
        .map((entry) => entry.name)
        .sort();

      if (workspaceNames.length === 0) {
        throw new Error(`No workspace directories found under: ${openclawHome}`);
      }

      for (const workspaceName of workspaceNames) {
        targets.push({
          mode,
          label: `OpenClaw (${workspaceName})`,
          root: path.join(openclawHome, workspaceName, 'skills'),
        });
      }
      continue;
    }

    if (mode === 'claude-code') {
      targets.push({
        mode,
        label: 'Claude Code',
        root: env.CLAUDE_CODE_SKILLS_DIR
          ? path.resolve(expandUserPath(env.CLAUDE_CODE_SKILLS_DIR, env))
          : path.join(homeDir, '.claude', 'skills'),
      });
      continue;
    }
  }

  return targets;
}

async function ensureDirectory(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function replaceWithCopy(sourcePath, targetPath) {
  await fsp.rm(targetPath, { recursive: true, force: true });
  await ensureDirectory(path.dirname(targetPath));
  await fsp.cp(sourcePath, targetPath, { recursive: true, force: true });
}

async function installLinks({ toolkitHome, modes, env = process.env, previousSkillNames = [] }) {
  const normalizedModes = normalizeModes(modes);
  const skillNames = await listSkillNames(toolkitHome, normalizedModes);
  const targets = await getTargetRoots(normalizedModes, env);
  const copiedPaths = [];
  const staleSkillNames = previousSkillNames.filter((skillName) => !skillNames.includes(skillName));

  for (const target of targets) {
    await ensureDirectory(target.root);
    for (const staleSkillName of staleSkillNames) {
      await fsp.rm(path.join(target.root, staleSkillName), { recursive: true, force: true });
    }
    for (const skillName of skillNames) {
      // For codex skills, use the ./codex/ subdirectory as source
      let sourcePath;
      if (normalizedModes.includes('codex') && fs.existsSync(path.join(toolkitHome, 'codex', skillName))) {
        sourcePath = path.join(toolkitHome, 'codex', skillName);
      } else {
        sourcePath = path.join(toolkitHome, skillName);
      }
      const targetPath = path.join(target.root, skillName);
      await replaceWithCopy(sourcePath, targetPath);
      copiedPaths.push({ target: target.label, path: targetPath, skillName });
    }
  }

  return {
    skillNames,
    targets,
    copiedPaths,
  };
}

module.exports = {
  expandUserPath,
  VALID_MODES,
  getTargetRoots,
  installLinks,
  listSkillNames,
  normalizeModes,
  resolveHomeDirectory,
  resolveToolkitHome,
  syncToolkitHome,
};
