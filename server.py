#!/usr/bin/env python3
"""
3D Bútortervező Web Szerver (server.py)
- Automatikus szabad port keresés (8080 -> 8081 -> ...) és böngésző indítás.
- /api/catalog végpontok: Katalógus adatok mentése és betöltése (data/catalog.json).
- Automatikus Git szinkronizáció a háttérben (git add, commit, push origin main).
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import json
import subprocess
import threading
from datetime import datetime

DEFAULT_PORTS = [8080, 8081, 8082, 8083, 8084, 8085, 3000, 8000]
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, "data")
CATALOG_FILE = os.path.join(DATA_DIR, "catalog.json")

# Globális állapot a git műveletek követéséhez
git_lock = threading.Lock()
last_git_status = {
    "status": "idle",
    "message": "Nincs aktív git művelet",
    "timestamp": None
}

def run_git_sync(action_name="Katalógus frissítés"):
    """Háttérben futó Git szinkronizáció (add, commit, push)"""
    global last_git_status
    with git_lock:
        last_git_status["status"] = "syncing"
        last_git_status["message"] = f"Feltöltés a GitHub-ra folyamatban: {action_name}..."
        last_git_status["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n[GIT] Szinkronizáció indítása: {action_name}")

        try:
            # 1. git add data/catalog.json
            cmd_add = subprocess.run(["git", "add", "data/catalog.json"], cwd=DIRECTORY, capture_output=True, text=True, encoding="utf-8")
            if cmd_add.returncode != 0:
                print(f"[GIT HIBA - add]: {cmd_add.stderr}")

            # 2. git commit
            commit_msg = f"{action_name} ({datetime.now().strftime('%Y-%m-%d %H:%M')})"
            cmd_commit = subprocess.run(["git", "commit", "-m", commit_msg], cwd=DIRECTORY, capture_output=True, text=True, encoding="utf-8")
            if cmd_commit.returncode != 0:
                # Lehet, hogy nem volt változás
                print(f"[GIT commit]: {cmd_commit.stdout.strip() or cmd_commit.stderr.strip()}")

            # 3. git push origin main
            cmd_push = subprocess.run(["git", "push", "origin", "main"], cwd=DIRECTORY, capture_output=True, text=True, encoding="utf-8")
            if cmd_push.returncode == 0:
                last_git_status["status"] = "success"
                last_git_status["message"] = f"Sikeresen feltöltve a GitHub-ra: {action_name}"
                print(f"[GIT SIKER] A változtatások sikeresen felkerültek a GitHub-ra!")
            else:
                last_git_status["status"] = "error"
                last_git_status["message"] = f"Hiba a GitHub push során: {cmd_push.stderr.strip()}"
                print(f"[GIT HIBA - push]: {cmd_push.stderr}")

        except Exception as e:
            last_git_status["status"] = "error"
            last_git_status["message"] = f"Kivétel a git futtatásakor: {str(e)}"
            print(f"[GIT KIVÉTEL]: {e}")

        last_git_status["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Cache letiltása a fejlesztéshez és Access-Control
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/catalog':
            self.handle_get_catalog()
        elif self.path == '/api/git-status':
            self.handle_get_git_status()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/catalog':
            self.handle_post_catalog()
        else:
            self.send_error(404, "Not Found")

    def handle_get_catalog(self):
        """Katalógus adatok visszaadása JSON formátumban"""
        if os.path.exists(CATALOG_FILE):
            try:
                with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
                    data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(data.encode('utf-8'))
                return
            except Exception as e:
                print(f"Hiba a katalógus olvasásakor: {e}")

        # Ha nem létezik vagy hiba volt, üres struktúra
        empty_data = json.dumps({"categories": [], "items": []}, ensure_ascii=False)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(empty_data.encode('utf-8'))

    def handle_post_catalog(self):
        """Katalógus adatok mentése fájlba és szinkronizálás a GitHub-ra"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            action = data.get('action', 'Katalógus mentés')
            categories = data.get('categories', [])
            items = data.get('items', [])

            # Adatkönyvtár létrehozása, ha nincs
            os.makedirs(DATA_DIR, exist_ok=True)

            # Mentés a data/catalog.json fájlba
            payload = {
                "version": "1.0",
                "lastUpdated": datetime.now().isoformat(),
                "categories": categories,
                "items": items
            }
            with open(CATALOG_FILE, 'w', encoding='utf-8') as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)

            print(f"[KATALÓGUS] Sikeresen elmentve {len(items)} bútor és {len(categories)} kategória -> data/catalog.json")

            # Git szinkronizáció indítása háttérszálon
            threading.Thread(target=run_git_sync, args=(action,), daemon=True).start()

            response = {
                "success": True,
                "message": "Katalógus mentve és GitHub szinkronizáció elindítva!",
                "itemCount": len(items)
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            print(f"Hiba a katalógus mentésekor: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            err_resp = {"success": False, "error": str(e)}
            self.wfile.write(json.dumps(err_resp, ensure_ascii=False).encode('utf-8'))

    def handle_get_git_status(self):
        """Visszaadja a legutóbbi Git szinkronizáció állapotát"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(last_git_status, ensure_ascii=False).encode('utf-8'))


def find_available_server():
    socketserver.TCPServer.allow_reuse_address = True
    for port in DEFAULT_PORTS:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            return httpd, port
        except OSError:
            continue
    # Ha a listából egyik sem szabad, kérjünk a rendszertől egy szabad portot
    httpd = socketserver.TCPServer(("", 0), Handler)
    return httpd, httpd.server_address[1]

def main():
    os.chdir(DIRECTORY)
    os.makedirs(DATA_DIR, exist_ok=True)
    httpd, port = find_available_server()
    url = f"http://localhost:{port}"

    print("=" * 60)
    print(f"  3D Bútortervező és Katalógus Stúdió elindult!")
    print(f"  Elérési cím: {url}")
    print(f"  Munkakönyvtár: {DIRECTORY}")
    print(f"  GitHub Szinkronizáció: BEKAPCSOLVA (data/catalog.json)")
    print("  A leállításhoz zárd be ezt az ablakot vagy nyomj Ctrl+C-t.")
    print("=" * 60)

    # Böngésző automatikus megnyitása
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Nem sikerült automatikusan megnyitni a böngészőt: {e}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n Szerver leállítva.")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    main()
