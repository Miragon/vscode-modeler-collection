# Contributing

Thanks for helping improve the **Miragon Modeler Collection**. This repository is a *codeless*
VS Code Extension Pack: there is no application code, no build step, and no runtime dependencies —
just a `package.json` whose `extensionPack` array lists the bundled modelers, plus docs and release
automation.

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Because the repo is
**squash-merged**, the **pull-request title** becomes the release commit that
[release-please](https://github.com/googleapis/release-please) reads to compute the next version and
changelog. The PR title is linted by `.github/workflows/pr-title.yml`, so it must be a valid
Conventional Commit:

```
feat: add the Miranum forms modeler to the pack
fix: correct the Wardley marketplace link
docs: clarify the standalone-install note
chore: bump github actions
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `ci`, `build`, `test`, `revert`.
A `feat` bumps the minor version, a `fix` the patch version (pre-1.0.0, per
`bump-minor-pre-major`).

## Adding or removing a pack member

This is the main reason to touch the repo, and it's deliberately a two-file change:

1. Add (or remove) the extension's Marketplace ID in the `extensionPack` array of
   [`package.json`](package.json), e.g. `"miragon-gmbh.some-new-modeler"`.
2. Add (or remove) the matching short paragraph + Marketplace link in the **What's inside**
   section of [`README.md`](README.md).

That's it — no code, no `main`, no `activationEvents`. One caveat: the pack's
`engines.vscode` **must be `>=` the highest `engines.vscode` of every member**. If a new member
requires a newer VS Code than the pack currently declares, bump `engines.vscode` in `package.json`
to match — otherwise `vsce package` (or installation) will fail.

## Testing locally

No install step is needed. Package the pack into a VSIX and install it:

```bash
npx --yes @vscode/vsce package --no-dependencies -o miragon-modeler-collection.vsix
```

Then in VS Code: **Extensions: Install from VSIX…** and select the generated file. All members
listed in `extensionPack` should be pulled in. You can also inspect the generated
`extension.vsixmanifest` inside the VSIX and confirm it carries an `ExtensionPack` property with the
expected IDs.

## Releasing

Releases are automated. When release-please's PR is merged to `main`, it cuts a `v*` tag and the
`Release` workflow publishes the packaged VSIX to the **VS Code Marketplace** and **Open VSX**.
Maintainers can validate packaging without releasing by running the `Release` workflow manually
(`workflow_dispatch`) with the `dry_run` input enabled.
