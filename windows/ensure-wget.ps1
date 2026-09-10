# Ensures a usable wget.exe for Website Downloader on Windows.
# Preference order: already on PATH, winget install, portable download into vendor/wget.

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$VendorDir = Join-Path $Root 'vendor\wget'
$VendorExe = Join-Path $VendorDir 'wget.exe'

function Test-WgetCommand {
  try {
    $cmd = Get-Command wget.exe -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) { return $cmd.Source }
  } catch {}
  return $null
}

if (Test-Path $VendorExe) {
  Write-Host "[ok] wget portable encontrado: $VendorExe"
  exit 0
}

$existing = Test-WgetCommand
if ($existing) {
  Write-Host "[ok] wget ja esta no PATH: $existing"
  exit 0
}

Write-Host "wget nao encontrado. Tentando winget..."
$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
  try {
    & winget install -e --id JernejSimoncic.Wget --accept-package-agreements --accept-source-agreements
    $existing = Test-WgetCommand
    if ($existing) {
      Write-Host "[ok] wget instalado via winget: $existing"
      exit 0
    }
  } catch {
    Write-Host "[aviso] winget falhou: $($_.Exception.Message)"
  }
}

Write-Host "Baixando wget portable para vendor\wget ..."
New-Item -ItemType Directory -Force -Path $VendorDir | Out-Null

# Official GNU wget Windows builds mirrored by eternallybored (widely used portable binary).
$urls = @(
  'https://eternallybored.org/misc/wget/1.21.4/64/wget.exe',
  'https://eternallybored.org/misc/wget/1.21.4/32/wget.exe'
)

$downloaded = $false
foreach ($url in $urls) {
  try {
    Write-Host "  tentando $url"
    Invoke-WebRequest -Uri $url -OutFile $VendorExe -UseBasicParsing
    if ((Test-Path $VendorExe) -and ((Get-Item $VendorExe).Length -gt 100000)) {
      Write-Host "[ok] wget portable salvo em $VendorExe"
      $downloaded = $true
      break
    }
  } catch {
    Write-Host "  falhou: $($_.Exception.Message)"
  }
}

if (-not $downloaded) {
  Write-Error "Nao foi possivel obter wget.exe. Instale manualmente com winget ou copie wget.exe para vendor\wget\"
  exit 1
}

exit 0
