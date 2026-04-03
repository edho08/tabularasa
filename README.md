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

// Set component (uses value.constructor to find target)
entry.set(new Position());

// Iterate over all entries
for (const entry of table) {
  console.log(entry.get(Position));
}

// O(1) deletion via swap-pop
table.delete(ref);
```

### Entry API

Entries provide typed access to components:

| Method                   | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `get(C)`                 | Get first component of type C                  |
| `getAll(C)`              | Get all components of type C (array)           |
| `getAt(index)`           | Get component by slot index                    |
| `getAny(C)`              | Get first component of type C (runtime)        |
| `getAllAny(C)`           | Get all components of type C (runtime)         |
| `set(value)`             | Replace component (finds by value.constructor) |
| `setAt(index, value)`    | Set component by slot index                    |
| `setAny(value)`          | Replace component (runtime)                    |
| `setAtAny(value, index)` | Set at index after validating type exists      |
| `has(C)`                 | Check if component type exists (compile-time)  |
| `hasAny(C)`              | Check if component type exists (runtime)       |

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

### Entry Lifecycle

Entries transition through states:

- `CONSTRUCTED` → `ALIVE` (after `onAttached` called)
- `ALIVE` → `DYING` → `DEAD` (when deleted)

### Component Wrappers

#### Option<T>

Wraps an optional component. Serializes to `{}` when None, otherwise serializes inner.

```ts
import { Option } from 'tabularasa';

const OptPos = Option.for(Position);
const some = OptPos.some(new Position());
const none = OptPos.none();
```

#### Pin<T>

Prevents component removal while entry is alive. Throws if removal is attempted.

```ts
import { Pin } from 'tabularasa';

const PinPos = Pin.for(Position);
const pinned = PinPos.make(new Position());

// entry.set(pinned) throws if entry is ALIVE
// entry.delete() allows pin removal (entry is DYING)
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

### Wrapper Factories

- `Option.for(Component)` - Optional component wrapper
- `Pin.for(Component)` - Prevents component removal

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
