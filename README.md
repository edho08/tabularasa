# tabularasa

A general-purpose TypeScript library for Node.js and browser environments.

## Installation

```bash
npm install tabularasa
```

## Usage

```ts
import { greet } from 'tabularasa'

console.log(greet('World')) // Hello, World!
```

## Development

### Setup

```bash
npm install
```

### Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run build`    | Build the library (ESM + CJS)        |
| `npm run dev`      | Build with watch mode                |
| `npm run test`     | Run unit tests                       |
| `npm run test:coverage` | Run tests with coverage         |
| `npm run lint`     | Lint source files                    |
| `npm run lint:fix` | Lint and auto-fix issues             |
| `npm run format`   | Format source files                  |
| `npm run typecheck`| Run TypeScript type checking         |
| `npm run docs`     | Generate API documentation           |

## Publishing

> **Note:** This library uses [Conventional Commits](https://www.conventionalcommits.org/). Please follow this format for all commits.

### Manual Publish Steps

1. **Ensure CI passes** - All checks on `main` must be green.

2. **Update version**:
   ```bash
   # patch: 0.1.0 -> 0.1.1 (bug fixes)
   # minor: 0.1.0 -> 0.2.0 (new features, backward compatible)
   # major: 0.1.0 -> 1.0.0 (breaking changes)
   npm version patch  # or minor / major
   ```

3. **Update CHANGELOG.md** with changes since the last release.

4. **Commit the release**:
   ```bash
   git add -A
   git commit -m "chore(release): bump version to X.Y.Z"
   ```

5. **Push with tags**:
   ```bash
   git push origin main --tags
   ```

6. **Publish to npm**:
   ```bash
   npm run build
   npm publish --access public
   ```

7. **Create a GitHub Release**:
   - Go to the repository on GitHub
   - Click "Releases" → "Draft a new release"
   - Select the tag you just pushed
   - Add release notes from CHANGELOG.md
   - Publish the release

8. **Verify**:
   ```bash
   npm view tabularasa
   ```

## Contributing

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**
```
feat(core): add new utility function
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
```

### Pull Request Process

1. Fork the repository and create a feature branch
2. Follow conventional commit format
3. Ensure all CI checks pass
4. Request a review

## License

MIT
