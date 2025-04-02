#!/bin/bash

# Check current status
STATUS=$(defaults read com.apple.finder AppleShowAllFiles)

if [ "$STATUS" = "YES" ]; then
    # If hidden files are shown, hide them
    defaults write com.apple.finder AppleShowAllFiles NO
    echo "Hidden files will be hidden"
else
    # If hidden files are hidden, show them
    defaults write com.apple.finder AppleShowAllFiles YES
    echo "Hidden files will be shown"
fi

# Restart Finder to apply changes
killall Finder
