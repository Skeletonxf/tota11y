#!/bin/sh
echo "Switching HEAD to master"
# we start checked into the commit on the runner
# we want the head to be on the master branch
git checkout master

# now add the remotes for the GitHub repo using SSH
git remote add github git@github.com:Skeletonxf/totally-automated-a11y-scanner.git
# Push onto GitHub
git push github master --follow-tags
