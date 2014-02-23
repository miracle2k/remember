#!/usr/bin/env sh

if [ "$1" = "--update" ]; then
    sass --update css-src:stylesheets -E "UTF-8"
else
    sass --watch css-src:stylesheets -E "UTF-8"
fi
