# Production-Grade TS Library: tabularasa

## 1. Goal

Set up a production-ready TypeScript library named `tabularasa` targeting both Node.js and browser environments. The project will have: strict TypeScript, Vitest unit tests, tsup dual-format builds (ESM + CJS), TypeDoc API docs, conventional commits enforced via Husky + commitlint, a GitHub Actions CI pipeline, and a documented manual publish workflow.

## 2. Decisions

- **Single package** (no monorepo)
- **Package name**: `tabularasa` (unscoped)
- **Targets**: Node 18+ and browser (dual CJS/ESM bundling via tsup)
- **Bundler**: tsup (ESM + CJS, auto-generates .d.ts)
- **Test runner**: Vitest with V8 coverage
- **Linting**: ESLint (typescript-eslint/recommended) + Prettier
- **Git hooks**: Husky (pre-commit: lint-staged → lint + test)
- **Commits**: commitlint (conventional commits: feat, fix, docs, perf, refactor, test, chore)
- **Docs**: TypeDoc (generated on build/docs script, CI publishes as artifact)
- **Publishing**: Manual, well-documented in README
- **CI**: GitHub Actions (lint, typecheck, test, build, docs)

## 3. Project Structure

```
tabularasa/
├── .opencode/
│   └── plans/
│       └── production-library-plan.md    <- this file
├── .github/
│   └── workflows/
│       └── ci.yml                        <- GitHub Actions CI
├── src/
│   ├── index.ts                          <- library entry (reexports everything)
│   └── lib/
│       └── utils.ts                      <- placeholder module
├── tests/
│   ├── setup.ts                          <- Vitest global setup
│   └── lib/
│       └── utils.test.ts                  <- placeholder test
├── docs/                                 <- TypeDoc output (gitignored, generated)
├── dist/                                 <- tsup build output (gitignored)
├── .gitignore
├── .npmignore
├── .nvmrc                                <- Node 20
├── package.json
├── tsconfig.json
├── tsconfig.build.json                   <- for tsup, noEmit
├── vitest.config.ts
├── tsup.config.ts
├── eslint.config.cjs
├── prettier.config.cjs
├── commitlint.config.cjs
├── .lintstagedrc.cjs                     <- lint-staged config
├── .husky/
│   ├── pre-commit                        <- pre-commit hook (lint-staged)
│   └── commit-msg                         <- commit-msg hook (commitlint)
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## 4. File-by-File Plan

### package.json

- `name`: `tabularasa`
- `version`: `0.1.0`
- `type`: `module` (ESM)
- `main`: `dist/index.cjs` (CJS entry)
- `module`: `dist/index.js` (ESM entry)
- `exports`: `{ ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" }, "./package.json": "./package.json" }`
- `types`: `dist/index.d.ts`
- `files`: `["dist"]`
- `sideEffects`: `false`
- `scripts`:
  - `build`: `tsup`
  - `dev`: `tsup --watch`
  - `test`: `vitest`
  - `test:ui`: `vitest --ui`
  - `test:coverage`: `vitest --coverage`
  - `lint`: `eslint src tests --ext .ts,.tsx`
  - `lint:fix`: `eslint src tests --ext .ts,.tsx --fix`
  - `format`: `prettier --write "src/**/*.ts" "tests/**/*.ts" "*.{json,md,yml}" "!dist/**" "!node_modules/**"`
  - `typecheck`: `tsc --noEmit`
  - `typecheck:build`: `tsc -p tsconfig.build.json --noEmit`
  - `docs`: `typedoc`
  - `prepare`: `husky install`
  - `prepublishOnly`: `npm run typecheck && npm run lint && npm run test && npm run build`
- **devDependencies**: vitest, @vitest/coverage-v8, tsup, typescript, eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, prettier, @commitlint/cli, @commitlint/config-conventional, husky, lint-staged, typedoc, @types/node

### tsconfig.json (base)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "tests"]
}
```

### tsconfig.build.json

Same as tsconfig.json but:
- `"noEmit": false` (tsup handles emission)
- `"emitDeclarationOnly": true`
- includes `src/**/*` and `types/**/*` if any ambient types exist

### tsup.config.ts

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  external: [],
  treeshake: true,
})
```

### vitest.config.ts

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      exclude: ['tests/**', '**/*.config.ts', 'dist/**'],
    },
    setupFiles: ['./tests/setup.ts'],
  },
})
```

### eslint.config.cjs

- Extends: `@typescript-eslint/recommended`
- Rules: `no-unused-vars` (error), `prefer-const` (error), `no-console` (warn), `@typescript-eslint/no-explicit-any` (warn)
- Prettier integration via `eslint-config-prettier` (disables conflicting rules)
- Env: `es2022`, `node`

### prettier.config.cjs

- `semi: true`
- `singleQuote: true`
- `trailingComma: 'all'`
- `printWidth: 100`
- `tabWidth: 2`
- `arrowParens: 'avoid'`

### commitlint.config.cjs

- Extends: `@commitlint/config-conventional`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### .lintstagedrc.cjs

```js
module.exports = {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml}': ['prettier --write'],
}
```

### .husky/pre-commit

```sh
npx lint-staged
```

### .husky/commit-msg

```sh
npx --no -- commitlint --edit $1
```

### .github/workflows/ci.yml

Matrix: Node 18, 20, 22
Jobs:
1. **lint**: `npm run lint`
2. **typecheck**: `npm run typecheck`
3. **test**: `npm run test:coverage`
4. **build**: `npm run build`
5. **docs**: `npm run docs`

All jobs run in parallel. A final job gates on all of them. Artifacts: coverage report, dist, docs.

### .gitignore

```
node_modules/
dist/
docs/
coverage/
*.log
.DS_Store
.env
.env.*
!.env.example
```

### .npmignore

```
src/
tests/
.github/
.husky/
.lintstagedrc.cjs
commitlint.config.cjs
vitest.config.ts
tsconfig.json
tsconfig.build.json
eslint.config.cjs
prettier.config.cjs
typedoc.json
*.test.ts
*.spec.ts
```

### README.md

Sections:
- Badges (CI, npm, type definitions, license)
- Installation
- Quick Start / Usage
- API Overview
- Configuration
- Development (install deps, scripts)
- Publishing (step-by-step manual process: version bump, changelog, tag, publish, push)
- Contributing (conventional commits, PR process)
- License

### CHANGELOG.md

Template with sections: Unreleased, [0.1.0] - YYYY-MM-DD.

### LICENSE

MIT license.

## 5. Implementation Order

1. **Initialize project**: Create directory structure, `package.json`, lockfile
2. **Install dependencies**: devDependencies (tsup, vitest, typescript, eslint, prettier, husky, commitlint, lint-staged, typedoc)
3. **Configure TypeScript**: `tsconfig.json`, `tsconfig.build.json`
4. **Configure Vitest**: `vitest.config.ts`, `tests/setup.ts`
5. **Configure tsup**: `tsup.config.ts`
6. **Configure ESLint + Prettier**: `eslint.config.cjs`, `prettier.config.cjs`, install `eslint-config-prettier`
7. **Configure commitlint**: `commitlint.config.cjs`
8. **Configure lint-staged**: `.lintstagedrc.cjs`
9. **Set up Husky**: `npx husky install`, add pre-commit and commit-msg hooks
10. **Create placeholder source**: `src/index.ts`, `src/lib/utils.ts`
11. **Create placeholder tests**: `tests/lib/utils.test.ts`
12. **Configure GitHub Actions**: `.github/workflows/ci.yml`
13. **Create docs config**: `typedoc.json`
14. **Create README.md** with install, usage, and publish instructions
15. **Create CHANGELOG.md** and LICENSE
16. **Initialize Git**: `git init`, initial commit
17. **Verify CI**: Push to remote, confirm all jobs pass

## 6. Git Workflow

- Branch: `main` is the release branch
- Feature work: `feat/...`, `fix/...`, `docs/...` branches
- Commit convention: `type(scope): message` (e.g., `feat(core): add utility function`)
- Pre-commit: lint-staged runs ESLint + Prettier on staged files
- Commit-msg: commitlint validates conventional commit format
- CI gates: All jobs (lint, typecheck, test, build, docs) must pass on PRs and main

## 7. Publishing Workflow (Manual)

Documented in README:

1. Ensure all CI checks pass on `main`
2. Bump version in `package.json` (`npm version patch|minor|major`)
3. Update `CHANGELOG.md` with changes since last release
4. Commit with message `chore(release): bump version to X.Y.Z`
5. Tag: `git tag vX.Y.Z && git push --tags`
6. Build: `npm run build`
7. Publish: `npm publish --access public`
8. Create GitHub Release with tag and changelog notes
9. Push to main: `git push origin main`

## 8. TypeDoc Setup

- Config in `typedoc.json`
- Input: `src/`
- Output: `docs/`
- Options: `name`, `excludePrivate`, `includeVersion`, `gitRevision: 'main'`
- CI generates docs but does not auto-publish (manual decision for where to host)

## 9. Verification Checklist

Before calling the setup complete:

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run test` passes with zero failures
- [ ] `npm run build` produces valid ESM + CJS in `dist/`
- [ ] `npm run docs` generates API docs in `docs/`
- [ ] `dist/index.d.ts` exists and is valid
- [ ] `npm run format` formats all source files
- [ ] Pre-commit hook runs lint-staged and passes
- [ ] GitHub Actions CI runs all jobs on push
- [ ] Package can be published to npm (dry-run: `npm publish --dry-run`)
- [ ] Library works in both Node (import/require) and browser (bundler)

## 10. Notes & Customization Points

- **TypeDoc hosting**: Currently generates to `docs/`. For GitHub Pages, add a deploy step. Skip if not needed.
- **Coverage thresholds**: 80/80/70/80 is a reasonable default. Adjust as needed.
- **Monorepo path**: If you later need multiple packages, migrate to pnpm workspaces with `packages/*` layout. The current setup won't conflict.
- **Git remote**: The repo has no remote yet. After creating a GitHub repo, add it via `git remote add origin <url>`.
