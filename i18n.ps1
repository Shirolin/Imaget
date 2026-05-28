$ErrorActionPreference = "Stop"

$SkillRoot = Join-Path $PSScriptRoot ".agents\skills\i18n-agent-skill"
$VenvPython = Join-Path $SkillRoot ".venv\Scripts\python.exe"

function Test-I18nRuntime {
    param([string]$PythonPath)

    if (-not (Test-Path -LiteralPath $PythonPath)) {
        return $false
    }

    & $PythonPath -c "import i18n_agent_skill" *> $null
    return $LASTEXITCODE -eq 0
}

function Find-BootstrapPython {
    foreach ($candidate in @("python", "python3")) {
        if (Get-Command $candidate -ErrorAction SilentlyContinue) {
            & $candidate -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" *> $null
            if ($LASTEXITCODE -eq 0) {
                return $candidate
            }
        }
    }
    return $null
}

if (-not (Test-I18nRuntime $VenvPython)) {
    $InstallScript = Join-Path $SkillRoot "scripts\install.py"
    $BootstrapPython = Find-BootstrapPython

    if (-not $BootstrapPython) {
        Write-Error (
            "i18n-agent-skill virtual environment is missing or broken, " +
            "and Python 3.10+ was not found on PATH. " +
            "Re-run the skill installer with an available Python runtime."
        )
        exit 1
    }

    & $BootstrapPython $InstallScript
}

if (-not (Test-I18nRuntime $VenvPython)) {
    Write-Error "i18n-agent-skill virtual environment is still unavailable after reinstall."
    exit 1
}

& $VenvPython -m i18n_agent_skill @args
