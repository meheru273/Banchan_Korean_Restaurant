# Restart Render services from PowerShell (no jq / bash needed — you're on Windows).
#
#   $env:RENDER_API_KEY = 'rnd_xxxxxxxx'   # Dashboard → Account Settings → API Keys
#   .\scripts\render-restart.ps1           # restart all banchan-* services
#   .\scripts\render-restart.ps1 banchan-menu
#
# A restart only helps a wedged process — it does not deploy new code.

param([string]$Name)

if (-not $env:RENDER_API_KEY) {
  throw 'Set $env:RENDER_API_KEY first (Dashboard - Account Settings - API Keys)'
}

$api = 'https://api.render.com/v1'
$headers = @{ Authorization = "Bearer $($env:RENDER_API_KEY)"; Accept = 'application/json' }

# The API wraps each result as { service: {...}, cursor: '...' }
$all = Invoke-RestMethod -Uri "$api/services?limit=100" -Headers $headers | ForEach-Object { $_.service }

$targets = if ($Name) {
  $all | Where-Object { $_.name -eq $Name }
} else {
  $all | Where-Object { $_.name -like 'banchan*' }
}

if (-not $targets) {
  Write-Host 'No matching services. Services on this account:'
  $all | ForEach-Object { Write-Host "  $($_.name)" }
  exit 1
}

foreach ($svc in $targets) {
  try {
    Invoke-RestMethod -Method Post -Uri "$api/services/$($svc.id)/restart" -Headers $headers | Out-Null
    Write-Host "restarting $($svc.name) ($($svc.id))"
  } catch {
    Write-Host "FAILED $($svc.name) - $($_.Exception.Message)"
  }
}

Write-Host ''
Write-Host 'Restarts queued. Each takes ~30-60s. Watch progress in the dashboard logs.'
