param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RawArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Usage {
  @"
Usage:
  ./scripts/install_skills.ps1 [install] [codex|openclaw|trae|agents|claude-code|all]...
  ./scripts/install_skills.ps1 uninstall [codex|openclaw|trae|agents|claude-code|all]...

Modes:
  codex       Copy skills into ~/.codex/skills (includes ./codex/ agent-specific skills)
  openclaw    Copy skills into ~/.openclaw/workspace*/skills
  trae        Copy skills into ~/.trae/skills
  agents      Copy skills into ~/.agents/skills (for agent-skill-compatible software)
  claude-code Copy skills into ~/.claude/skills
  all         Install all supported targets

Options:
  --symlink   Install skills as symlinks (recommended; auto-update via git pull)
  --copy      Install skills as file copies (manual reinstall for updates)

Optional environment overrides:
  CODEX_SKILLS_DIR         Override codex skills destination path
  OPENCLAW_HOME            Override openclaw home path
  TRAE_SKILLS_DIR          Override trae skills destination path
  AGENTS_SKILLS_DIR        Override agents skills destination path
  CLAUDE_CODE_SKILLS_DIR   Override claude-code skills destination path
  APOLLO_TOOLKIT_HOME       Override local install path used when repo root is unavailable
  APOLLO_TOOLKIT_REPO_URL   Override git repository URL used when repo root is unavailable
"@
}

$Script:ToolkitRepoUrl = if ($env:APOLLO_TOOLKIT_REPO_URL) { $env:APOLLO_TOOLKIT_REPO_URL } else { "https://github.com/LaiTszKin/apollo-toolkit.git" }
$Script:ManifestFilename = ".apollo-toolkit-manifest.json"

function Expand-UserPath {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $Path
  }

  if ($Path -eq "~") {
    return $HOME
  }

  if ($Path.StartsWith("~/") -or $Path.StartsWith('~\')) {
    $trimmed = $Path.Substring(2)
    return Join-Path $HOME $trimmed
  }

  return $Path
}

$Script:ToolkitHome = if ($env:APOLLO_TOOLKIT_HOME) { Expand-UserPath $env:APOLLO_TOOLKIT_HOME } else { Join-Path $HOME ".apollo-toolkit" }

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
  if (Test-Path -LiteralPath (Join-Path $Script:ToolkitHome ".git") -PathType Container) {
    git -C $Script:ToolkitHome pull --ff-only | Out-Null
  }
  else {
    if (Test-Path -LiteralPath $Script:ToolkitHome) {
      Remove-Item -LiteralPath $Script:ToolkitHome -Force -Recurse
    }
    git clone --depth 1 $Script:ToolkitRepoUrl $Script:ToolkitHome | Out-Null
  }
}

$Script:LinkMode = ""
$Script:ScriptPath = $MyInvocation.MyCommand.Path
$candidateRepoRoot = $null

if (-not [string]::IsNullOrWhiteSpace($Script:ScriptPath)) {
  $scriptDir = Split-Path -Parent $Script:ScriptPath
  $candidateRepoRoot = Split-Path -Parent $scriptDir
}

if (Test-RepoRoot -Path $candidateRepoRoot) {
  $Script:RepoRoot = $candidateRepoRoot
}
elseif (Test-RepoRoot -Path (Get-Location).Path) {
  $Script:RepoRoot = (Get-Location).Path
}
else {
  Bootstrap-RepoIfNeeded
  $Script:RepoRoot = $Script:ToolkitHome
}

# ---- Skill collection ----

function Get-SkillPathGroups {
  param([string[]]$SelectedModes)

  $dirs = Get-ChildItem -Path $Script:RepoRoot -Directory | Sort-Object Name
  $sharedSkills = @()
  $codexSkills = @()

  foreach ($dir in $dirs) {
    if (Test-Path -LiteralPath (Join-Path $dir.FullName "SKILL.md") -PathType Leaf) {
      $sharedSkills += $dir.FullName
    }
  }

  if ($SelectedModes -contains "codex") {
    $codexDir = Join-Path $Script:RepoRoot "codex"
    if (Test-Path -LiteralPath $codexDir -PathType Container) {
      $codexDirs = Get-ChildItem -Path $codexDir -Directory | Sort-Object Name
      foreach ($dir in $codexDirs) {
        if (Test-Path -LiteralPath (Join-Path $dir.FullName "SKILL.md") -PathType Leaf) {
          $codexSkills += $dir.FullName
        }
      }
    }
  }

  if ($sharedSkills.Count -eq 0) {
    throw "No skill folders found in: $($Script:RepoRoot)"
  }

  [PSCustomObject]@{
    Shared = $sharedSkills
    Codex  = $codexSkills
  }
}

function Get-SkillNames {
  param([string[]]$Paths)

  $names = @()
  foreach ($p in $Paths) {
    $names += Split-Path -Path $p -Leaf
  }
  return ($names | Sort-Object -Unique)
}

# ---- Manifest management ----

function Read-ManifestSkills {
  param([string]$TargetRoot)

  $manifestPath = Join-Path $TargetRoot $Script:ManifestFilename
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    return @()
  }

  try {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $skills = @()
    if ($manifest.historicalSkills) {
      $skills += $manifest.historicalSkills
    }
    if ($manifest.skills) {
      $skills += $manifest.skills
    }
    return ($skills | Sort-Object -Unique)
  }
  catch {
    return @()
  }
}

function Write-Manifest {
  param(
    [string]$TargetRoot,
    [string]$Version,
    [string]$LinkMode,
    [string[]]$SkillNames
  )

  $manifestPath = Join-Path $TargetRoot $Script:ManifestFilename
  $historicalSkills = @()
  if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
    $historicalSkills = Read-ManifestSkills -TargetRoot $TargetRoot
  }

  $merged = @()
  $merged += $historicalSkills
  $merged += $SkillNames
  $allSkills = ($merged | Sort-Object -Unique)

  $manifest = [PSCustomObject]@{
    version          = $Version
    installedAt      = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    linkMode         = $LinkMode
    skills           = ($SkillNames | Sort-Object -Unique)
    historicalSkills = $allSkills
  }

  New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
  $manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
}

# ---- Install operations ----

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

function Symlink-Skill {
  param(
    [string]$Source,
    [string]$TargetRoot
  )

  $name = Split-Path -Path $Source -Leaf
  $target = Join-Path $TargetRoot $name

  New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
  Remove-PathForce -Target $target

  New-Item -ItemType SymbolicLink -Path $target -Target $Source -Force | Out-Null
  Write-Host "[symlink] $Source -> $target"
}

function Do-Replace {
  param(
    [string]$Source,
    [string]$TargetRoot
  )

  if ($Script:LinkMode -eq "symlink") {
    Symlink-Skill -Source $Source -TargetRoot $TargetRoot
  }
  else {
    Copy-Skill -Source $Source -TargetRoot $TargetRoot
  }
}

function Remove-PathForce {
  param([string]$Target)

  if (Test-Path -LiteralPath $Target) {
    Remove-Item -LiteralPath $Target -Force -Recurse
  }
}

# ---- Uninstall operations ----

function Uninstall-Target {
  param(
    [string]$TargetRoot,
    [string]$TargetLabel
  )

  $manifestPath = Join-Path $TargetRoot $Script:ManifestFilename
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    Write-Host "[skip] No manifest found in: $TargetRoot"
    return
  }

  $skills = Read-ManifestSkills -TargetRoot $TargetRoot
  if ($skills.Count -eq 0) {
    Write-Host "[skip] No skills in manifest: $TargetRoot"
    Remove-Item -LiteralPath $manifestPath -Force -ErrorAction SilentlyContinue
    return
  }

  Write-Host "Uninstalling from $($TargetLabel): $TargetRoot"
  foreach ($name in $skills) {
    $skillPath = Join-Path $TargetRoot $name
    if (Test-Path -LiteralPath $skillPath) {
      Remove-Item -LiteralPath $skillPath -Force -Recurse
      Write-Host "  [removed] $skillPath"
    }
  }

  Remove-Item -LiteralPath $manifestPath -Force -ErrorAction SilentlyContinue
  Write-Host "  [removed manifest] $manifestPath"
}

function Invoke-Uninstall {
  param([string[]]$SelectedModes)

  if ($SelectedModes.Count -eq 0) {
    $SelectedModes = @("codex", "openclaw", "trae", "agents", "claude-code")
  }

  Write-Host "Uninstalling Apollo Toolkit skills..."
  Write-Host "Target modes: $($SelectedModes -join ', ')"
  Write-Host ""

  # Show all known skills
  $skillGroups = Get-SkillPathGroups -SelectedModes $SelectedModes
  $currentNames = Get-SkillNames -Paths ($skillGroups.Shared + $skillGroups.Codex)
  $allNames = @()
  $allNames += $currentNames

  # Collect historical from manifests
  $targetDirs = @()
  foreach ($m in $SelectedModes) {
    switch ($m) {
      "codex" {
        $d = if ($env:CODEX_SKILLS_DIR) { Expand-UserPath $env:CODEX_SKILLS_DIR } else { Join-Path $HOME ".codex/skills" }
        $targetDirs += $d
      }
      "openclaw" {
        $oh = if ($env:OPENCLAW_HOME) { Expand-UserPath $env:OPENCLAW_HOME } else { Join-Path $HOME ".openclaw" }
        if (Test-Path -LiteralPath $oh) {
          foreach ($ws in (Get-ChildItem -Path $oh -Directory -Filter "workspace*")) {
            $targetDirs += (Join-Path $ws.FullName "skills")
          }
        }
      }
      "trae" {
        $d = if ($env:TRAE_SKILLS_DIR) { Expand-UserPath $env:TRAE_SKILLS_DIR } else { Join-Path $HOME ".trae/skills" }
        $targetDirs += $d
      }
      "agents" {
        $d = if ($env:AGENTS_SKILLS_DIR) { Expand-UserPath $env:AGENTS_SKILLS_DIR } else { Join-Path $HOME ".agents/skills" }
        $targetDirs += $d
      }
      "claude-code" {
        $d = if ($env:CLAUDE_CODE_SKILLS_DIR) { Expand-UserPath $env:CLAUDE_CODE_SKILLS_DIR } else { Join-Path $HOME ".claude/skills" }
        $targetDirs += $d
      }
    }
  }

  foreach ($td in $targetDirs) {
    $allNames += (Read-ManifestSkills -TargetRoot $td)
  }

  $allKnown = ($allNames | Sort-Object -Unique)
  Write-Host "All known skills (current + historical):"
  foreach ($n in $allKnown) {
    Write-Host "  - $n"
  }
  Write-Host ""

  foreach ($m in $SelectedModes) {
    switch ($m) {
      "codex" {
        $d = if ($env:CODEX_SKILLS_DIR) { Expand-UserPath $env:CODEX_SKILLS_DIR } else { Join-Path $HOME ".codex/skills" }
        Uninstall-Target -TargetRoot $d -TargetLabel "codex"
      }
      "trae" {
        $d = if ($env:TRAE_SKILLS_DIR) { Expand-UserPath $env:TRAE_SKILLS_DIR } else { Join-Path $HOME ".trae/skills" }
        Uninstall-Target -TargetRoot $d -TargetLabel "trae"
      }
      "agents" {
        $d = if ($env:AGENTS_SKILLS_DIR) { Expand-UserPath $env:AGENTS_SKILLS_DIR } else { Join-Path $HOME ".agents/skills" }
        Uninstall-Target -TargetRoot $d -TargetLabel "agents"
      }
      "claude-code" {
        $d = if ($env:CLAUDE_CODE_SKILLS_DIR) { Expand-UserPath $env:CLAUDE_CODE_SKILLS_DIR } else { Join-Path $HOME ".claude/skills" }
        Uninstall-Target -TargetRoot $d -TargetLabel "claude-code"
      }
      "openclaw" {
        $oh = if ($env:OPENCLAW_HOME) { Expand-UserPath $env:OPENCLAW_HOME } else { Join-Path $HOME ".openclaw" }
        if (Test-Path -LiteralPath $oh) {
          foreach ($ws in (Get-ChildItem -Path $oh -Directory -Filter "workspace*")) {
            Uninstall-Target -TargetRoot (Join-Path $ws.FullName "skills") -TargetLabel "openclaw"
          }
        }
      }
    }
  }

  Write-Host "Done."
}

# ---- Install functions ----

function Install-Codex {
  param([string[]]$SkillPaths)

  $target = if ($env:CODEX_SKILLS_DIR) {
    Expand-UserPath $env:CODEX_SKILLS_DIR
  }
  else {
    Join-Path $HOME ".codex/skills"
  }

  Write-Host "Installing to codex: $target (mode: $Script:LinkMode)"
  $skillNames = @()
  foreach ($src in $SkillPaths) {
    Do-Replace -Source $src -TargetRoot $target
    $skillNames += (Split-Path -Path $src -Leaf)
  }
  Write-Manifest -TargetRoot $target -Version $Script:Version -LinkMode $Script:LinkMode -SkillNames $skillNames
}

function Install-OpenClaw {
  param([string[]]$SkillPaths)

  $openclawHome = if ($env:OPENCLAW_HOME) {
    Expand-UserPath $env:OPENCLAW_HOME
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
    Write-Host "Installing to openclaw workspace: $skillsDir (mode: $Script:LinkMode)"
    $skillNames = @()
    foreach ($src in $SkillPaths) {
      Do-Replace -Source $src -TargetRoot $skillsDir
      $skillNames += (Split-Path -Path $src -Leaf)
    }
    Write-Manifest -TargetRoot $skillsDir -Version $Script:Version -LinkMode $Script:LinkMode -SkillNames $skillNames
  }
}

function Install-Trae {
  param([string[]]$SkillPaths)

  $target = if ($env:TRAE_SKILLS_DIR) {
    Expand-UserPath $env:TRAE_SKILLS_DIR
  }
  else {
    Join-Path $HOME ".trae/skills"
  }

  Write-Host "Installing to trae: $target (mode: $Script:LinkMode)"
  $skillNames = @()
  foreach ($src in $SkillPaths) {
    Do-Replace -Source $src -TargetRoot $target
    $skillNames += (Split-Path -Path $src -Leaf)
  }
  Write-Manifest -TargetRoot $target -Version $Script:Version -LinkMode $Script:LinkMode -SkillNames $skillNames
}

function Install-Agents {
  param([string[]]$SkillPaths)

  $target = if ($env:AGENTS_SKILLS_DIR) {
    Expand-UserPath $env:AGENTS_SKILLS_DIR
  }
  else {
    Join-Path $HOME ".agents/skills"
  }

  Write-Host "Installing to agents: $target (mode: $Script:LinkMode)"
  $skillNames = @()
  foreach ($src in $SkillPaths) {
    Do-Replace -Source $src -TargetRoot $target
    $skillNames += (Split-Path -Path $src -Leaf)
  }
  Write-Manifest -TargetRoot $target -Version $Script:Version -LinkMode $Script:LinkMode -SkillNames $skillNames
}

function Install-ClaudeCode {
  param([string[]]$SkillPaths)

  $target = if ($env:CLAUDE_CODE_SKILLS_DIR) {
    Expand-UserPath $env:CLAUDE_CODE_SKILLS_DIR
  }
  else {
    Join-Path $HOME ".claude/skills"
  }

  Write-Host "Installing to claude-code: $target (mode: $Script:LinkMode)"
  $skillNames = @()
  foreach ($src in $SkillPaths) {
    Do-Replace -Source $src -TargetRoot $target
    $skillNames += (Split-Path -Path $src -Leaf)
  }
  Write-Manifest -TargetRoot $target -Version $Script:Version -LinkMode $Script:LinkMode -SkillNames $skillNames
}

# ---- Mode management ----

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
    Write-Host "1) codex (~/.codex/skills, includes ./codex/ agent-specific skills)"
    Write-Host "2) openclaw (~/.openclaw/workspace*/skills)"
    Write-Host "3) trae (~/.trae/skills)"
    Write-Host "4) agents (~/.agents/skills)"
    Write-Host "5) claude-code (~/.claude/skills)"
    Write-Host "6) all"
    $inputValue = Read-Host "Enter choice(s) [1-6]"

    foreach ($rawChoice in ($inputValue -split ",")) {
      $choice = $rawChoice.Trim()
      switch ($choice) {
        "1" { Add-ModeOnce -Selected $selected -Mode "codex" }
        "2" { Add-ModeOnce -Selected $selected -Mode "openclaw" }
        "3" { Add-ModeOnce -Selected $selected -Mode "trae" }
        "4" { Add-ModeOnce -Selected $selected -Mode "agents" }
        "5" { Add-ModeOnce -Selected $selected -Mode "claude-code" }
        "6" {
          Add-ModeOnce -Selected $selected -Mode "codex"
          Add-ModeOnce -Selected $selected -Mode "openclaw"
          Add-ModeOnce -Selected $selected -Mode "trae"
          Add-ModeOnce -Selected $selected -Mode "agents"
          Add-ModeOnce -Selected $selected -Mode "claude-code"
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
        "claude-code" { Add-ModeOnce -Selected $selected -Mode "claude-code" }
        "all" {
          Add-ModeOnce -Selected $selected -Mode "codex"
          Add-ModeOnce -Selected $selected -Mode "openclaw"
          Add-ModeOnce -Selected $selected -Mode "trae"
          Add-ModeOnce -Selected $selected -Mode "agents"
          Add-ModeOnce -Selected $selected -Mode "claude-code"
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

function Read-YesNo {
  param(
    [string]$Prompt,
    [bool]$DefaultYes = $true
  )

  $hint = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
  $result = Read-Host "$Prompt $hint"
  if ([string]::IsNullOrWhiteSpace($result)) {
    return $DefaultYes
  }
  $trimmed = $result.Trim().ToLowerInvariant()
  return ($trimmed -eq "y" -or $trimmed -eq "yes")
}

function Prompt-LinkMode {
  Write-Host ""
  Write-Host "Symlink mode:"
  Write-Host "  Pro: Skills auto-update when you 'git pull' in ~/.apollo-toolkit"
  Write-Host "  Pro: No need to re-run installer after patch updates"
  Write-Host "  Con: Changes pushed to the repo automatically reflect in your skills -"
  Write-Host "       you may receive updates you did not intend to accept"
  Write-Host ""

  if (Read-YesNo -Prompt "Install skills as symlinks (recommended)?" -DefaultYes $true) {
    $Script:LinkMode = "symlink"
  }
  else {
    $Script:LinkMode = "copy"
  }
  Write-Host "Using: $Script:LinkMode"
}

function Prompt-IncludeExclusive {
  param(
    [string[]]$SelectedModes,
    [string[]]$CodexSkillPaths
  )

  if ($CodexSkillPaths.Count -eq 0) {
    return
  }

  $hasNonCodex = $false
  foreach ($m in $SelectedModes) {
    if ($m -ne "codex") {
      $hasNonCodex = $true
      break
    }
  }

  if (-not $hasNonCodex) {
    return
  }

  $codexOnlyNames = @()
  foreach ($cp in $CodexSkillPaths) {
    $codexOnlyNames += (Split-Path -Path $cp -Leaf)
  }

  Write-Host ""
  Write-Host "Exclusive skills detected:"
  Write-Host "  The following skills are exclusive to codex: $($codexOnlyNames -join ', ')"
  Write-Host "  Your selected non-codex targets: $(($SelectedModes | Where-Object { $_ -ne 'codex' }) -join ', ')"

  if (Read-YesNo -Prompt "Install codex-exclusive skills to non-codex targets as well?" -DefaultYes $false) {
    return $true
  }
  return $false
}

# ---- Version detection ----
$Script:Version = "unknown"
$pkgJsonPath = Join-Path $Script:RepoRoot "package.json"
if (Test-Path -LiteralPath $pkgJsonPath -PathType Leaf) {
  try {
    $pkg = Get-Content -LiteralPath $pkgJsonPath -Raw | ConvertFrom-Json
    if ($pkg.version) {
      $Script:Version = $pkg.version
    }
  }
  catch { }
}

# ---- Main ----

# Parse arguments
$Args = @()
$Command = "install"
foreach ($arg in $RawArgs) {
  switch ($arg) {
    "-h" { Show-Usage; exit 0 }
    "--help" { Show-Usage; exit 0 }
    "--symlink" { $Script:LinkMode = "symlink" }
    "--copy" { $Script:LinkMode = "copy" }
    default { $Args += $arg }
  }
}

if ($Args.Count -gt 0 -and $Args[0] -eq "uninstall") {
  $Command = "uninstall"
  $Args = $Args[1..($Args.Count - 1)]
}
elseif ($Args.Count -gt 0 -and $Args[0] -eq "install") {
  $Args = $Args[1..($Args.Count - 1)]
}

# Resolve modes
$selectedModes = Resolve-Modes -Requested $Args

if ($Command -eq "uninstall") {
  Invoke-Uninstall -SelectedModes $selectedModes
  exit 0
}

# Install flow
$skillPathGroups = Get-SkillPathGroups -SelectedModes $selectedModes

# Prompt for link mode if not set
if ([string]::IsNullOrEmpty($Script:LinkMode)) {
  Prompt-LinkMode
}

# Prompt for exclusive skills inclusion
$includeExclusive = Prompt-IncludeExclusive -SelectedModes $selectedModes -CodexSkillPaths $skillPathGroups.Codex
$effectiveShared = $skillPathGroups.Shared
if ($includeExclusive) {
  $effectiveShared += $skillPathGroups.Codex
}

# Summarize and install
Write-Host ""
Write-Host "Apollo Toolkit repo: $($Script:RepoRoot)"
Write-Host "Install mode: $Script:LinkMode"
Write-Host "Targets: $($selectedModes -join ', ')"
Write-Host ""

foreach ($mode in $selectedModes) {
  switch ($mode) {
    "codex" { Install-Codex -SkillPaths ($effectiveShared + $skillPathGroups.Codex) }
    "openclaw" { Install-OpenClaw -SkillPaths $effectiveShared }
    "trae" { Install-Trae -SkillPaths $effectiveShared }
    "agents" { Install-Agents -SkillPaths $effectiveShared }
    "claude-code" { Install-ClaudeCode -SkillPaths $effectiveShared }
    default { throw "Unknown mode: $mode" }
  }
}

Write-Host "Done."
