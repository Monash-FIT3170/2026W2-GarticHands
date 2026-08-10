# component-tests/

Shared component/hook tests for the Gartic Hands client, using Vitest + React Testing Library.

This folder lives outside `client/` (as a sibling of `client/` and `server/`, inside the `GarticHands/` workspace root) rather than inside `client/src`, so it can be a single shared location for tests without being bundled as part of the shipped app source.

Folder structure:

`GarticHands/` is the npm workspace root (package.json, node_modules). Inside it, `client/` is the `@gartichands/client` workspace package, containing `src/`, its own `package.json` (which has the `test:component` script), and `vitest.config.ts` (the Vitest config, which lives here and points at `component-tests/`). There's also `server/`. And `component-tests/` — this folder — sits alongside those, containing `tsconfig.json`, `test-setup.ts`, and the test files themselves (`CountdownTimer.test.tsx`, `DrawingCameraCanvas.test.tsx`, `DrawingStage.test.tsx`, `PlayerList.test.tsx`, `usePhaseAdvance.test.tsx`).

## Why this folder is positioned here

Tests in this folder import real source files from `client/src`, and real npm packages (`@testing-library/react`, `vitest`, etc.). Node resolves both of those by walking up the directory tree from the importing file until it finds a matching `node_modules` folder or file.

Because `GarticHands/` is the npm workspace root, `GarticHands/node_modules` is the first `node_modules` folder found walking up from `component-tests/`. That's what lets test files here import shared dependencies at all — if `component-tests/` lived outside `GarticHands/` entirely, module resolution would fail (this bit us during setup — see "Gotchas" below).

## How the paths work

Every test file imports the real component/hook it's testing using a relative path back into `client/src`, e.g. `import CountdownTimer from '../client/src/components/ui/CountdownTimer'`.

That's `../client/src/...` because from `component-tests/`, `client/` is a sibling folder — you go up one level (`../`) out of `component-tests/`, then into `client/src/...`.

If you ever move `component-tests/` to a different location relative to `client/`, every import in every test file needs to be updated to match the new relative path — there's no path alias set up for this currently.

### Config paths (client/vitest.config.ts)

Vitest itself is configured from `client/vitest.config.ts` (not from inside `component-tests/`), and it points at this folder using the same kind of relative path: `setupFiles` resolves to `../component-tests/test-setup.ts`, `include` globs `../component-tests/**/*.{test,spec}.{ts,tsx}`, and `server.fs.allow` is set to `../` (the `GarticHands/` root).

`server.fs.allow` matters because Vite, by default, refuses to serve files outside the project root it's running from (`client/`). Since `component-tests/` and its `test-setup.ts` live outside that root, this needs to be explicitly widened to the `GarticHands/` root, or Vitest fails with a "Cannot find module" error that has nothing to do with the file actually missing.

### Type-checking (component-tests/tsconfig.json)

This folder has its own `tsconfig.json`, referenced from `client/tsconfig.json`'s `references` array. Without it, TypeScript treats these files as orphaned — not part of any project — so editors won't recognize Vitest's global `vi`, `describe`, `test`, `expect`, etc. (even though they work fine at runtime, thanks to `globals: true` in `vitest.config.ts`).

## Running the tests

From `GarticHands/client/`, run: `npm run test:component`

Or from the `GarticHands/` workspace root, run: `npm run test:component -w @gartichands/client`

Both run the same underlying command: `vitest run ../component-tests`.

## Adding a new test file

First, create `YourThing.test.tsx` in this folder (use `.tsx`, not `.ts`, if the file contains any JSX — see Gotchas below). Then import the real component/hook using a `../client/src/...` relative path. If the component/hook has dependencies you want to isolate (API calls, other components), mock them with `vi.mock('../client/src/...')`, using the same relative path the component itself would resolve to — otherwise the mock won't actually intercept the real import. Finally, run `npm run test:component` from `client/` to confirm it's picked up and passing.

No other config changes should be needed — `include` in `vitest.config.ts` already globs for any `*.test.{ts,tsx}` file in this folder.

## Gotchas encountered while setting this up (worth knowing)

`.ts` vs `.tsx`: any test file containing JSX (even just a wrapper like `<MemoryRouter>{children}</MemoryRouter>`) must use the `.tsx` extension. A `.ts` file with JSX in it fails with a confusing parse error ("Unterminated regular expression") rather than a clear "JSX not supported" message.

Default vs named exports: double check whether the thing you're importing is `export default function X()` or `export function X()`. Importing a named export as if it were a default (or vice versa) doesn't always fail loudly — sometimes it just silently gives you `undefined`.

`getByTestId`/`getByText` vs their `All`/`query` variants: `getByX` throws if it finds more than one match — use `getAllByX` if a component can legitimately render multiple matching elements (e.g. `DrawingStage`'s overlay mode renders two canvases by design). `getAllByX` throws if it finds zero matches — use `queryAllByX` (returns an empty array instead of throwing) when asserting that something is absent.

Module resolution depends on folder position: if `component-tests/` is ever moved outside the `GarticHands/` workspace root, `node_modules` resolution breaks and every import of a third-party package fails, even though the code itself hasn't changed. Keep this folder inside `GarticHands/`, as a sibling of `client/` and `server/`.