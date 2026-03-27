param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Modes
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Usage {
  @"
Usage:
  ./scripts/install_skills.ps1 [codex|openclaw|trae|agents|all]...

Modes:
  codex     Copy skills into ~/.codex/skills
  openclaw  Copy skills into ~/.openclaw/workspace*/skills
  trae      Copy skills into ~/.trae/skills
  agents    Copy skills into ~/.agents/skills (for agent-skill-compatible software)
  all       Install all supported targets

Optional environment overrides:
  CODEX_SKILLS_DIR   Override codex skills destination path
  OPENCLAW_HOME      Override openclaw home path
  TRAE_SKILLS_DIR    Override trae skills destination path
  AGENTS_SKILLS_DIR  Override agents skills destination path
  APOLLO_TOOLKIT_HOME Override local install path used when repo root is unavailable
  APOLLO_TOOLKIT_REPO_URL Override git repository URL used when repo root is unavailable
"@
}

$ToolkitRepoUrl = if ($env:APOLLO_TOOLKIT_REPO_URL) { $env:APOLLO_TOOLKIT_REPO_URL } else { "https://github.com/LaiTszKin/apollo-toolkit.git" }
$ToolkitHome = if ($env:APOLLO_TOOLKIT_HOME) { $env:APOLLO_TOOLKIT_HOME } else { Join-Path $HOME ".apollo-toolkit" }

function Show-Banner {
  @"
+------------------------------------------+
|              Apollo Toolkit              |
|      npm installer and skill copier      |
+------------------------------------------+
"@
}

function Test-RepoRoot {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path -PathType Container)) {
    return $false
  }

  $dirs = Get-ChildItem -Path $Path -Directory -ErrorAction SilentlyContinue
  foreach ($dir in $dirs) {
    if (Test-Path -LiteralPath (Join-Path $dir.FullName "SKILL.md") -PathType Leaf) {
      return $true
    }
  }

  return $false
}

function Bootstrap-RepoIfNeeded {
  if (Test-Path -LiteralPath (Join-Path $ToolkitHome ".git") -PathType Container) {
    git -C $ToolkitHome pull --ff-only | Out-Null
  }
  else {
    if (Test-Path -LiteralPath $ToolkitHome) {
      Remove-Item -LiteralPath $ToolkitHome -Force -Recurse
    }
    git clone --depth 1 $ToolkitRepoUrl $ToolkitHome | Out-Null
  }
}

$scriptPath = $MyInvocation.MyCommand.Path
$candidateRepoRoot = $null

if (-not [string]::IsNullOrWhiteSpace($scriptPath)) {
  $scriptDir = Split-Path -Parent $scriptPath
  $candidateRepoRoot = Split-Path -Parent $scriptDir
}

if (Test-RepoRoot -Path $candidateRepoRoot) {
  $RepoRoot = $candidateRepoRoot
}
elseif (Test-RepoRoot -Path (Get-Location).Path) {
  $RepoRoot = (Get-Location).Path
}
else {
  Bootstrap-RepoIfNeeded
  $RepoRoot = $ToolkitHome
}

function Get-SkillPaths {
  $dirs = Get-ChildItem -Path $RepoRoot -Directory | Sort-Object Name
  $skills = @()

  foreach ($dir in $dirs) {
    if (Test-Path -LiteralPath (Join-Path $dir.FullName "SKILL.md") -PathType Leaf) {
      $skills += $dir.FullName
    }
  }

  if ($skills.Count -eq 0) {
    throw "No skill folders found in: $RepoRoot"
  }

  return $skills
}

function Add-ModeOnce {
  param(
    [System.Collections.Generic.List[string]]$Selected,
    [string]$Mode
  )

  if (-not $Selected.Contains($Mode)) {
    $Selected.Add($Mode)
  }
}

function Resolve-Modes {
  param([string[]]$Requested)

  $selected = [System.Collections.Generic.List[string]]::new()

  if ($Requested.Count -eq 0) {
    Show-Banner
    Write-Host ""
    Write-Host "Select install options (comma-separated):"
    Write-Host "1) codex (~/.codex/skills)"
    Write-Host "2) openclaw (~/.openclaw/workspace*/skills)"
    Write-Host "3) trae (~/.trae/skills)"
    Write-Host "4) agents (~/.agents/skills)"
    Write-Host "5) all"
    $inputValue = Read-Host "Enter choice(s) [1-5]"

    foreach ($rawChoice in ($inputValue -split ",")) {
      $choice = $rawChoice.Trim()
      switch ($choice) {
        "1" { Add-ModeOnce -Selected $selected -Mode "codex" }
        "2" { Add-ModeOnce -Selected $selected -Mode "openclaw" }
        "3" { Add-ModeOnce -Selected $selected -Mode "trae" }
        "4" { Add-ModeOnce -Selected $selected -Mode "agents" }
        "5" {
          Add-ModeOnce -Selected $selected -Mode "codex"
          Add-ModeOnce -Selected $selected -Mode "openclaw"
          Add-ModeOnce -Selected $selected -Mode "trae"
          Add-ModeOnce -Selected $selected -Mode "agents"
        }
        default {
          throw "Invalid choice: $choice"
        }
      }
    }
  }
  else {
    foreach ($mode in $Requested) {
      switch ($mode.ToLowerInvariant()) {
        "codex" { Add-ModeOnce -Selected $selected -Mode "codex" }
        "openclaw" { Add-ModeOnce -Selected $selected -Mode "openclaw" }
        "trae" { Add-ModeOnce -Selected $selected -Mode "trae" }
        "agents" { Add-ModeOnce -Selected $selected -Mode "agents" }
        "all" {
          Add-ModeOnce -Selected $selected -Mode "codex"
          Add-ModeOnce -Selected $selected -Mode "openclaw"
          Add-ModeOnce -Selected $selected -Mode "trae"
          Add-ModeOnce -Selected $selected -Mode "agents"
        }
        default {
          Show-Usage
          throw "Invalid mode: $mode"
        }
      }
    }
  }

  if ($selected.Count -eq 0) {
    throw "No install option selected."
  }

  return $selected
}

function Remove-PathForce {
  param([string]$Target)

  if (Test-Path -LiteralPath $Target) {
    Remove-Item -LiteralPath $Target -Force -Recurse
  }
}

function Copy-Skill {
  param(
    [string]$Source,
    [string]$TargetRoot
  )

  $name = Split-Path -Path $Source -Leaf
  $target = Join-Path $TargetRoot $name

  New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
  Remove-PathForce -Target $target

  Copy-Item -LiteralPath $Source -Destination $target -Recurse -Force
  Write-Host "[copied] $Source -> $target"
}

function Install-Codex {
  param([string[]]$SkillPaths)

  $target = if ($env:CODEX_SKILLS_DIR) {
    $env:CODEX_SKILLS_DIR
  }
  else {
    Join-Path $HOME ".codex/skills"
  }

  Write-Host "Installing to codex: $target"
  foreach ($src in $SkillPaths) {
    Copy-Skill -Source $src -TargetRoot $target
  }
}

function Install-OpenClaw {
  param([string[]]$SkillPaths)

  $openclawHome = if ($env:OPENCLAW_HOME) {
    $env:OPENCLAW_HOME
  }
  else {
    Join-Path $HOME ".openclaw"
  }

  if (-not (Test-Path -LiteralPath $openclawHome -PathType Container)) {
    throw "OpenClaw home not found: $openclawHome"
  }

  $workspaces = Get-ChildItem -Path $openclawHome -Directory -Filter "workspace*" | Sort-Object Name
  if ($workspaces.Count -eq 0) {
    throw "No workspace directories found under: $openclawHome"
  }

  foreach ($workspace in $workspaces) {
    $skillsDir = Join-Path $workspace.FullName "skills"
    Write-Host "Installing to openclaw workspace: $skillsDir"
    foreach ($src in $SkillPaths) {
      Copy-Skill -Source $src -TargetRoot $skillsDir
    }
  }
}

function Install-Trae {
  param([string[]]$SkillPaths)

  $target = if ($env:TRAE_SKILLS_DIR) {
    $env:TRAE_SKILLS_DIR
  }
  else {
    Join-Path $HOME ".trae/skills"
  }

  Write-Host "Installing to trae: $target"
  foreach ($src in $SkillPaths) {
    Copy-Skill -Source $src -TargetRoot $target
  }
}

function Install-Agents {
  param([string[]]$SkillPaths)

  $target = if ($env:AGENTS_SKILLS_DIR) {
    $env:AGENTS_SKILLS_DIR
  }
  else {
    Join-Path $HOME ".agents/skills"
  }

  Write-Host "Installing to agents: $target"
  foreach ($src in $SkillPaths) {
    Copy-Skill -Source $src -TargetRoot $target
  }
}

if ($Modes.Count -gt 0 -and ($Modes[0] -eq "-h" -or $Modes[0] -eq "--help")) {
  Show-Usage
  exit 0
}

$selectedModes = Resolve-Modes -Requested $Modes
$skillPaths = Get-SkillPaths

foreach ($mode in $selectedModes) {
  switch ($mode) {
    "codex" { Install-Codex -SkillPaths $skillPaths }
    "openclaw" { Install-OpenClaw -SkillPaths $skillPaths }
    "trae" { Install-Trae -SkillPaths $skillPaths }
    "agents" { Install-Agents -SkillPaths $skillPaths }
    default { throw "Unknown mode: $mode" }
  }
}

Write-Host "Done."
