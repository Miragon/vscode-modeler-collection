# Contributing

Thanks for helping improve the **Miragon Modeler Collection**.
This repository is a *codeless* VS Code Extension Pack:
there is no application code, no build step, and no runtime dependencies.
Just a `package.json` whose `extensionPack` array lists the bundled modelers,
a small Get Started walkthrough (declarative manifest + markdown under `media/`),
plus docs and release automation.

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/).
Because the repo is **squash-merged**,
the **pull-request title** becomes the release commit that
[release-please](https://github.com/googleapis/release-please) reads to compute the next version and changelog.
The PR title is linted by `.github/workflows/pr-title.yml`,
so it must be a valid Conventional Commit:

```
feat: add the Miranum forms modeler to the pack
fix: correct the Wardley marketplace link
docs: clarify the standalone-install note
chore: bump github actions
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `ci`, `build`, `test`, `revert`.
A `feat` bumps the minor version,
a `fix` the patch version (pre-1.0.0, per `bump-minor-pre-major`).

## Adding or removing a pack member

This is the main reason to touch the repo,
and it's deliberately a two-file change:

1. Add (or remove) the extension's Marketplace ID in the `extensionPack` array of
   [`package.json`](package.json), e.g. `"miragon-gmbh.some-new-modeler"`.
2. Add (or remove) the matching short paragraph + Marketplace link in the **What's inside**
   section of [`README.md`](README.md).

That's it.
No code, no `main`, no `activationEvents`.
One caveat: the pack's `engines.vscode` **must be `>=` the highest `engines.vscode` of every member**.
If a new member requires a newer VS Code than the pack currently declares,
bump `engines.vscode` in `package.json` to match.
Otherwise `vsce package` (or installation) will fail.

## The Get Started walkthrough

The pack contributes a small **hub walkthrough** (`contributes.walkthroughs` in
[`package.json`](package.json)) that VS Code surfaces on the *Get Started / Welcome* page.
It is one step per modeler, and each step's action deep-links into that member's *own*
walkthrough via the built-in `workbench.action.openWalkthrough` command.

The link target follows a fixed convention: **`<marketplace-id>#getStarted`**,
e.g. `miragon-gmbh.vs-code-bpmn-modeler#getStarted`.
Use the **Marketplace id** (the one in `extensionPack`), not the member's repo folder name.
The step markdown lives under [`media/`](media) and ships inside the VSIX.
If a member ever renames its walkthrough id, update the matching link in `package.json`.

## Testing locally

Two ways, fast to thorough:

**1. Fast loop — the walkthrough UI (F5).**
Open this folder in VS Code and press **F5**
(uses [`.vscode/launch.json`](.vscode/launch.json), no build step — the pack is codeless).
An **Extension Development Host** window opens with the pack loaded.
There, run **Welcome: Open Walkthrough…** from the Command Palette
and pick *Get Started with the Miragon Modeler Collection*.
Press `Cmd+R` (`Ctrl+R`) in that window to reload after editing the manifest or media.
Caveat: a step's "Open the … tutorial" button only resolves if that **member extension is
installed in the dev host** — install the four members there to test the routing end to end.

**2. Full install check — the VSIX.**
Package the pack and install it in a clean VS Code:

```bash
npm run package
```

Then: **Extensions: Install from VSIX…** and select the generated file.
All members listed in `extensionPack` should be pulled in,
and the walkthrough should appear on the Get Started page with every deep-link resolving.
You can also inspect the generated `extension.vsixmanifest` inside the VSIX
and confirm it carries an `ExtensionPack` property with the expected IDs.

## Releasing

Releases are automated.
When release-please's PR is merged to `main`,
it cuts a `v*` tag and the `Release` workflow publishes the packaged VSIX
to the **VS Code Marketplace** and **Open VSX**.
Maintainers can validate packaging without releasing by running the `Release` workflow manually
(`workflow_dispatch`) with the `dry_run` input enabled.
