#!/bin/sh
echo "Switching HEAD to master"
# we start checked into the commit on the runner
# we want the head to be on the master branch
git checkout master

## Add the SSH keys stored in the variables to the agent store
## We're using tr to fix line endings which makes ed25519 keys work
## without extra base64 encoding.
## https://gitlab.com/gitlab-examples/ssh-private-key/issues/1#note_48526556
echo "$SSH_GITHUB_PUSH_SYNC" | tr -d '\r' | ssh-add - > /dev/null

# now add the remotes for the GitHub repo using SSH
git remote add github git@github.com:Skeletonxf/totally-automated-a11y-scanner.git
# Push onto GitHub
git push github master
