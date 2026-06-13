#!/bin/bash
set -e

DMG_URL="https://github.com/Gervinabavelim/project-tracker/releases/download/v0.2.1/Project.Tracker-0.2.1-arm64.dmg"
DMG_PATH="/tmp/ProjectTracker.dmg"
MOUNT_POINT="/Volumes/Project Tracker 0.2.1-arm64"
APP_NAME="Project Tracker.app"

echo "Downloading Project Tracker..."
curl -L -o "$DMG_PATH" "$DMG_URL"

echo "Mounting disk image..."
hdiutil attach "$DMG_PATH" -nobrowse -quiet

echo "Installing to /Applications..."
cp -R "$MOUNT_POINT/$APP_NAME" /Applications/

echo "Removing quarantine flag..."
xattr -cr "/Applications/$APP_NAME"

echo "Cleaning up..."
hdiutil detach "$MOUNT_POINT" -quiet
rm -f "$DMG_PATH"

echo ""
echo "Project Tracker installed! Opening now..."
open "/Applications/$APP_NAME"
