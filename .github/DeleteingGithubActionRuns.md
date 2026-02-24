## Removing workflow runs

i. Deleting all test.yml runs that were 1 day ago.
gh run list --limit 100 --workflow=test.yml --json databaseId,createdAt | \
 jq -r '.[] | select(.createdAt < "'$(date -v-1d -Iseconds)'") | .databaseId' | \
 xargs -I {} gh run delete {}

ii. Delete all dependabot runs

```
gh run list --user dependabot --limit 500 --json databaseId -q '.[].databaseId' | xargs -I {} gh run delete {}
```

## Releases and tags

**Delete all releases (and their tags)**  
Do this first; use `--cleanup-tag` so the release’s tag is removed too.

```bash
gh release list --limit 500 -q '.[].tagName' --json tagName | xargs -I {} gh release delete {} --yes --cleanup-tag
```

If your `gh` doesn’t support that query, use:

```bash
gh release list --limit 500 | cut -f3 | while read tag; do gh release delete "$tag" --yes --cleanup-tag; done
```

**Delete all remaining remote tags**  
Use after releases if you have tags that aren’t releases, or if you didn’t use `--cleanup-tag`.

```bash
gh api repos/:owner/:repo/tags --paginate -q '.[].name' | xargs -I {} gh api -X DELETE repos/:owner/:repo/git/refs/tags/{}
```

Replace `:owner/:repo` with your repo (e.g. `myorg/myrepo`), or run from a cloned repo and use:

```bash
gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/tags --paginate -q '.[].name' | xargs -I {} gh api -X DELETE "repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/git/refs/tags/{}"
```

**Delete all local tags** (optional, for your clone only):

```bash
git tag -l | xargs git tag -d
```
