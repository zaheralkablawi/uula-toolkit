@echo off
reg delete "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "UULA Toolkit" /f >nul 2>&1
rmdir /S /Q "%LOCALAPPDATA%\UULA Toolkit" 2>nul
echo UULA Toolkit was removed. Restart PowerPoint and Word.
pause
