---
title: Undoing a bad merge in git
date: '2024-02-08'
---

I had to help a coworker undo a bad merge with the main branch that overwrote some of my changes. What made things slightly tricky is that additional commits had been pushed to the branch after the merge that we wanted to preserver.

First I tried an interactive rebase, but that seemed to require me to drop all the commits that came in as a result of the merge, and there were a lot. So instead I did this:

```bash
git reset --hard <SHA of commit before merge>
# for each commit I wanted to save...
git cherry-pick <SHA of commit to preserve>
git push --force-with-lease
```

This did require rewriting history on someone else's branch. After I force-pushed, they had to `git reset origin/<branch-name> --hard` to sync up our branches.

They also pushed some commits while I was rewriting history. To be able to cherry-pick those commits, I had to `git fetch -a` to fetch the commits (without integrating them into my local branch).

Helpful links:

- https://superuser.com/a/691497
