$ErrorActionPreference = "Stop"
$env:PGPASSWORD="superman9"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backups"
$backupFile = "$backupDir\chronosecure_local_$timestamp.sql"

# Create backups directory if it doesn't exist
if (-not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

Write-Host "Backing up local 'chronosecure_db'..."
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -d chronosecure_db -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Saved to: $backupFile" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backup FAILED." -ForegroundColor Red
}

Start-Sleep -Seconds 3
