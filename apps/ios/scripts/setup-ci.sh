#!/bin/bash
set -euo pipefail
export DEVELOPER_DIR=/Applications/Xcode_26.0.1.app/Contents/Developer
test -d "$DEVELOPER_DIR"
echo "DEVELOPER_DIR=$DEVELOPER_DIR" >> "$GITHUB_ENV"
xcodebuild -version
tool_dir="$RUNNER_TEMP/waypoint-xcodegen"
mkdir -p "$tool_dir"
curl --fail --location --retry 3 https://github.com/yonaskolb/XcodeGen/releases/download/2.46.0/xcodegen.zip -o "$tool_dir/xcodegen.zip"
echo "4d9e34b62172d645eed6457cac13fc222569974098ef4ee9c3368bedf0196806  $tool_dir/xcodegen.zip" | shasum -a 256 -c -
unzip -q "$tool_dir/xcodegen.zip" -d "$tool_dir"
"$tool_dir/xcodegen/bin/xcodegen" generate --spec apps/ios/project.yml
