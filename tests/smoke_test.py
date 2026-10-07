#!/usr/bin/env python3
"""Build Night Museum smoke test.
1. data: every painting's image exists (site/img + embedded data URI in the snapshot) and its source screenshot exists
2. every placard stat (files, loc, tests, screenshots) matches a fresh hub/scan.py run
3. rules: private projects have no picture; snapshot < 25 MB, no external URLs for scripts/images; usage sign matches usage.json
4. live server on :4263 serves index + images
5. headless Chrome renders the snapshot with WebGL (canvas non-blank) for a room view
"""
import json, os, re, subprocess, sys, tempfile, urllib.request
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "hub")); import scan  # noqa
sys.path.insert(0, HERE); import build  # noqa
ok = fail = 0
def check(cond, msg):
    global ok, fail
    if cond: ok += 1
    else: fail += 1; print("FAIL", msg)
D = json.load(open(os.path.join(HERE, "data", "museum.json")))
snap = open(os.path.join(HERE, "dist", "museum-snapshot.html"), encoding="utf-8").read()
m = re.search(r"window\.MUSEUM=(\{.*?\});</script>", snap, re.S); S = json.loads(m.group(1))
check(len(D["paintings"]) == len(S["paintings"]) > 0, "snapshot painting count")
names_expected = sorted(n for n in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, n)) and not n.startswith(".") and n not in ("museum", "hub", "__pycache__"))
check(sorted(p["name"] for p in D["paintings"]) == names_expected, f"every project hung exactly once ({len(names_expected)} expected)")
for p, sp in zip(D["paintings"], S["paintings"]):
    n = p["name"]
    fresh = scan.project(n, do_ping=False)["counts"]
    for k in ("files", "loc", "tests", "screenshots"):
        check(p["stats"][k] == fresh[k], f"{n}.{k}: placard {p['stats'][k]} vs scan.py {fresh[k]}")
        check(sp["stats"][k] == fresh[k], f"{n}.{k} (snapshot)")
    check(bool(p["desc"]), f"{n} has a description")
    if n in build.PRIVATE:
        check(p["image"] is None and sp["image"] is None, f"{n} private -> placard only")
        continue
    if p["image"]:
        check(os.path.exists(os.path.join(HERE, "site", p["image"]["file"])), f"{n} image file in site/")
        check(os.path.exists(os.path.join(ROOT, n, p["image"]["src"])), f"{n} source screenshot exists")
        check(sp["image"]["file"].startswith("data:image/jpeg;base64,") and len(sp["image"]["file"]) > 5000, f"{n} embedded image in snapshot")
        best = [s for s in fresh and scan.project(n, do_ping=False)["screenshots"] if os.path.basename(s).startswith("00-best")]
        if best: check(p["image"]["src"] == sorted(best)[0], f"{n} uses 00-best screenshot")
    else:
        check(p["imageNote"].startswith("placard-only"), f"{n} placard-only reason")
u = json.load(open(os.path.join(ROOT, "usage.json")))
check(D["lobby"]["usage"] == u, "lobby usage sign data == usage.json (rebuild if usage.json changed)")
check(D["lobby"]["strip"] and S["lobby"]["strip"]["file"].startswith("data:image"), "lobby Build Night strip embedded")
size = os.path.getsize(os.path.join(HERE, "dist", "museum-snapshot.html"))
check(size < 25e6, f"snapshot size {size/1e6:.1f} MB < 25 MB")
check(not re.search(r'<script[^>]+src=|<link[^>]+href="http', snap), "snapshot has no external script/link tags")
# live server
port = int(os.environ.get("MUSEUM_PORT", "4263"))
try:
    html = urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=5).read().decode()
    check("window.MUSEUM=" in html, "live index serves data")
    first = next(p for p in D["paintings"] if p["image"])
    check(urllib.request.urlopen(f"http://127.0.0.1:{port}/{first['image']['file']}", timeout=5).status == 200, "live image served")
    check(urllib.request.urlopen(f"http://127.0.0.1:{port}/three.iife.min.js", timeout=5).status == 200, "live three.js served")
except Exception as e:
    check(False, f"live server :{port}: {e}")
# render
with tempfile.TemporaryDirectory() as td:
    out = os.path.join(td, "r.png")
    subprocess.run(["nice", "-n", "10", "google-chrome", "--headless=new", "--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                    "--hide-scrollbars", "--window-size=800,500", "--virtual-time-budget=8000", f"--user-data-dir={td}/p", f"--screenshot={out}",
                    f"file://{HERE}/dist/museum-snapshot.html?room=Sports&yaw=25&x=1.5"], capture_output=True, timeout=120)
    try:
        from PIL import Image
        im = Image.open(out).convert("RGB"); colors = len(set(im.resize((80, 50)).getdata()))
        check(colors > 200, f"WebGL render has detail ({colors} colors)")
    except Exception as e:
        check(False, f"render: {e}")
print(f"{ok} passed, {fail} failed · {len(D['paintings'])} paintings ({sum(1 for p in D['paintings'] if p['image'])} with pictures) in {len(D['rooms'])} rooms")
sys.exit(1 if fail else 0)
