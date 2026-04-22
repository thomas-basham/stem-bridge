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
