---
title: How to git rebase on main without switching branches
date: '2023-02-04'
tags:
  - git
---

This is just a quick TIL about updating your feature branch with changes from main without switching between branches.

**The problem:** you’re working on some changes in a separate branch and want to update your branch with new changes from the main branch. How do you do it?

I used to take the long way round:

```bash
git checkout main
git pull
git checkout feature
git rebase main
```

However, I recently learned you can do this in two commands instead of four:

```bash
git fetch origin main:main
git rebase main
```

The first command fetches the latest changes from the remote and applies them to your local main branch. You then have the latest updates and can rebase your feature branch onto main (or merge, if you prefer).

Alternatively, if you’ve already fetched the latest changes (even if they haven’t been applied to your local main branch), you can do it in one command:

```bash
git rebase origin main
```

This will rebase your branch onto the latest changes from the remote main branch even if they haven’t been applied to your local main branch yet.

I have my IDE set to automatically fetch the latest changes, so I may find myself doing the second version more often.

I shared this tip [over on Mastodon](https://front-end.social/@geoffrich/109792203222668103) and went semi-viral (100+ boosts, 200+ favs) — well, as viral as a Mastodon post about `git rebase` can go.
