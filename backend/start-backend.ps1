# Script khởi động backend TravelHub
# Chạy trong PowerShell: .\start-backend.ps1

Write-Host "🚀 Khởi động TravelHub Backend..." -ForegroundColor Cyan
Write-Host ""

# Bước 1: Reset admin password
Write-Host "1️⃣  Đang reset mật khẩu admin..." -ForegroundColor Yellow
node create-admin.js
Write-Host ""

# Bước 2: Start dev server
Write-Host "2️⃣  Đang khởi động NestJS server..." -ForegroundColor Yellow
Write-Host "   → Server sẽ chạy tại http://localhost:3000" -ForegroundColor Green
Write-Host "   → Nhấn Ctrl+C để dừng server" -ForegroundColor Gray
Write-Host ""
npm run start:dev
