#!/usr/bin/env bash
echo "Copying to /tmp for reproducible builds"
rm -rf /tmp/totally-build
mkdir /tmp/totally-build
cp -r . /tmp/totally-build/
SOURCE_DIRECTORY=$(pwd)
cd /tmp/totally-build/
echo "Running build"
npm ci
npm run build
rm addon.zip
rm totally.zip
echo "Zipping addon"
cd addon/
zip -r addon.zip . -x .arcconfig .arclint bower.json .directory .eslintrc .git/\* .gitignore .gitlab-ci.yml node_modules/\* sync.sh .travis.yml public/\* screenshots/\*
cd ..
mv addon/addon.zip addon.zip
echo "Zipping source code"
zip -r totally.zip . -x .arcconfig .arclint bower.json .directory .eslintrc .git/\* .gitignore .gitlab-ci.yml node_modules/\* sync.sh .travis.yml public/\* screenshots/\*
echo "Returning to $SOURCE_DIRECTORY"
cd $SOURCE_DIRECTORY
echo "Moving built artifacts into $SOURCE_DIRECTORY"
rm addon.zip
rm totally.zip
rm addon/build/tota11y.js
rm addon/build/sidebar.js
rm build/tota11y.js
rm build/tota11y.min.js
rm build/sidebar.js
rm build/sidebar.min.js
mv /tmp/totally-build/addon.zip addon.zip
mv /tmp/totally-build/totally.zip totally.zip
mv /tmp/totally-build/addon/build/tota11y.js addon/build/tota11y.js
mv /tmp/totally-build/addon/build/sidebar.js addon/build/sidebar.js
mv /tmp/totally-build/build/tota11y.js build/tota11y.js
mv /tmp/totally-build/build/tota11y.min.js build/tota11y.min.js
mv /tmp/totally-build/build/sidebar.js build/sidebar.js
mv /tmp/totally-build/build/sidebar.min.js build/sidebar.min.js
echo "Deleting /tmp copy"
rm -rf /tmp/totally-build
