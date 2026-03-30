# tabularasa

A minimal, relational-algebra-powered entity-component system for games and interactive applications.

## Installation

```bash
npm install tabularasa
```

## Usage

### Define Components

Components are plain data containers with optional lifecycle hooks:

```ts
import { Component } from 'tabularasa';

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}
```

### Define Entities

Entities define table schemas using `Columns`:

```ts
import { Entity, Columns } from 'tabularasa';

class Actor extends Entity {
  static columns = Columns(Position, Velocity);
}
```

### Work with Tables and Entries

```ts
import { World, Table } from 'tabularasa';

const world = new World();
const table = world.getTable(Actor);

// Insert entries
const ref = table.insert([new Position(), new Velocity()]);
const entry = ref.deref()!;

// Access components
const pos = entry.get(Position);
entry.set(Position, new Position());

// Iterate over all entries
for (const entry of table) {
  console.log(entry.get(Position));
}

// O(1) deletion via swap-pop
table.delete(ref);
```

### Lifecycle Hooks

Components can override lifecycle methods:

```ts
class Health extends Component {
  current = 100;
  max = 100;

  onAttached(entry) {
    console.log('Component added to entry');
  }

  onDetached(entry) {
    console.log('Component removed from entry');
  }

  onAlive(entry) {
    console.log('Entry is alive');
  }

  onDead(entry) {
    console.log('Entry is dead');
  }
}
```

### Component Patterns

#### Option

Wrap a component that may or may not be present:

```ts
import { Option } from 'tabularasa';

const OptHealth = Option(Health);

const withHealth = new OptHealth(new Health()); // Some
const withoutHealth = new OptHealth(undefined); // None

withHealth.isSome(); // true
withHealth.isNone(); // false
withHealth.unwrap(); // Health
withHealth.unwrapOr(defaultHealth);
```

#### Union

A slot that holds exactly one of several component types:

```ts
import { Union } from 'tabularasa';

const UnionPosVel = Union(Position, Velocity);

const union = new UnionPosVel(new Position());
union.is(Position); // true
union.is(Velocity); // false
union.as(Position); // Position
```

#### Derived

Polymorphic storage for base class slots that can hold derived instances:

```ts
import { Derived } from 'tabularasa';

const DerivedPos = Derived(Position).sub(Position3D).sub(Position2D);

const pos3d = new Position3D();
const dp = new DerivedPos(pos3d);

dp.is(Position3D); // true (exact type)
dp.instanceOf(Position); // true (includes inheritance)
```

#### Readonly

Immutability wrapper that prevents modification:

```ts
import { Readonly } from 'tabularasa';

const RoHealth = Readonly(Health);

// onDetached throws TypeError("cannot change readonly component")
const ro = new RoHealth(new Health());
```

### Serialization

World provides serialization/deserialization for all entity tables:

```ts
// Serialize all entries for specified entities
const data = world.serialize([Actor, Enemy]);

// Deserialize (replaces existing entries)
world.deserialize([Actor, Enemy], data);
```

## API Reference

### Core Classes

- `Component` - Base class for data containers
- `Entity` - Table schema definition
- `Entry` - Row in a table (instance of entity)
- `Table` - Storage for entries of same entity type
- `World` - Container for all tables and resources
- `Resource` - Singleton data accessible via World

### Functions

- `Columns(...components)` - Define entity schema

### Pattern Functions

- `Option(Component)` - Optional component wrapper
- `Union(...Components)` - One-of variant wrapper
- `Derived(Component)` - Polymorphic component wrapper (use `.sub()` to add subtypes)
- `Readonly(Component)` - Immutable component wrapper

## Development

### Setup

```bash
npm install
```

### Scripts

| Command                 | Description                   |
| ----------------------- | ----------------------------- |
| `npm run build`         | Build the library (ESM + CJS) |
| `npm run test`          | Run unit tests                |
| `npm run test:coverage` | Run tests with coverage       |
| `npm run lint`          | Lint source files             |
| `npm run lint:fix`      | Lint and auto-fix issues      |
| `npm run format`        | Format source files           |
| `npm run typecheck`     | Run TypeScript type checking  |
| `npm run docs`          | Generate API documentation    |

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
