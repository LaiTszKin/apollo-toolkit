const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const TARGET_DEFINITIONS = Object.freeze([
  { id: 'codex', label: 'Codex', description: '~/.codex/skills' },
  { id: 'openclaw', label: 'OpenClaw', description: '~/.openclaw/workspace*/skills' },
  { id: 'trae', label: 'Trae', description: '~/.trae/skills' },
  { id: 'agents', label: 'Agents', description: '~/.agents/skills' },
  { id: 'claude-code', label: 'Claude Code', description: '~/.claude/skills' },
]);
const VALID_MODES = TARGET_DEFINITIONS.map(({ id }) => id);
const COPY_FILES = new Set(['AGENTS.md', 'CHANGELOG.md', 'LICENSE', 'README.md', 'package.json']);
const COPY_DIRS = new Set(['scripts']);
const MANIFEST_FILENAME = '.apollo-toolkit-manifest.json';

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
  const skillNames = new Set();

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (fs.existsSync(path.join(rootDir, entry.name, 'SKILL.md'))) {
      skillNames.add(entry.name);
    }
  }

  if (modes.includes('codex')) {
    const codexDir = path.join(rootDir, 'codex');
    if (fs.existsSync(codexDir)) {
      const codexEntries = await fsp.readdir(codexDir, { withFileTypes: true });
      for (const entry of codexEntries) {
        if (entry.isDirectory() && fs.existsSync(path.join(codexDir, entry.name, 'SKILL.md'))) {
          skillNames.add(entry.name);
        }
      }
    }
  }

  return [...skillNames].sort();
}

async function listCodexSkillNames(rootDir) {
  const codexDir = path.join(rootDir, 'codex');
  if (!fs.existsSync(codexDir)) {
    return [];
  }

  const entries = await fsp.readdir(codexDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(codexDir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

// Read manifest from a target directory, returning { skills, historicalSkills, linkMode } or null.
async function readManifest(targetRoot) {
  const manifestPath = path.join(targetRoot, MANIFEST_FILENAME);
  try {
    const raw = await fsp.readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Write manifest to a target directory.
async function writeManifest(targetRoot, { version, linkMode, skills, previousSkills = [] }) {
  const historicalSkills = [...new Set([...previousSkills, ...skills])].sort();
  const manifest = {
    version,
    installedAt: new Date().toISOString(),
    linkMode,
    skills: [...skills].sort(),
    historicalSkills,
  };
  await fsp.mkdir(targetRoot, { recursive: true });
  await fsp.writeFile(
    path.join(targetRoot, MANIFEST_FILENAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
}

// Read all current + historically appeared skill names with deduplication.
async function listAllKnownSkillNames({ toolkitHome, modes = [], env = process.env }) {
  const allNames = new Set();

  // Current skills from toolkit home
  const currentSkills = await listSkillNames(toolkitHome, modes);
  for (const name of currentSkills) {
    allNames.add(name);
  }

  // Historical skills from all target manifests
  const targets = await getTargetRoots(modes, env).catch(() => []);
  for (const target of targets) {
    const manifest = await readManifest(target.root);
    if (manifest && manifest.historicalSkills) {
      for (const name of manifest.historicalSkills) {
        allNames.add(name);
      }
    }
  }

  return [...allNames].sort();
}

function getTargetSkillNames({ targetMode, sharedSkillNames, codexSkillNames, includeExclusiveSkills = false }) {
  const includeCodexSkills = targetMode === 'codex' || includeExclusiveSkills;
  if (!includeCodexSkills || codexSkillNames.length === 0) {
    return sharedSkillNames;
  }

  return [...new Set([...sharedSkillNames, ...codexSkillNames])].sort();
}

function resolveInstallSourcePath({ toolkitHome, targetMode, skillName, codexSkillNames }) {
  if (targetMode === 'codex' && codexSkillNames.includes(skillName)) {
    return path.join(toolkitHome, 'codex', skillName);
  }

  return path.join(toolkitHome, skillName);
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

async function replaceWithSymlink(sourcePath, targetPath) {
  await fsp.rm(targetPath, { recursive: true, force: true });
  await ensureDirectory(path.dirname(targetPath));
  await fsp.symlink(sourcePath, targetPath, process.platform === 'win32' ? 'junction' : 'dir');
}

// Install skills into target directories.
// linkMode: 'copy' (default) or 'symlink'
// includeExclusiveSkills: when true, non-codex targets also receive codex-exclusive skills.
async function installLinks({ toolkitHome, modes, env = process.env, previousSkillNames = [], linkMode = 'copy', includeExclusiveSkills = false }) {
  const normalizedModes = normalizeModes(modes);
  // Always collect codex skill names (needed when includeExclusiveSkills is true even
  // when codex isn't in the target list).
  const codexSkillNames = (normalizedModes.includes('codex') || includeExclusiveSkills)
    ? await listCodexSkillNames(toolkitHome)
    : [];
  const sharedSkillNames = await listSkillNames(toolkitHome);
  const skillNames = normalizedModes.includes('codex')
    ? [...new Set([...sharedSkillNames, ...codexSkillNames])].sort()
    : sharedSkillNames;
  const targets = await getTargetRoots(normalizedModes, env);
  const copiedPaths = [];

  for (const target of targets) {
    const targetSkillNames = getTargetSkillNames({
      targetMode: target.mode,
      sharedSkillNames,
      codexSkillNames,
      includeExclusiveSkills,
    });

    // Read existing manifest to carry forward historical skills
    const existingManifest = await readManifest(target.root);
    const allPreviousSkills = existingManifest
      ? [...new Set([...existingManifest.historicalSkills, ...previousSkillNames])]
      : previousSkillNames;

    const staleSkillNames = allPreviousSkills.filter(
      (skillName) => !targetSkillNames.includes(skillName),
    );

    await ensureDirectory(target.root);
    for (const staleSkillName of staleSkillNames) {
      await fsp.rm(path.join(target.root, staleSkillName), { recursive: true, force: true });
    }
    for (const skillName of targetSkillNames) {
      const sourcePath = resolveInstallSourcePath({
        toolkitHome,
        targetMode: target.mode,
        skillName,
        codexSkillNames,
      });
      const targetPath = path.join(target.root, skillName);

      if (linkMode === 'symlink') {
        await replaceWithSymlink(sourcePath, targetPath);
      } else {
        await replaceWithCopy(sourcePath, targetPath);
      }
      copiedPaths.push({ target: target.label, path: targetPath, skillName, linkMode });
    }

    // Persist manifest for future uninstall / dedup
    await writeManifest(target.root, {
      version: existingManifest?.version || 'unknown',
      linkMode,
      skills: targetSkillNames,
      previousSkills: allPreviousSkills,
    });
  }

  return {
    skillNames,
    targets,
    copiedPaths,
    linkMode,
  };
}

// Uninstall all skills from all target directories that have manifests.
async function uninstallSkills({ env = process.env, modes = null } = {}) {
  const normalizedModes = modes ? normalizeModes(modes) : VALID_MODES;
  const targets = await getTargetRoots(normalizedModes, env).catch(() => []);
  const results = [];

  for (const target of targets) {
    const manifest = await readManifest(target.root);
    if (!manifest || !manifest.skills || manifest.skills.length === 0) {
      continue;
    }

    const removedSkills = [];
    for (const skillName of manifest.skills) {
      const skillPath = path.join(target.root, skillName);
      try {
        await fsp.rm(skillPath, { recursive: true, force: true });
        removedSkills.push(skillName);
      } catch {
        // Skip skills that couldn't be removed
      }
    }

    // Remove the manifest itself
    try {
      await fsp.rm(path.join(target.root, MANIFEST_FILENAME), { force: true });
    } catch {
      // ok if already gone
    }

    if (removedSkills.length > 0) {
      results.push({
        target: target.label,
        root: target.root,
        removedSkills,
      });
    }
  }

  return results;
}

module.exports = {
  expandUserPath,
  TARGET_DEFINITIONS,
  VALID_MODES,
  MANIFEST_FILENAME,
  getTargetRoots,
  installLinks,
  listAllKnownSkillNames,
  listCodexSkillNames,
  listSkillNames,
  normalizeModes,
  readManifest,
  resolveHomeDirectory,
  resolveToolkitHome,
  syncToolkitHome,
  uninstallSkills,
  writeManifest,
};
