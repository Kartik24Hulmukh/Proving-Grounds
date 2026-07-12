# Architecture

```text
CLI → revisions → claims validator → disposable base/head worktrees
    → identical probe runner → truth-table classifier
    → focused changed-code mutation engine
    → capsule writer/replay → terminal + static HTML report
```

Claims and PR code are untrusted. Worktrees are isolation for trusted local code, not a security sandbox. Fork PR guidance must use a restricted container with no secrets. Record exact SHAs, lockfile hash, commands, versions, timeouts and normalized outcomes. Capsules remain local by default and redact secrets.
