# aurswift Test Suite Guide (Current Repo Behavior)

This README documents how the `tests/` folder works right now in this repository: flow, commands, coverage, packages, and execution environment.

## Testing Architecture At A Glance

- `Vitest` is used for unit, component, and integration tests.
- Vitest test environment is `jsdom` (configured in `vitest.config.ts`).
- Global setup is `tests/setup.ts` (JSDOM polyfills + Electron API mocks + cleanup).
- `Playwright` is used for E2E under `tests/e2e`.
- E2E does not run in normal website browser mode. It launches and controls the Electron app process via Playwright's `_electron` API.
- Hardware E2E uses the Playwright `hardware` project with longer timeouts.

Where tests run:

- Unit/component/integration: Node.js + JSDOM simulation.
- E2E: real Electron renderer window controlled by Playwright.
- Hardware E2E: Electron app in hardware project mode with extended timeout profile.

## Tests Folder Flow

Current test-related structure:

```text
tests/
  setup.ts
  unit/
    main/
    renderer/
  components/
  integration/
    renderer/
    README.md
  e2e/
    fixtures.ts
    page-objects/
    *.spec.ts
  utils/
  mocks/
```

Related outputs:

- `test-results/` contains Playwright reports/artifacts and CI test result files.
- `coverage/` contains Vitest coverage outputs when coverage is enabled.

Flow overview:

1. Choose test type and file location (`unit`, `components`, `integration`, `e2e`).
2. Run the matching command.
3. For Vitest: `tests/setup.ts` runs first, then tests execute in JSDOM.
4. For Playwright E2E: Electron app is launched by fixtures, then specs interact with real app windows.
5. Review console output, plus artifacts in `test-results/` and `coverage/` when applicable.

Note on integration layout:

- `tests/integration/renderer/` currently has tests.
- `tests/integration/main/` is referenced by scripts/CI but is currently not populated with test files.

## Commands And How They Work

All commands below are defined in root `package.json`.

| Command | Scope | Runner | Output / Report |
| --- | --- | --- | --- |
| `npm run test` | Default Vitest run (all matched tests) | Vitest | Console output |
| `npm run test:run` | Runs `scripts/run-vitest.js` (skips gracefully if no `*.test.*` files found) | Node + Vitest | Console output |
| `npm run test:watch` | Re-run on file changes | Vitest | Console output |
| `npm run test:ui` | Interactive test UI | Vitest UI | Browser UI session + console |
| `npm run test:changed` | Tests related to changed files | Vitest (`--changed`) | Console output |
| `npm run test:staged` | Related tests for staged files context | Vitest (`related --run`) | Console output |
| `npm run test:unit` | All `tests/unit` | Vitest | Console output |
| `npm run test:unit:main` | `tests/unit/main` only | Vitest | Console output |
| `npm run test:unit:renderer` | `tests/unit/renderer` only | Vitest | Console output |
| `npm run test:components` | All `tests/components` | Vitest | Console output |
| `npm run test:integration` | All `tests/integration` | Vitest | Console output |
| `npm run test:integration:main` | `tests/integration/main` only (currently may run zero tests) | Vitest | Console output |
| `npm run test:integration:renderer` | `tests/integration/renderer` only | Vitest | Console output |
| `npm run test:main` | Combined main-side unit + integration | Vitest | Console output |
| `npm run test:renderer` | Combined renderer unit + component | Vitest | Console output |
| `npm run test:e2e` | All E2E specs in `tests/e2e` | Playwright + Electron | `test-results/` (`html`, `junit`, `json`, artifacts) |
| `npm run test:e2e:ui` | Interactive E2E run | Playwright UI + Electron | UI mode + `test-results/` |
| `npm run test:e2e:debug` | Debug mode for E2E | Playwright debug + Electron | Debug inspector + `test-results/` |
| `npm run test:e2e:headed` | Headed mode E2E | Playwright + Electron | `test-results/` |
| `npm run test:hardware` | E2E hardware project only | Playwright project `hardware` + Electron | `test-results/` |
| `npm run test:coverage` | Vitest run with coverage | Vitest + V8 coverage | `coverage/` + console summary |
| `npm run test:coverage:html` | Coverage + open HTML report | Vitest + V8 coverage | `coverage/index.html` |
| `npm run test:e2e:report` | Open Playwright HTML report | Playwright report viewer | Reads `test-results/html` |

## Coverage Explained (Current Enforced Behavior)

Coverage settings come from `vitest.config.ts`.

Provider and reporters:

- Provider: `v8` via `@vitest/coverage-v8`.
- Reporters: `text`, `json`, `html`, `lcov`.

How coverage is counted:

- `all: false` is enabled.
- That means only files actually executed during tests are included in coverage.
- Coverage include glob:
  - `packages/**/src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- Coverage excludes include:
  - `node_modules/`
  - `tests/`
  - `**/*.d.ts`
  - `**/*.config.*`
  - `**/dist/`
  - `**/build/`
  - `**/*.spec.ts`
  - `**/migrations/`
  - `**/seed.ts`

Current enforced thresholds (baseline gates):

- `lines: 2`
- `functions: 8`
- `branches: 27`
- `statements: 2`

These are the currently enforced thresholds used by the repo and CI, not aspirational targets.

## Packages Used By Test Type

Core testing:

- `vitest`
- `@vitest/ui`
- `@vitest/coverage-v8`

Renderer/component testing:

- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

Mocking API/network requests:

- `msw` (handlers in `tests/mocks/handlers.ts`, optional server helper in `tests/mocks/server.ts`)

E2E + Electron:

- `playwright`
- `@playwright/test`
- `electron`

Script utility:

- `glob` (used by `scripts/run-vitest.js` to detect whether test files exist before running Vitest)

## How To Add And Run New Tests

Conventions:

- Vitest tests: `*.test.ts` or `*.test.tsx` in `tests/unit`, `tests/components`, or `tests/integration`.
- Playwright E2E tests: `*.spec.ts` in `tests/e2e`.
- Keep Playwright tests in `tests/e2e` to avoid Vitest pickup.

Single-file examples:

```bash
# Run one Vitest file
npx vitest run tests/unit/renderer/features/navigation/navigation-mapper.test.ts

# Run one E2E spec
npx playwright test tests/e2e/app.spec.ts

# Run one E2E spec in hardware project
npx playwright test tests/e2e/hardware-integration.spec.ts --project=hardware
```

Expected results:

- Vitest: terminal shows pass/fail summary and failing assertions/stack traces.
- Coverage runs: `coverage/` is generated.
- Playwright: run outputs plus artifacts in `test-results/` (and HTML report in `test-results/html`).

## CI Flow Summary

CI behavior is defined in `.github/workflows/tests.yml`.

- Unit tests run on `ubuntu-latest` (matrix: `tests/unit/main`, `tests/unit/renderer`).
- Component tests run on `ubuntu-latest` (`tests/components`).
- Integration tests run on `ubuntu-latest` (matrix: `tests/integration/main`, `tests/integration/renderer`).
- Coverage job runs after unit/component/integration (`npm run test:coverage`).
- E2E runs on `windows-2022` for Electron/native module compatibility.
- E2E pipeline includes native module rebuild (`electron-rebuild`) and Playwright browser install.
- Artifacts are uploaded from `test-results/` and `coverage/`.

## Common Pitfalls

- `*.spec.ts` is for Playwright E2E. `*.test.ts(x)` is for Vitest.
- E2E here means Electron app automation, not regular browser website automation.
- `tests/mocks/server.ts` is available for request interception but not globally auto-started by `tests/setup.ts`. Import it in tests that need MSW interception.
- `test:integration:main` may report no tests when there are no files in `tests/integration/main`.

## Related Files

- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/setup.ts`
- `scripts/run-vitest.js`
- `.github/workflows/tests.yml`
