#!/usr/bin/env python3
"""Serve museum/site on :4263 (override MUSEUM_PORT). Static files only."""
import functools, http.server, os
PORT = int(os.environ.get("MUSEUM_PORT", "4263"))
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=SITE)
http.server.ThreadingHTTPServer.allow_reuse_address = True
print(f"Build Night Museum on http://127.0.0.1:{PORT}/", flush=True)
http.server.ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
