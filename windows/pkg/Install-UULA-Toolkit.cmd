@echo off
rem UULA Toolkit - install without the exe (if Windows blocks it)
set "D=%LOCALAPPDATA%\UULA Toolkit"
mkdir "%D%" 2>nul
copy /Y "%~dp0UULA-Toolkit.xml" "%D%\UULA-Toolkit.xml" >nul
reg add "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "UULA Toolkit" /t REG_SZ /d "%D%\UULA-Toolkit.xml" /f >nul
echo.
echo UULA Toolkit is installed. Close PowerPoint and Word and open them again.
echo.
pause
