# Downloads the official Node.js Windows x64 binary ZIP into runtime\node.
# Uses the ZIP distribution (not the MSI), so it works even when the Windows
# Installer service is broken — the error the user hit during Node.js Setup.

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$RuntimeDir = Join-Path $Root 'runtime\node'
$NodeExe = Join-Path $RuntimeDir 'node.exe'

if (Test-Path $NodeExe) {
  Write-Host "[ok] Node portatil ja existe: $NodeExe"
  exit 0
}

$version = 'v22.19.0'
$zipName = "node-$version-win-x64.zip"
$url = "https://nodejs.org/dist/$version/$zipName"
$tmpDir = Join-Path $env:TEMP ("wd-node-" + [guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $tmpDir $zipName

New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $RuntimeDir) | Out-Null

try {
  Write-Host "Baixando $url ..."
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

  Write-Host "Extraindo..."
  Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force

  $extracted = Join-Path $tmpDir ("node-$version-win-x64")
  if (-not (Test-Path (Join-Path $extracted 'node.exe'))) {
    throw "ZIP do Node extraiu sem node.exe"
  }

  if (Test-Path $RuntimeDir) {
    Remove-Item -Recurse -Force $RuntimeDir
  }
  Move-Item -Path $extracted -Destination $RuntimeDir

  if (-not (Test-Path $NodeExe)) {
    throw "Falha ao instalar Node portatil em $RuntimeDir"
  }

  Write-Host "[ok] Node portatil pronto: $NodeExe"
  & $NodeExe -v
  exit 0
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
finally {
  if (Test-Path $tmpDir) {
    Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
  }
}
