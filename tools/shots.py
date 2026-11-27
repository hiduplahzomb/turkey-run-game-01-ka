#!/usr/bin/env python3
"""Take GOBBLE DASH screenshots (tools/ — OUTSIDE game/, on purpose).

Renders the game's own ?shot= scenes in headless Chromium via Playwright
and saves real renders of the game's code as JPEGs under screenshots/:

  1-climax.jpg  — mid-run in the Pine Forest, ~700m in: full HUD (score,
                  distance bar, dinner countdown, 3 hearts, dash meter,
                  Farmer Bram gap), Tilly mid-jump over the oven, corn arc,
                  carving knife swinging. This is the cover (first by name).
  2-title.jpg   — title screen: GOBBLE DASH / Escape Before Dinner.
  3-caught.jpg  — end screen: CAUGHT by Farmer Bram.
  4-escaped.jpg — end screen: ESCAPED into Freedom Forest.

Each shot waits for window.__shotReady, then screenshots at 1280x720.
Fails loudly on console errors, page errors, or any non-local request.

Usage: ~/workspace/wl-agent/venv/bin/python tools/shots.py
"""
import json
import os
import threading
import http.server
import functools

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(ROOT, "game")
SHOTS_DIR = os.path.join(ROOT, "screenshots")
PORT = 8124

SHOTS = json.load(open(os.path.join(ROOT, "shots.json")))


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=GAME)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    from playwright.sync_api import sync_playwright

    os.makedirs(SHOTS_DIR, exist_ok=True)
    httpd = serve()
    errors = []
    requests = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            page.on("request", lambda r: requests.append(r.url))
            for shot in SHOTS:
                page.goto(f"http://127.0.0.1:{PORT}/index.html{shot['query']}")
                page.wait_for_function("window.__shotReady === true", timeout=30000)
                page.wait_for_timeout(300)
                path = os.path.join(SHOTS_DIR, shot["name"])
                page.screenshot(path=path, type="jpeg", quality=88)
                print(f"SHOT: {shot['name']} {os.path.getsize(path)} bytes")
            browser.close()
    finally:
        httpd.shutdown()
    print("CONSOLE ERRORS:", json.dumps(errors, indent=2))
    external = [u for u in requests if not u.startswith(f"http://127.0.0.1:{PORT}")]
    print("REQUESTS TOTAL:", len(requests), "| EXTERNAL:", external)
    if errors or external:
        raise SystemExit("screenshot run had errors — see above")
    print("DONE")


if __name__ == "__main__":
    main()
