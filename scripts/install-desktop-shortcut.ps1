# Creates (or repairs) the "ATOMICA Sandbox" shortcut on the user's Desktop.
# The shortcut points at the fixed build location, so every `npm run app:build`
# updates what it launches. Safe to run repeatedly.
$ErrorActionPreference = 'Stop'

# Always target the MAIN checkout (first entry of `git worktree list`), even when this script is
# run from an agent's separate worktree, so the shortcut never moves.
$repo = Split-Path -Parent $PSScriptRoot
$main = (git -C $repo worktree list --porcelain | Select-String '^worktree ' | Select-Object -First 1)
if ($main) { $repo = ($main.Line -replace '^worktree ', '') -replace '/', '\' }
$target = Join-Path $repo 'release\win-unpacked\ATOMICA Sandbox.exe'
if (-not (Test-Path $target)) {
    throw "App not built yet: $target missing. Run 'npm run app:build' first."
}

$desktop  = [Environment]::GetFolderPath('Desktop')
$linkPath = Join-Path $desktop 'ATOMICA Sandbox.lnk'

$shell = New-Object -ComObject WScript.Shell
$link  = $shell.CreateShortcut($linkPath)
$link.TargetPath       = $target
$link.WorkingDirectory = Split-Path -Parent $target
$link.IconLocation     = "$target,0"
$link.Description      = 'ATOMICA 2D Molecule Sandbox (always launches the latest build)'
$link.Save()

Write-Output "Shortcut: $linkPath -> $target"
