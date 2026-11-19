#!/bin/sh
# Builds the Windows installer (UULA-Toolkit-Setup.exe) and the zip for the team.
cd "$(dirname "$0")"
cp ../UULA-Toolkit.xml .
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-H windowsgui -s -w" -o UULA-Toolkit-Setup.exe .
rm -rf UULA-Toolkit && mkdir UULA-Toolkit
cp UULA-Toolkit.xml UULA-Toolkit-Setup.exe pkg/* UULA-Toolkit/
rm -f UULA-Toolkit-Windows.zip && zip -qr UULA-Toolkit-Windows.zip UULA-Toolkit
rm -rf UULA-Toolkit UULA-Toolkit-Setup.exe UULA-Toolkit.xml
