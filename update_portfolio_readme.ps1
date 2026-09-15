# Run this file from the ROOT of your existing oa-ai repository.
$ErrorActionPreference = "Stop"

$updateRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Copy-Item "$updateRoot\README.md" ".\README.md" -Force

New-Item -ItemType Directory -Force ".\docs\screenshots" | Out-Null
Copy-Item "$updateRoot\docs\screenshots\chat-interface.png" ".\docs\screenshots\chat-interface.png" -Force

Write-Host ""
Write-Host "README and screenshot updated successfully." -ForegroundColor Green
Write-Host ""
git status
Write-Host ""
Write-Host "Next:"
Write-Host "  git add README.md docs/screenshots/chat-interface.png"
Write-Host "  git commit -m ""Polish portfolio README and add interface screenshot"""
Write-Host "  git push"
