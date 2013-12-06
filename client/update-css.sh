#!/usr/bin/env sh

if [ "$1" = "--update" ]; then
    sass --update css-src:stylesheets
else
    sass --watch css-src:stylesheets
fi