# Fix Entry Component Type Checking

## Problem

Current `Entry` constructor accepts `components: Component[]` which allows ANY components regardless of what the Entity's columns are:

```ts
// Currently allowed (WRONG):
new Entry(Actor, [new Health(), new Unused()]); // No TypeScript error!
```

## Goal

Components passed to Entry constructor must be compile-time checked against Entity's columns:

```ts
// Should be required:
new Entry(Actor, [new Position(), new Velocity()]); // OK
new Entry(Actor, [new Health(), new Unused()]); // ERROR
new Entry(Actor, [new Position()]); // ERROR (missing Velocity)
```

## Fix

### 1. Update `src/entry.ts` - Constructor parameter type

Change:

```ts
constructor(entityType: EntityClass<E>, components: Component[])
```

To:

```ts
constructor(
  entityType: EntityClass<E>,
  components: { [K in keyof EntityClass<E>['columns']]: InstanceType<EntityClass<E>['columns'][K]> }
)
```

### 2. How the mapped type works

For `Actor` where `Actor.columns = [Position, Velocity]`:

- `EntityClass<E>['columns']` = tuple `[Position, Velocity]`
- `keyof [Position, Velocity]` = `"0" | "1"`
- `{ [K in "0" | "1"]: InstanceType<[Position, Velocity][K]> }` = `{ 0: Position, 1: Velocity }`
- This becomes tuple `[Position, Velocity]`

### 3. Result

TypeScript will enforce that:

- Number of components matches number of columns
- Each component at index K must be InstanceType of column at index K

### 4. Tests to verify

- `new Entry(Actor, [pos, vel])` - compiles
- `new Entry(Actor, [pos])` - compile error (missing component)
- `new Entry(Actor, [pos, vel, hp])` - compile error (too many)
- `new Entry(Actor, [vel, pos])` - compile error (wrong types at positions)
- `new Entry(Actor, [new Health()])` - compile error (Health not in Actor.columns)

## Implementation

### `src/entry.ts` changes

```ts
constructor(
  entityType: EntityClass<E>,
  components: { [K in keyof EntityClass<E>['columns']]: InstanceType<EntityClass<E>['columns'][K]> }
) {
  this.entityType = entityType
  this.components = components as Component[]
}
```

### `tests/entry.test.ts` changes

Add tests that verify compile-time rejection of wrong component types.

## Risks

- The mapped type approach may not work perfectly with TypeScript's inference
- May need additional type casting or helper types
- If it doesn't work, alternative is to use `as const` on defineEntity return type
