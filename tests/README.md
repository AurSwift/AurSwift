# aurswift Test Suite Guide

This README documents the locked test architecture for this repository: layer-first at root and feature-first inside layers.

## Testing Architecture At A Glance

- `Vitest` is used for unit, component, and integration tests.
- Vitest runtime is split by project in `vitest.workspace.ts`:
- `node-runtime` for `tests/unit/{main,preload}` and `tests/integration/{main,preload}`
- `dom-runtime` for `tests/unit/renderer`, `tests/component`, and `tests/integration/renderer`
- Global setup is `tests/setup.ts` (JSDOM polyfills + Electron API mocks + cleanup).
- `Playwright` is used for E2E under `tests/e2e/specs`.
- E2E does not run in normal website browser mode. It launches and controls the Electron app process via Playwright's `_electron` API.
- Hardware E2E uses the Playwright `hardware` project with longer timeouts.
- Playwright startup lifecycle is handled by `tests/e2e/support/global-setup.ts` and `tests/e2e/support/global-teardown.ts`.
- CI guardrails are enabled in Playwright config (`globalTimeout` + `maxFailures`) for bounded and faster feedback loops.

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
    preload/
    renderer/
  component/
    app/
    features/
    license/
  integration/
    main/
    preload/
    renderer/
  shared/
    fixtures/
    factories/
    mocks/
    utils/
  e2e/
    fixtures/
    pages/
    support/
    specs/
      *.e2e.spec.ts
```

Related outputs:

- `test-outputs/e2e/` contains Playwright reports/artifacts and CI test result files.
- `test-outputs/test-results/` contains JUnit/XML results for unit, component, and integration CI jobs.
- `test-outputs/coverage/` contains Vitest coverage outputs when coverage is enabled.

Flow overview:

1. Choose test type and file location (`unit`, `component`, `integration`, `e2e/specs`).
2. Run the matching command.
3. For Vitest: `tests/setup.ts` runs first, then tests execute in JSDOM.
4. For Playwright E2E: Electron app is launched by fixtures, then specs interact with real app windows.
5. Review console output, plus artifacts in `test-outputs/e2e/`, `test-outputs/test-results/`, and `test-outputs/coverage/` when applicable.

Placement rules:

- `tests/unit/*`: one module/function behavior.
- `tests/component/*`: rendered UI behavior and interactions.
- `tests/integration/*`: module/service collaboration across boundaries.
- `tests/e2e/specs/*`: real user journeys in Electron runtime.
- `tests/shared/*`: reusable test-only helpers.

## Commands And How They Work

All commands below are defined in root `package.json`.

| Command                             | Scope                                                                        | Runner                                   | Output / Report                                          |
| ----------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `npm run test`                      | Default Vitest run (all matched tests)                                       | Vitest                                   | Console output                                           |
| `npm run test:run`                  | Runs `scripts/run-vitest.js` (skips gracefully if no `*.test.*` files found) | Node + Vitest                            | Console output                                           |
| `npm run test:watch`                | Re-run on file changes                                                       | Vitest                                   | Console output                                           |
| `npm run test:ui`                   | Interactive test UI                                                          | Vitest UI                                | Browser UI session + console                             |
| `npm run test:changed`              | Tests related to changed files                                               | Vitest (`--changed`)                     | Console output                                           |
| `npm run test:staged`               | Related tests for staged files context                                       | Vitest (`related --run`)                 | Console output                                           |
| `npm run test:unit`                 | All `tests/unit`                                                             | Vitest                                   | Console output                                           |
| `npm run test:unit:main`            | `tests/unit/main` only                                                       | Vitest                                   | Console output                                           |
| `npm run test:unit:preload`         | `tests/unit/preload` only                                                    | Vitest                                   | Console output                                           |
| `npm run test:unit:renderer`        | `tests/unit/renderer` only                                                   | Vitest                                   | Console output                                           |
| `npm run test:component`            | All `tests/component`                                                        | Vitest                                   | Console output                                           |
| `npm run test:integration`          | All `tests/integration`                                                      | Vitest                                   | Console output                                           |
| `npm run test:integration:main`     | `tests/integration/main` only                                                | Vitest                                   | Console output                                           |
| `npm run test:integration:preload`  | `tests/integration/preload` only                                             | Vitest                                   | Console output                                           |
| `npm run test:integration:renderer` | `tests/integration/renderer` only                                            | Vitest                                   | Console output                                           |
| `npm run test:main`                 | Combined main-side unit + integration                                        | Vitest                                   | Console output                                           |
| `npm run test:renderer`             | Combined renderer unit + component                                           | Vitest                                   | Console output                                           |
| `npm run test:structure`            | Enforce tests folder contract and naming rules                               | Node script                              | Console output                                           |
| `npm run test:e2e`                  | All E2E specs in `tests/e2e/specs`                                           | Playwright + Electron                    | `test-outputs/e2e/` (`html`, `junit`, `json`, artifacts) |
| `npm run test:e2e:ui`               | Interactive E2E run                                                          | Playwright UI + Electron                 | UI mode + `test-outputs/e2e/`                            |
| `npm run test:e2e:debug`            | Debug mode for E2E                                                           | Playwright debug + Electron              | Debug inspector + `test-outputs/e2e/`                    |
| `npm run test:e2e:headed`           | Headed mode E2E                                                              | Playwright + Electron                    | `test-outputs/e2e/`                                      |
| `npm run test:hardware`             | E2E hardware project only                                                    | Playwright project `hardware` + Electron | `test-outputs/e2e/`                                      |
| `npm run test:coverage`             | Vitest run with coverage                                                     | Vitest + V8 coverage                     | `test-outputs/coverage/` + console summary               |
| `npm run test:coverage:html`        | Coverage + open HTML report                                                  | Vitest + V8 coverage                     | `test-outputs/coverage/index.html`                       |
| `npm run test:e2e:report`           | Open Playwright HTML report                                                  | Playwright report viewer                 | Reads `test-outputs/e2e/html`                            |

Vitest project-specific runs:

- `npx vitest run --project node-runtime`
- `npx vitest run --project dom-runtime`

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
  - `**/*.e2e.spec.ts`
  - `**/migrations/`
  - `**/seed.ts`

Current enforced thresholds (baseline gates):

- `lines: 2`
- `functions: 8`
- `branches: 27`
- `statements: 2`

These are the currently enforced thresholds used by the repo and CI, not aspirational targets.

For a deeper, study-guide style explanation of coverage concepts, configuration, and how to read reports in this repo, see  
`docs/Guides/Testing/Testing/COVERAGE_AND_TESTING_STUDY_GUIDE.md`.

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

- `msw` (handlers in `tests/shared/mocks/handlers.ts`, optional server helper in `tests/shared/mocks/server.ts`)

E2E + Electron:

- `playwright`
- `@playwright/test`
- `electron`

Script utility:

- `glob` (used by `scripts/run-vitest.js` to detect whether test files exist before running Vitest)

## How To Add And Run New Tests

Conventions:

- Vitest tests: `*.test.ts` or `*.test.tsx` only.
- Playwright E2E tests: `*.e2e.spec.ts` in `tests/e2e/specs`.
- Vitest `*.spec.ts`/`*.spec.tsx` is not allowed.
- Unit tests go in `tests/unit/main|preload|renderer`.
- Integration tests go in `tests/integration/main|preload|renderer`.
- Component tests go in `tests/component/app|features|license`.
- Keep Playwright tests in `tests/e2e/specs` to avoid Vitest pickup.
- Keep hardware-only specs named `hardware.e2e.spec.ts` so they run only in the `hardware` project.

Single-file examples:

```bash
# Run one Vitest file
npx vitest run tests/unit/renderer/features/navigation/navigation-mapper.test.ts

# Run one E2E spec
npx playwright test tests/e2e/specs/app-smoke.e2e.spec.ts

# Run one E2E spec in hardware project
npx playwright test tests/e2e/specs/hardware.e2e.spec.ts --project=hardware
```

Expected results:

- Vitest: terminal shows pass/fail summary and failing assertions/stack traces.
- Coverage runs: `test-outputs/coverage/` is generated.
- Playwright: run outputs plus artifacts in `test-outputs/e2e/` (and HTML report in `test-outputs/e2e/html`).

## CI Flow Summary

CI behavior is defined in `.github/workflows/tests.yml`.

- Unit tests run on `ubuntu-latest` (matrix: `tests/unit/main`, `tests/unit/preload`, `tests/unit/renderer`).
- Component tests run on `ubuntu-latest` (`tests/component`).
- Integration tests run on `ubuntu-latest` (matrix: `tests/integration/main`, `tests/integration/preload`, `tests/integration/renderer`).
- Coverage job runs after unit/component/integration (`npm run test:coverage`).
- E2E runs on `windows-2022` for Electron/native module compatibility.
- E2E pipeline includes native module rebuild (`electron-rebuild`) and Playwright browser install.
- Artifacts are uploaded from `test-outputs/e2e/` and `test-outputs/coverage/`.
- Playwright CI behavior includes bounded run time (`globalTimeout`) and capped failures (`maxFailures`).

## Common Pitfalls

- `*.e2e.spec.ts` is for Playwright E2E. `*.test.ts(x)` is for Vitest.
- Hardware checks must stay in `hardware.e2e.spec.ts` to avoid duplicate execution in `electron`.
- `npm run test:structure` should pass before pushing structural test changes.
- E2E here means Electron app automation, not regular browser website automation.
- `tests/shared/mocks/server.ts` is available for request interception but not globally auto-started by `tests/setup.ts`. Import it in tests that need MSW interception.

## Related Files

- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/setup.ts`
- `scripts/run-vitest.js`
- `.github/workflows/tests.yml`
