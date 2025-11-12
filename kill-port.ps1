# PowerShell script to kill process on port 5000
Write-Host "🔍 Finding process on port 5000..." -ForegroundColor Yellow

$port = netstat -ano | findstr :5000 | findstr LISTENING
if ($port) {
    $pid = $port -split '\s+' | Select-Object -Last 1
    Write-Host "⚠️  Found process with PID: $pid" -ForegroundColor Red
    Write-Host "🔫 Killing process..." -ForegroundColor Yellow
    taskkill /PID $pid /F
    Write-Host "✅ Port 5000 is now free!" -ForegroundColor Green
} else {
    Write-Host "✅ Port 5000 is already free!" -ForegroundColor Green
}
