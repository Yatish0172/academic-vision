param([string]$Python = 'py')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) {
        & $Python -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Python environment creation failed.' }
    }
    & '.\.venv\Scripts\python.exe' -m pip install -r backend/requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
    Write-Output 'Setup complete. Run npm start, then open http://localhost:3000.'
} finally { Pop-Location }
