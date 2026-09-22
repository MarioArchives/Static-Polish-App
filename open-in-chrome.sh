#!/bin/sh
# Opens the app in Google Chrome, which has the "Google polski" speech voice.
exec google-chrome "$(dirname "$(readlink -f "$0")")/index.html"
