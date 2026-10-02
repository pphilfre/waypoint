#!/bin/bash
set -euo pipefail

# Select the newest installed Xcode 26.x version.
XCODE_PATH="$(
  find /Applications \
    -maxdepth 1 \
    -type d \
    -name 'Xcode_26*.app' \
    -print |
  sort -V |
  tail -n 1
)"

if [[ -z "$XCODE_PATH" ]]; then
  echo "No Xcode 26 installation found."
  echo "Installed Xcode versions:"
  ls -d /Applications/Xcode*.app || true
  exit 1
fi

export DEVELOPER_DIR="$XCODE_PATH/Contents/Developer"

echo "Using Xcode at: $DEVELOPER_DIR"
echo "DEVELOPER_DIR=$DEVELOPER_DIR" >> "$GITHUB_ENV"

xcodebuild -version
xcodebuild -showsdks

# Install XcodeGen.
tool_dir="$RUNNER_TEMP/waypoint-xcodegen"
mkdir -p "$tool_dir"

curl \
  --fail \
  --location \
  --retry 3 \
  https://github.com/yonaskolb/XcodeGen/releases/download/2.46.0/xcodegen.zip \
  -o "$tool_dir/xcodegen.zip"

echo "4d9e34b62172d645eed6457cac13fc222569974098ef4ee9c3368bedf0196806  $tool_dir/xcodegen.zip" \
  | shasum -a 256 -c -

unzip -q "$tool_dir/xcodegen.zip" -d "$tool_dir"

"$tool_dir/xcodegen/bin/xcodegen" generate \
  --spec apps/ios/project.yml
