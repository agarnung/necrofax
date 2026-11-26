# How NecroFax used Kiro

## Kiro surface

Kiro IDE. The project was built with Kiro's spec-driven workflow, steering docs and
agent hooks. Kiro CLI, Kiro Web and Kiro Crew were not used.

## Spec-driven development

The spec lives in `.kiro/specs/necrofax/`:

- `requirements.md` defines the user stories and acceptance criteria: receive a fax,
  read the paper, reply, dial and send, search the archive, mute the line and respect
  reduced motion.
- `design.md` fixes the frame format (magic, version, dimensions, sender/receiver,
  date, page, line and run counts, bitmap, CRC32), the ten-state handshake, the tones
  and the UI.
- `tasks.md` is the build plan; every code, test and document task is checked off.

The spec-first approach made the hard parts testable before the UI existed. The codec,
the CRC32 and the handshake were implemented and tested first; the machine, the paper
and the archive were built on top of a frozen contract. A vibe-coded version would have
produced a fax-themed interface without a real frame or a real handshake; the spec forced
the codec, the error cases and the archive round-trip to be part of the product.

## Steering

`.kiro/steering/` keeps the agent aligned with the project:

- `product.md` — the vision: a fax machine, not a dashboard; local-first; no accounts.
- `tech.md` — no dependencies, no build step, no network, Node 20+ for the tests.
- `structure.md` — the file layout and the boundary between codec, handshake, fax,
  archive and UI.

The biggest difference was the "no network, no account, no tracking" constraint. It stopped
scope creep and kept the app a single static page with a local archive.

## Agent hooks

- `.kiro/hooks/on-save-tests.kiro.hook` runs `npm test` when a file is saved.
- `.kiro/hooks/on-save-syntax.kiro.hook` runs `node --check` on the app files.

The hooks caught syntax errors and codec/archive regressions while editing, before a manual
test run. The test hook kept the 34 tests green through the UI and archive work.

## Custom agents

No custom agents. Kiro IDE's default agent was enough for a project of this size.

## MCP

No MCP servers. The app has no network and no external service, so MCP would not have
helped the runtime.

## Property-based testing

No PBT. The codec and the handshake are deterministic, and the unit tests pin the frame
layout, the CRC, the bad magic, the bad runs, the trailing bytes, the handshake transitions,
the tones and the archive round-trip. A PBT pass over random valid frames is a possible next
step, but it was not used in this build.

## Kiro powers

No Kiro powers. The bundled spec, steering and hook workflow covered the build.

## Honest limits

Kiro was used as an IDE and as a spec/steering/hook workflow, not as a runtime
dependency. The app itself is plain HTML, CSS and JavaScript; the tests use the Node test
runner. No Kiro credit was required to run the submitted app.
