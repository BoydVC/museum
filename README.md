# Build Night Museum

**A walkable 3D art gallery of everything TokenMax built on Oct 7, 2026: each project hangs as a framed painting with a museum placard.**

- **Live:** `nohup ./run.sh` → http://127.0.0.1:4263/ (box only; `./stop.sh` stops it)
- **Offline:** `dist/museum-snapshot.html` is one self-contained file (three.js, data and all pictures inlined, about 5 MB). It opens from `file://` on any device, phones included.
- **Screenshots:** `screenshots/` (best: `00-best-family-room.png`)

## What's inside
- **Lobby:** the Fleet Funnies *Build Night Special* strip on a freestanding easel as the centerpiece (both sides), a **Fuel Gauge** sign with the Grok Bot weekly usage reading from `/workspace/tokenmax/usage.json` (percent used, when it was read, reset date), and a welcome sign with the totals.
- **Five rooms, one after another:** Fleet → Sports → Family & Kids → Work → Space & Fun. Each doorway carries the room name and painting count. Any new project folder not listed in `build.py` lands in Space & Fun automatically.
- **Paintings:** each project's best existing screenshot: `screenshots/00-best*` if there is one, otherwise the hub's cover pick from `hub/scan.py` (its "01-…" / first screenshot rule), otherwise the first PNG in `dist/` or `out/` (recap's poster, the trailer's contact sheet). Pictures are downscaled to 960 px JPEGs.
- **Placards:** project title, a one-line description taken from the first prose paragraph of its README, and stats measured by `hub/scan.py` (files, lines of code, test files, screenshots).
- **Placard-only frames:** `slack-pulse` and `docket-pilot` (private work content) and `trip-kit` (flight confirmation codes) show a "picture withheld" card instead of a screenshot.

## Controls
| | Desktop | Phone |
|---|---|---|
| Walk | W A S D or ↑ ↓ (← → turn); mouse wheel | swipe up / down |
| Look | drag with the mouse | swipe left / right |
| Go somewhere | click the floor | tap the floor |
| Full-screen painting | click it (Esc closes) | tap it |
| Auto-tour | ▶ Auto-tour or **T**: glides past the lobby signs and every painting, 3.5 s each, with a caption | same button |
| Jump | "Jump to room…" menu | same |

Deep links (used for screenshots): `?room=Sports&yaw=25&x=1.5`, `?p=chopsticks`, `?open=bot-island-3d`, `?tour=1&dwell=5`, `?help=1`.

## How it's built
`build.py` imports `/workspace/tokenmax/hub/scan.py` read-only, calls `project(name, do_ping=False)` for every folder in `/workspace/tokenmax` (except `hub` and `museum`), and writes `data/museum.json`, `site/` (served by `server.py`) and the snapshot. three.js is the local IIFE build copied from `bot-island-3d/vendor` (MIT, `vendor/LICENSE`); no CDN. Nothing outside this folder is written.

## Tests
`python3 tests/smoke_test.py` (also run by `./run.sh`):
- every project is hung exactly once; every painting's image exists in `site/img` and embedded in the snapshot, and its source screenshot exists
- projects with a `00-best*` screenshot use it
- every placard stat matches a **fresh** `scan.py` run (so if a project changes after the build, re-run `./run.sh`)
- private projects carry no picture; lobby usage equals `usage.json`; snapshot under 25 MB with no external script/link tags
- the live server on :4263 serves the page, an image and three.js; headless Chrome (SwiftShader) renders a room with detail

## Honest notes
- Stats are a moment-in-time measurement; projects still being built tonight will drift until the museum is rebuilt.
- The usage sign shows only what `usage.json` holds (one reading). It doesn't invent a history.
- Lines of code follow scan.py's rules (hand-written .py/.js/.html/.css/.sh, bundles over 200 KB skipped).


---
## Repo notes
- **Built:** Oct 7, 2026, by TokenMax (Boyd's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/museum` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
