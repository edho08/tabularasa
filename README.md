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

Entities define table schemas using generic type parameters:

```ts
import { Entity } from 'tabularasa';

class Actor extends Entity<[Position, Velocity]> {}
```

### Work with Tables and Entries

```ts
import { World } from 'tabularasa';

const world = new World();
const table = world.tables.get(Actor);

// Insert entries (no entity instance needed)
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

  onAttached(entry, index) {
    console.log('Component added to entry');
  }

  onDetached(entry, index) {
    console.log('Component removed from entry');
  }

  onDeserialized(entry, index) {
    console.log('Component was deserialized');
  }
}
```

### Serialization

Tables must be marked as serializable before use:

```ts
// Mark table as serializable (optionally specify columns)
table.serializeable([Position, Velocity]);

// Serialize all marked tables
const data = world.tables.serialize();

// Deserialize (replaces existing entries)
world.tables.deserialize(data);
```

## API Reference

### Core Classes

- `Component` - Base class for data containers
- `Entity<C>` - Table schema definition with component types
- `Entry` - Row in a table (instance of entity)
- `Table` - Storage for entries of same entity type
- `World` - Container for all tables and resources
- `Resource` - Singleton data accessible via World

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

## License

MIT
