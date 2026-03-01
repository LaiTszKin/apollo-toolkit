param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Modes
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Usage {
  @"
Usage:
  ./scripts/install_skills.ps1 [codex|openclaw|trae|all]...

Modes:
  codex     Install links into ~/.codex/skills
  openclaw  Install links into ~/.openclaw/workspace*/skills
  trae      Install links into ~/.trae/skills
  all       Install all supported targets

Optional environment overrides:
  CODEX_SKILLS_DIR   Override codex skills destination path
  OPENCLAW_HOME      Override openclaw home path
  TRAE_SKILLS_DIR    Override trae skills destination path
"@
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

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
    Write-Host "Select install options (comma-separated):"
    Write-Host "1) codex (~/.codex/skills)"
    Write-Host "2) openclaw (~/.openclaw/workspace*/skills)"
    Write-Host "3) trae (~/.trae/skills)"
    Write-Host "4) all"
    $inputValue = Read-Host "Enter choice(s) [1-4]"

    foreach ($rawChoice in ($inputValue -split ",")) {
      $choice = $rawChoice.Trim()
      switch ($choice) {
        "1" { Add-ModeOnce -Selected $selected -Mode "codex" }
        "2" { Add-ModeOnce -Selected $selected -Mode "openclaw" }
        "3" { Add-ModeOnce -Selected $selected -Mode "trae" }
        "4" {
          Add-ModeOnce -Selected $selected -Mode "codex"
          Add-ModeOnce -Selected $selected -Mode "openclaw"
          Add-ModeOnce -Selected $selected -Mode "trae"
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
        "all" {
          Add-ModeOnce -Selected $selected -Mode "codex"
          Add-ModeOnce -Selected $selected -Mode "openclaw"
          Add-ModeOnce -Selected $selected -Mode "trae"
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

function Link-Skill {
  param(
    [string]$Source,
    [string]$TargetRoot
  )

  $name = Split-Path -Path $Source -Leaf
  $target = Join-Path $TargetRoot $name

  New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
  Remove-PathForce -Target $target

  try {
    New-Item -Path $target -ItemType SymbolicLink -Target $Source -Force | Out-Null
    Write-Host "[linked] $target -> $Source"
  }
  catch {
    # Fallback for environments where symlink permission is restricted.
    New-Item -Path $target -ItemType Junction -Target $Source -Force | Out-Null
    Write-Host "[linked-junction] $target -> $Source"
  }
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
    Link-Skill -Source $src -TargetRoot $target
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
      Link-Skill -Source $src -TargetRoot $skillsDir
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
    Link-Skill -Source $src -TargetRoot $target
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
    default { throw "Unknown mode: $mode" }
  }
}

Write-Host "Done."
