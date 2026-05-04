# StemBridge

Desktop-first frontend MVP for a music collaboration app built with Electron, React, TypeScript, and Vite-based tooling.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run typecheck`
- `npm run format`

## macOS Release Builds

Unsigned local build:

- `npm run make`

## GitHub Release Automation

Pushing to `main` runs `.github/workflows/release.yml`. The workflow:

- runs lint, typecheck, and tests
- bumps the patch version in `package.json` and `package-lock.json`
- commits the version bump back to `main` as `ci(release): vX.Y.Z [skip ci]`
- tags the commit as `vX.Y.Z`
- builds and uploads macOS, Windows, and Linux app artifacts
- publishes the GitHub release after all platform artifacts upload

The workflow uses the repository `GITHUB_TOKEN`, so GitHub Actions must have
read/write `contents` permission and branch protection must allow the action to
push the version bump commit and tag.

Signed and notarized release build:

- Install a `Developer ID Application` certificate in Keychain.
- Confirm it is available with `security find-identity -p codesigning -v`.
- Set one notarization credential option before running `npm run make`.

Apple ID app-specific password:

```sh
export MAC_CODESIGN=true
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOURTEAMID"
npm run make
```

Stored notarytool keychain profile:

```sh
xcrun notarytool store-credentials "stembridge-notary"
export MAC_CODESIGN=true
export APPLE_KEYCHAIN_PROFILE="stembridge-notary"
npm run make
```

## Environment

Optional renderer environment variables:

- `VITE_API_BASE_URL` for the backend URL
- `VITE_USE_MOCK_DATA` to toggle the mock project service

The app defaults to mock project data so the UI works before the backend is wired.

## Project Structure

```text
src/
  main/
  preload/
  shared/
  renderer/
    src/
      app/
      components/
      features/
      lib/
      pages/
      routes/
      styles/
      types/
```
