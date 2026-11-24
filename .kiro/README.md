# .kiro

This folder is the source of truth for **NecroFax**.

- `specs/necrofax/requirements.md` — the user stories and acceptance criteria.
- `specs/necrofax/design.md` — the frame format, the handshake and the UI.
- `specs/necrofax/tasks.md` — the build plan and its state.
- `steering/product.md` — vision, audience and principles.
- `steering/tech.md` — stack and constraints.
- `steering/structure.md` — layout and naming.
- `hooks/on-save-tests.kiro.hook` — runs `npm test` on app or test changes.
- `hooks/on-save-syntax.kiro.hook` — runs `node --check` on the same files.

## How to use it in Kiro

1. Open the repository root in Kiro.
2. Open `specs/necrofax/requirements.md` and run the spec workflow. Kiro
   reads the requirements, the design and the tasks, and works through the list.
3. Keep `steering/` open so the agent knows the product, the stack and the layout
   before it writes code.
4. The hooks run on save. If your Kiro build names hook files differently, keep
   the JSON payloads and rename the files to match.
5. The app has no build step: `npm test` and `npm run serve`.
