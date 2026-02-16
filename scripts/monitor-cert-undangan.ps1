# Monitor DNS for kkmrat.web.id (undangan) and run Certbot on server when propagated
# Usage: .\scripts\monitor-cert-undangan.ps1

$Domain = 'kkmrat.web.id'
$ExpectedIP = '146.190.87.175'
$IntervalSec = 30
$MaxMinutes = 30
$Attempts = [math]::Ceiling(($MaxMinutes * 60) / $IntervalSec)
$CertEmail = 'nandang.dhe@gmail.com'

function Get-ARecords($name) {
  try {
    $r = Resolve-DnsName -Name $name -Type A -Server 1.1.1.1 -ErrorAction Stop
    return $r | ForEach-Object { $_.IPAddress.ToString() }
  } catch {
    # fallback to nslookup (some environments may not have Resolve-DnsName)
    $out = nslookup $name 1.1.1.1 2>&1
    $text = @($out) -join "`n"
    $m = [regex]::Match($text, 'Address:\s+(\d+\.\d+\.\d+\.\d+)')
    if ($m.Success) { return @($m.Groups[1].Value) }
    return @()
  }
}

Write-Host "Monitoring DNS for $Domain (expecting $ExpectedIP) — max ${MaxMinutes}m, interval ${IntervalSec}s"
$found = $false
for ($i = 1; $i -le $Attempts; $i++) {
  Write-Host "[$i/$Attempts] Checking DNS..." -NoNewline
  $ips = Get-ARecords $Domain
  if ($ips.Count -gt 0) { Write-Host " -> returned: $($ips -join ', ')" } else { Write-Host " -> no answer" }
  if ($ips -contains $ExpectedIP) { $found = $true; break }
  Start-Sleep -Seconds $IntervalSec
}

if (-not $found) {
  Write-Host "Timeout: DNS did not propagate within $MaxMinutes minutes." -ForegroundColor Yellow
  exit 2
}

Write-Host "DNS propagated — running Certbot on droplet..." -ForegroundColor Green

# Run Certbot (webroot) on server
$certCmd = "sudo certbot certonly -w /opt/stack/web/kkmrat -d kkmrat.web.id -d www.kkmrat.web.id --email $CertEmail --agree-tos --no-eff-email --non-interactive"
Write-Host "SSH -> $certCmd"
$certOut = & ssh portfolio-droplet $certCmd 2>&1
Write-Host $certOut
if ($LASTEXITCODE -ne 0) {
  Write-Host "Certbot failed (exit $LASTEXITCODE). See output above." -ForegroundColor Red
  exit 3
}

Write-Host "Certbot succeeded — copying certificates into nginx SSL folder and reloading stack..." -ForegroundColor Green
$installCmd = @"
sudo cp /etc/letsencrypt/live/kkmrat.web.id/fullchain.pem /opt/stack/services/nginx/ssl/kkmrat.fullchain.pem || true
sudo cp /etc/letsencrypt/live/kkmrat.web.id/privkey.pem /opt/stack/services/nginx/ssl/kkmrat.privkey.pem || true
sudo chown root:root /opt/stack/services/nginx/ssl/kkmrat.* || true
sudo chmod 640 /opt/stack/services/nginx/ssl/kkmrat.privkey.pem || true
cd /opt/stack && sudo docker compose exec nginx nginx -t && sudo docker compose restart nginx
"@
Write-Host "SSH -> copy + reload nginx"
$installOut = & ssh portfolio-droplet $installCmd 2>&1
Write-Host $installOut

if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to install certificate or reload nginx (exit $LASTEXITCODE)." -ForegroundColor Red
  exit 4
}

Write-Host "Verifying HTTPS..." -ForegroundColor Green
try {
  $resp = Invoke-WebRequest -Uri "https://$Domain" -Method Head -UseBasicParsing -TimeoutSec 10
  Write-Host "HTTPS OK — status: $($resp.StatusCode)"
} catch {
  Write-Host "HTTPS request failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "All done." -ForegroundColor Cyan
exit 0
