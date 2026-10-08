param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDirectory
$previewUrl = 'http://127.0.0.1:5173/'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if ($nodeCommand) {
    $nodeExecutable = $nodeCommand.Source
} elseif (Test-Path -LiteralPath $bundledNode) {
    $nodeExecutable = $bundledNode
} else {
    Write-Host 'Node.js is required. Install Node.js 22.12+ or 24, then run this file again.'
    exit 1
}
$env:PATH = (Split-Path -Parent $nodeExecutable) + ';' + $env:PATH

try {
    $existingPreview = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 2
    if ($existingPreview.StatusCode -eq 200 -and $existingPreview.Content.Contains('AI') -and $existingPreview.Content.Contains('/src/main.jsx')) {
        if (-not $NoBrowser) { Start-Process $previewUrl }
        Write-Host "Portfolio is already running: $previewUrl"
        exit 0
    }
} catch {
    # A stopped preview is expected. Start the local development server below.
}

$viteEntry = Join-Path $projectDirectory 'node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $viteEntry)) {
    $bundledPnpm = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $bundledPnpm) {
        & $bundledPnpm install --frozen-lockfile
    } elseif ($npmCommand) {
        & $npmCommand.Source install
    } else {
        Write-Host 'Install project dependencies with pnpm install or npm install, then run this file again.'
        exit 1
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Portfolio preview: $previewUrl"
Write-Host 'Keep this window open while previewing. Press Ctrl+C to stop.'
if (-not $NoBrowser) { Start-Process $previewUrl }
& $nodeExecutable $viteEntry --host 127.0.0.1 --port 5173 --strictPort
exit $LASTEXITCODE
