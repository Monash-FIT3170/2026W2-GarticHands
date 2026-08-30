# `components/ui/` — design system primitives

Composable building blocks. Every visible element should be assembled from these — **don't inline arbitrary Tailwind classes** in Pages when a primitive already exists. Adding a new on-screen pattern means extending or adding a primitive here, not hardcoding it in a Page.

## Inventory

| File                | What it is                                                                     |
| ------------------- | ------------------------------------------------------------------------------ |
| `Page.tsx`          | Page shell — provides background, top-right buttons, optional logo.            |
| `Card.tsx`          | Surface container in three variants: `lobby`, `hero`, `glass`.                 |
| `Button.tsx`        | All buttons — variants: `primary`, `secondary`, `submit`, `start`, `outline`, `ghost`, `ready`, `leave`. |
| `Avatar.tsx`        | Player avatars in four variants: `guest`, `host-large`, `host-row`, `player-row`. |
| `Badge.tsx`         | Status pill (host / ready / waiting) in two tones: `lobby`, `simple`.          |
| `Logo.tsx`          | Wordmark + subtitle pair. `compact` prop for lobby placement.                  |
| `TopRightButtons.tsx` | Top-right volume / settings / rules cluster. Click handlers are props.        |
| `CountdownTimer.tsx` | Self-managed seconds-left display with `paused` + `onExpire`.                 |
| `RoundHeader.tsx`   | "Round X of Y" label.                                                          |
| `Toast.tsx`         | Ephemeral bottom toast + `useToast()` hook returning `{ toast, show }`.        |
| `icons/`            | SVG glyphs — `PersonIcon`, `VolumeIcon`, `GearIcon`, `BookIcon`.               |
| `index.ts`          | Barrel — `import { Page, Card, Button } from '../components/ui'`.              |

## Principles

1. **One look per variant.** A variant is a *named visual*, not a parameter dial. If a new variant requires a new color, add a new variant. If a new variant requires a new shape, add a new variant. Don't accept arbitrary `color` / `padding` props that explode the API surface.
2. **Composition over inheritance.** Pages assemble primitives; primitives never wrap pages. No primitive imports from `../Pages/`.
3. **No business logic.** A primitive that calls `fetch` or `navigate` is the wrong abstraction — push that to the Page.
4. **Self-contained state.** Hooks (`useToast`, `CountdownTimer`) own their state so Pages stay thin.
5. **Tailwind utility-first.** Classes inline; no separate CSS file per component unless animations need it. Override style by passing `className` — never by exposing every style prop.
6. **Visually stable.** Adding or refactoring a primitive must not change rendered pixels. If you're tempted to "improve" the look, file a design ticket and ship the visual change separately.

## Adding a new primitive

1. Create `MyThing.tsx` in this folder.
2. Single default export, props-as-interface, `ReactNode` children where applicable.
3. Add the export to `index.ts`.
4. Add a row to the inventory table above.
5. If it has multiple visual styles, expose them as a `variant` union, not as boolean flags.

## Adding a new variant to an existing primitive

1. Add the literal to the `ButtonVariant` / `CardVariant` / etc. union.
2. Extend the switch in the variant-classes function.
3. Add a one-line comment explaining when to use it (which page / which action).

## Anti-patterns

- ❌ `<Button className="bg-red-600 rounded-2xl …">` — overriding the variant's look. Add a real variant.
- ❌ `<Page>` inside `<Page>` — pages are leaves of the route tree, not nestable.
- ❌ Importing from `../../Pages/...` inside a primitive — circular.
- ❌ Per-component CSS file — Tailwind first; if you need keyframes, put them in `index.css` under `@layer`.

## See also

- [`../../../AGENTS.md`](../../../AGENTS.md) — full conventions for code generators.
- [`../../../CONTRIBUTING.md`](../../../CONTRIBUTING.md) — dev workflow.
