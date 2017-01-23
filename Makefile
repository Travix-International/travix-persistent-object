VERSION := patch
GITHUB_API_TOKEN := ""

release:
  echo "Releasing version: $(VERSION)"
  git checkout master
  git pull origin master
  npm run lint
  npm run test
  npm run spec
  npm version $(VERSION)
  npm publish
  git push --follow-tags

changelog:
  git checkout master
  git pull origin master
  github_changelog_generator -t $(GITHUB_API_TOKEN)

push-changelog:
  git checkout master
  git pull origin master
  git add CHANGELOG.md
  git commit -m 'CHANGELOG updated.'
  git push origin master
