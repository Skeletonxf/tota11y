#!/usr/bin/env bash
npm ci
rm addon.zip
rm totally.zip
echo "Zipping addon"
zip -r addon.zip addon/* -x .arcconfig .arclint bower.json .directory .eslintrc .git/\* .gitignore .gitlab-ci.yml node_modules/\* sync.sh .travis.yml public/\* screenshots/\*
echo "Zipping source code"
zip -r totally.zip . -x .arcconfig .arclint bower.json .directory .eslintrc .git/\* .gitignore .gitlab-ci.yml node_modules/\* sync.sh .travis.yml public/\* screenshots/\*
