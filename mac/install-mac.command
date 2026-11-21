#!/bin/sh
# UULA Toolkit — install on Mac (PowerPoint and Word). Double-click, then restart PowerPoint and Word.
cd "$(dirname "$0")"
for app in Powerpoint Word; do
  d="$HOME/Library/Containers/com.microsoft.$app/Data/Documents/wef"
  mkdir -p "$d" && cp -f UULA-Toolkit.xml "$d/UULA-Toolkit.xml" && echo "✓ $app"
done
echo "UULA Toolkit installed. Restart PowerPoint and Word — the button is on the UULA Toolkit tab."
