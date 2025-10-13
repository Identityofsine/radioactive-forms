# Releasing

This project uses Changesets for versioning and changelogs and publishes TypeScript sources to npm.

## Prerequisites

- npm access to the `@identityofsine` scope
- 2FA enabled on your npm account
- Logged in locally: `npm login`

## Add a Changeset

After merging user-facing changes, add a changeset describing the bump type and notes:

```bash
npx changeset
```

Commit the generated changeset file and open a PR. Once merged into the release branch (or main), proceed.

## Version packages

When you're ready to cut a release, run:

```bash
npx changeset version
```

This updates versions and changelogs. Commit those changes and push them (including tags if created by your workflow).

## Publish

Publish from the repository root:

```bash
npm publish --access public
```

Then create a GitHub release and attach the changelog notes.

## Notes

- The library currently ships TypeScript sources (no separate build step). Consumers should have TypeScript tooling or rely on TS-included types.
- Ensure tests and type-checks pass before releasing:

```bash
npm run test
npm run typecheck
```


