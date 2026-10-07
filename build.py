#!/usr/bin/env python3
"""Build Night Museum builder. Reads /workspace/tokenmax read-only; writes only inside museum/.
- stats come straight from hub/scan.py (project(name, do_ping=False)["counts"])
- picture: screenshots/00-best* if present, else scan.py's cover pick, else a png in dist/ or out/ (else placard-only)
- slack-pulse, docket-pilot (work content) and trip-kit (flight confirmation codes) are placard-only
Outputs: site/ (served on :4263), data/museum.json, dist/museum-snapshot.html (single offline file)."""
import base64, datetime as dt, glob, io, json, os, re, shutil, sys
from zoneinfo import ZoneInfo
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "hub"))
import scan  # noqa: E402

ET = ZoneInfo("America/New_York")
SELF = os.path.basename(HERE)
PRIVATE = {"slack-pulse": "private work content", "docket-pilot": "private work content",
           "trip-kit": "private travel details (confirmation codes)"}
ROOMS = [
    ("Fleet", "Grok Bot fleet", ["bot-island", "bot-island-3d", "fleet-funnies", "fleet-yearbook", "fleet-doctor", "ship-it-stats",
                                  "bot-launcher", "explainer-studio", "agent-playbook", "llm-box-advisor", "trailer", "recap"]),
    ("Sports", "Ravens · Orioles · Chelsea · Terps", ["sports-desk", "ravens-film-room", "orioles-2026", "chelsea-time-machine",
                                                      "chelsea-matchday", "terps-preview", "season-book"]),
    ("Family & Kids", "Char, Vic and the Boyd household", ["fridge-board", "family-week", "times-archive", "hspt-quest",
                                                           "math-arcade", "writing-studio", "trivia-night"]),
    ("Work", "KPD and the day job", ["ai-ops-atlas", "trip-kit", "slack-pulse", "docket-pilot"]),
    ("Space & Fun", "Starship, bookmarks and the rest", ["chopsticks", "mission-control", "boyd-wall", "bookmark-atlas", "pods-radio"]),
]
FALLBACK_ROOM = "Space & Fun"
MAX_W = 960


def describe(readme):
    """One line from the first prose paragraph of the README (skips headings, Live/Offline/Print lines, tables, lists, quotes)."""
    if not os.path.exists(readme):
        return None
    blocks, cur = [], []
    for l in open(readme, encoding="utf-8", errors="replace").read().splitlines():
        if l.strip():
            cur.append(l.strip())
        elif cur:
            blocks.append(cur); cur = []
    if cur:
        blocks.append(cur)
    for b in blocks:
        lines = [l for l in b if not re.match(r"^(#|\||- |\* |>|!\[|```|\*\*(Live|Offline|Print|Screenshots?|Run)[^*]*\*\*|(Live|Offline|Print):)", l)
                 ]
        if not lines:
            continue
        text = " ".join(lines)
        text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
        text = re.sub(r"[*_`]", "", text).strip()
        sents = [s for s in re.split(r"(?<=[.!?])\s+", text) if s and not s.lower().startswith("tokenmax build night")
                 and not re.search(r"127\.0\.0\.1|snapshot\.html|localhost|^Runs on", s)]
        if not sents:
            continue
        s = sents[0]
        if len(s) < 40 and len(sents) > 1:
            s = s + " " + sents[1]
        return s if len(s) <= 170 else s[:167].rsplit(" ", 1)[0] + "…"
    return None


def pick_image(name, p):
    d = os.path.join(ROOT, name)
    if name in PRIVATE:
        return None, "placard-only: private " + PRIVATE[name].split("private ", 1)[1]
    imgs = [s for s in p["screenshots"] if os.path.splitext(s)[1].lower() in {".png", ".jpg", ".jpeg", ".webp"}]
    best = sorted(s for s in imgs if os.path.basename(s).lower().startswith("00-best"))
    if best:
        return best[0], "00-best screenshot"
    if p["cover"]:
        return p["cover"], "scan.py cover pick"
    for sub in ("dist", "out"):
        pngs = sorted(glob.glob(os.path.join(d, sub, "*.png")))
        if pngs:
            return os.path.relpath(pngs[0], d), f"{sub}/ image (no screenshots folder)"
    return None, "placard-only: no image found"


def shrink(src, dst, max_w=MAX_W):
    im = Image.open(src).convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    if im.height > max_w * 1.3:  # very tall full-page shots: keep the top
        im = im.crop((0, 0, im.width, int(im.width * 1.0)))
    im.save(dst, "JPEG", quality=78, optimize=True)
    return im.size


def main():
    site = os.path.join(HERE, "site")
    shutil.rmtree(site, ignore_errors=True)
    os.makedirs(os.path.join(site, "img"))
    names = [n for n in sorted(os.listdir(ROOT)) if os.path.isdir(os.path.join(ROOT, n)) and not n.startswith(".")
             and n not in (SELF, scan.HUB, "__pycache__")]
    assigned = {n for _, _, ms in ROOMS for n in ms}
    rooms = []
    for title, sub, members in ROOMS:
        members = [m for m in members if m in names]
        if title == FALLBACK_ROOM:
            members += [n for n in names if n not in assigned]
        rooms.append({"title": title, "subtitle": sub, "members": members})
    paintings = []
    for ri, r in enumerate(rooms):
        for name in r["members"]:
            p = scan.project(name, do_ping=False)
            rel, why = pick_image(name, p)
            img = None
            if rel:
                out = f"img/{name}.jpg"
                w, h = shrink(os.path.join(ROOT, name, rel), os.path.join(site, out))
                img = {"src": rel, "file": out, "w": w, "h": h}
            c = p["counts"]
            paintings.append({"name": name, "title": p["title"], "room": r["title"], "roomIndex": ri,
                              "desc": describe(os.path.join(ROOT, name, "README.md")) or p["pitch"] or "",
                              "stats": {"files": c["files"], "loc": c["loc"], "tests": c["tests"], "screenshots": c["screenshots"]},
                              "image": img, "imageNote": why})
    # lobby
    usage = json.load(open(os.path.join(ROOT, "usage.json")))
    strip = os.path.join(ROOT, "fleet-funnies", "dist", "png", "build-night-special.png")
    lobby = {"usage": usage, "strip": None}
    if os.path.exists(strip):
        w, h = shrink(strip, os.path.join(site, "img", "_build-night-special.jpg"), 1600)
        lobby["strip"] = {"src": "fleet-funnies/dist/png/build-night-special.png", "file": "img/_build-night-special.jpg", "w": w, "h": h}
    tot = {k: sum(p["stats"][k] for p in paintings) for k in ("files", "loc", "tests", "screenshots")}
    data = {"generatedAt": dt.datetime.now(ET).isoformat(timespec="seconds"), "rooms": [{k: r[k] for k in ("title", "subtitle")} | {"count": len(r["members"])} for r in rooms],
            "paintings": paintings, "lobby": lobby, "totals": tot}
    json.dump(data, open(os.path.join(HERE, "data", "museum.json"), "w"), indent=1)
    js = open(os.path.join(HERE, "web", "museum.js")).read()
    css = open(os.path.join(HERE, "web", "museum.css")).read()
    tpl = open(os.path.join(HERE, "web", "index.html")).read()
    three = open(os.path.join(HERE, "vendor", "three.iife.min.js")).read()
    shutil.copy(os.path.join(HERE, "vendor", "three.iife.min.js"), site)
    open(os.path.join(site, "museum.js"), "w").write(js)
    open(os.path.join(site, "museum.css"), "w").write(css)
    live = tpl.replace("<!--CSS-->", '<link rel="stylesheet" href="museum.css">') \
              .replace("<!--DATA-->", "<script>window.MUSEUM=" + json.dumps(data) + ";</script>") \
              .replace("<!--SCRIPTS-->", '<script src="three.iife.min.js"></script><script src="museum.js"></script>')
    open(os.path.join(site, "index.html"), "w").write(live)
    # offline: inline images as data URIs
    off = json.loads(json.dumps(data))
    def uri(f):
        return "data:image/jpeg;base64," + base64.b64encode(open(os.path.join(site, f), "rb").read()).decode()
    for p in off["paintings"]:
        if p["image"]:
            p["image"]["file"] = uri(p["image"]["file"])
    if off["lobby"]["strip"]:
        off["lobby"]["strip"]["file"] = uri(off["lobby"]["strip"]["file"])
    off["offline"] = True
    snap = tpl.replace("<!--CSS-->", "<style>" + css + "</style>") \
              .replace("<!--DATA-->", "<script>window.MUSEUM=" + json.dumps(off) + ";</script>") \
              .replace("<!--SCRIPTS-->", "<script>" + three.replace("</script", "<\\/script") + "</script><script>" + js + "</script>")
    out = os.path.join(HERE, "dist", "museum-snapshot.html")
    open(out, "w").write(snap)
    print(f"{len(paintings)} paintings in {len(rooms)} rooms; {sum(1 for p in paintings if p['image'])} with pictures; snapshot {os.path.getsize(out)/1e6:.1f} MB")


if __name__ == "__main__":
    main()
