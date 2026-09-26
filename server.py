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
import hashlib
import uuid
import base64
from datetime import datetime
from urllib.parse import urlparse, parse_qs

DEFAULT_PORTS = [8585, 8888, 8090, 8181, 8085, 8080]
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, "data")
CATALOG_FILE = os.path.join(DATA_DIR, "catalog.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
USER_CATALOGS_FILE = os.path.join(DATA_DIR, "user_catalogs.json")

def hash_password(password):
    """Jelszó hash-elése sóval"""
    salt = "butortervezo_secret_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def load_users():
    """Felhasználók betöltése fájlból, alapértelmezett admin létrehozása ha még nincs"""
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict) and "users" in data:
                    return data
        except Exception as e:
            print(f"[AUTH] Hiba a users.json olvasásakor: {e}")

    # Alapértelmezett struktúra beépített admin fiókkal
    default_users = {
        "users": [
            {
                "id": "admin_default",
                "email": "admin@butortervezo.hu",
                "name": "Adminisztrátor",
                "passwordHash": hash_password("admin123"),
                "role": "admin",
                "emailVerified": True,
                "createdAt": datetime.now().isoformat()
            }
        ]
    }
    save_users(default_users)
    return default_users

def save_users(users_data):
    """Felhasználók mentése fájlba"""
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[AUTH] Hiba a users.json mentésekor: {e}")
        return False

def load_user_catalogs():
    """Felhasználók saját bútorainak betöltése"""
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(USER_CATALOGS_FILE):
        try:
            with open(USER_CATALOGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[CATALOG] Hiba a user_catalogs.json olvasásakor: {e}")
    return {}

def save_user_catalogs(catalogs_data):
    """Felhasználók saját bútorainak mentése"""
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(USER_CATALOGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(catalogs_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[CATALOG] Hiba a user_catalogs.json mentésekor: {e}")
        return False

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
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == '/api/catalog':
            self.handle_get_catalog()
        elif path == '/api/user-catalog':
            self.handle_get_user_catalog(query)
        elif path == '/api/git-status':
            self.handle_get_git_status()
        elif path == '/api/auth/verify':
            self.handle_verify_email(query)
        elif path == '/api/elements' or path == '/api/model-elements':
            self.handle_get_elements()
        else:
            super().do_GET()

    def guess_category(self, name):
        n = name.lower()
        if n.startswith('s_asz'):
            return 'tall_cabinet'
        if n.startswith('s_pec') or n.startswith('pec_') or n.startswith('s_ef') or n.startswith('ef_') or 'elszivo' in n or 'hood' in n:
            return 'hood_cabinet'
        if n.startswith('s_f') or n.startswith('s_fs') or n.startswith('f_') or n.startswith('fsz') or 'felso' in n or 'wall' in n:
            return 'wall_cabinet'
        if n.startswith('s_a') or 'also' in n or 'base' in n or 'pult' in n or 'counter' in n or 'sink' in n:
            return 'base_cabinet'
        if n.startswith('s_m') or n.startswith('m_') or n.startswith('msz') or 'magas' in n or 'tall' in n or 'kamra' in n:
            return 'tall_cabinet'
        if 'asztal' in n or 'table' in n or 'desk' in n:
            return 'table'
        if 'szek' in n or 'chair' in n or 'fotel' in n:
            return 'chair'
        if 'fogo' in n or 'lab' in n or 'handle' in n or 'leg' in n or 'pant' in n:
            return 'accessory'
        return 'other'

    def handle_get_elements(self):
        """A '3d model/element' mappában található GLB/GLTF modellek listázása"""
        element_dir = os.path.join(DIRECTORY, "3d model", "element")
        thumbnails_dir = os.path.join(DIRECTORY, "thumbnails")
        os.makedirs(element_dir, exist_ok=True)
        os.makedirs(thumbnails_dir, exist_ok=True)
        items = []
        try:
            for fname in sorted(os.listdir(element_dir)):
                if fname.lower().endswith(('.glb', '.gltf')):
                    fpath = os.path.join(element_dir, fname)
                    stat = os.stat(fpath)
                    name_without_ext = os.path.splitext(fname)[0]
                    thumb_rel = f"thumbnails/{name_without_ext}.png"
                    thumb_full = os.path.join(DIRECTORY, "thumbnails", f"{name_without_ext}.png")
                    has_thumb = os.path.exists(thumb_full)
                    items.append({
                        "id": f"elem_{name_without_ext}",
                        "fileName": fname,
                        "name": name_without_ext,
                        "path": f"3d model/element/{fname}",
                        "size": stat.st_size,
                        "category": self.guess_category(name_without_ext),
                        "thumbnail": thumb_rel if has_thumb else None,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
            # Frissítjük a data/elements.json fájlt is
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(os.path.join(DATA_DIR, "elements.json"), "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[API ELEMENTS] Hiba a 3d model/element mappa olvasásakor: {e}")

        response = {
            "success": True,
            "count": len(items),
            "elements": items
        }
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/catalog':
            self.handle_post_catalog()
        elif path == '/api/user-catalog':
            self.handle_post_user_catalog()
        elif path == '/api/auth/register':
            self.handle_auth_register()
        elif path == '/api/auth/login':
            self.handle_auth_login()
        elif path == '/api/auth/resend-verification':
            self.handle_auth_resend_verification()
        elif path == '/api/elements/upload':
            self.handle_upload_element()
        elif path == '/api/elements/thumbnail':
            self.handle_upload_thumbnail()
        else:
            self.send_error(404, "Not Found")

    def handle_upload_thumbnail(self):
        """Kiskép (thumbnail) mentése a thumbnails mappába"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(body)

            name = payload.get('name', '').strip()
            data_url = payload.get('data', '')

            if not name or not data_url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Hiányzó név vagy képadat"}).encode('utf-8'))
                return

            safe_name = os.path.basename(name).replace('.glb', '').replace('.gltf', '')
            thumbnails_dir = os.path.join(DIRECTORY, "thumbnails")
            os.makedirs(thumbnails_dir, exist_ok=True)

            if ',' in data_url:
                data_url = data_url.split(',', 1)[1]

            import base64
            img_bytes = base64.b64decode(data_url)
            out_path = os.path.join(thumbnails_dir, f"{safe_name}.png")
            with open(out_path, "wb") as f:
                f.write(img_bytes)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "thumbnail": f"thumbnails/{safe_name}.png"}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))

    def handle_upload_element(self):
        """GLB/GLTF 3D modell feltöltése és mentése a 3d model/element mappába"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(body)

            file_name = payload.get('fileName', '').strip()
            base64_data = payload.get('data', '')

            if not file_name or not base64_data:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Hiányzó fileName vagy data mező"}).encode('utf-8'))
                return

            safe_name = os.path.basename(file_name)
            if not safe_name.lower().endswith(('.glb', '.gltf')):
                safe_name += '.glb'

            element_dir = os.path.join(DIRECTORY, "3d model", "element")
            os.makedirs(element_dir, exist_ok=True)
            target_path = os.path.join(element_dir, safe_name)

            if ',' in base64_data:
                base64_data = base64_data.split(',', 1)[1]

            raw_bytes = base64.b64decode(base64_data)
            with open(target_path, 'wb') as f:
                f.write(raw_bytes)

            name_without_ext = os.path.splitext(safe_name)[0]
            new_item = {
                "id": f"elem_{name_without_ext}",
                "fileName": safe_name,
                "name": name_without_ext,
                "path": f"3d model/element/{safe_name}",
                "size": len(raw_bytes),
                "modified": datetime.now().isoformat()
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "element": new_item}, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            print(f"[API ELEMENTS] Hiba a modell feltöltésekor: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))

    def handle_get_catalog(self):
        """Központi katalógus adatok visszaadása JSON formátumban"""
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

        empty_data = json.dumps({"categories": [], "items": []}, ensure_ascii=False)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(empty_data.encode('utf-8'))

    def handle_post_catalog(self):
        """Központi katalógus adatok mentése fájlba és szinkronizálás a GitHub-ra (Kizárólag Admin)"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            # Admin jogosultság vizsgálata
            is_admin = data.get('isAdmin', False) or data.get('role') == 'admin'

            # Ha a felhasználó nem admin, nem írhatja felül a központi katalógust
            if not is_admin:
                self.send_response(403)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                err = {
                    "success": False,
                    "error": "Kizárólag adminisztrátorként menthetsz a központi katalógusba! Kérjük, jelentkezz be adminként."
                }
                self.wfile.write(json.dumps(err, ensure_ascii=False).encode('utf-8'))
                return

            action = data.get('action', 'Központi katalógus mentés (Admin)')
            categories = data.get('categories', [])
            items = data.get('items', [])

            os.makedirs(DATA_DIR, exist_ok=True)

            payload = {
                "version": "1.0",
                "lastUpdated": datetime.now().isoformat(),
                "categories": categories,
                "items": items
            }
            with open(CATALOG_FILE, 'w', encoding='utf-8') as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)

            print(f"[KATALÓGUS - ADMIN] Sikeresen elmentve {len(items)} központi bútor és {len(categories)} kategória -> data/catalog.json")

            # Git szinkronizáció indítása háttérszálon
            threading.Thread(target=run_git_sync, args=(action,), daemon=True).start()

            response = {
                "success": True,
                "message": "Központi katalógus mentve és GitHub szinkronizáció elindítva!",
                "itemCount": len(items)
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            print(f"Hiba a központi katalógus mentésekor: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            err_resp = {"success": False, "error": str(e)}
            self.wfile.write(json.dumps(err_resp, ensure_ascii=False).encode('utf-8'))

    def handle_get_user_catalog(self, query):
        """Felhasználó saját bútorainak visszaadása"""
        user_id = query.get('userId', [''])[0]
        if not user_id:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "Hiányzó userId paraméter"}, ensure_ascii=False).encode('utf-8'))
            return

        all_user_catalogs = load_user_catalogs()
        user_items = all_user_catalogs.get(user_id, [])

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "items": user_items}, ensure_ascii=False).encode('utf-8'))

    def handle_post_user_catalog(self):
        """Felhasználó saját bútorainak mentése a privát katalógusába"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            user_id = data.get('userId')
            items = data.get('items', [])

            if not user_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Hiányzó userId"}, ensure_ascii=False).encode('utf-8'))
                return

            all_user_catalogs = load_user_catalogs()
            all_user_catalogs[user_id] = items
            save_user_catalogs(all_user_catalogs)

            print(f"[USER CATALOG] Sikeresen elmentve {len(items)} privát bútor a felhasználónak: {user_id}")

            response = {
                "success": True,
                "message": "Bútor sikeresen elmentve a saját fiókodba!",
                "itemCount": len(items)
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            print(f"Hiba a felhasználói katalógus mentésekor: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False).encode('utf-8'))

    def handle_get_git_status(self):
        """Visszaadja a legutóbbi Git szinkronizáció állapotát"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(last_git_status, ensure_ascii=False).encode('utf-8'))

    def handle_auth_register(self):
        """Új felhasználó regisztrálása és e-mail visszaigazoló token létrehozása"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            email = (data.get('email') or '').strip().lower()
            password = (data.get('password') or '').strip()
            name = (data.get('name') or '').strip()
            admin_code = (data.get('adminCode') or '').strip()

            if not email or not password:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "E-mail és jelszó megadása kötelező!"}, ensure_ascii=False).encode('utf-8'))
                return

            if len(password) < 6:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "A jelszónak legalább 6 karakter hosszúnak kell lennie!"}, ensure_ascii=False).encode('utf-8'))
                return

            users_db = load_users()
            users = users_db.get("users", [])

            for u in users:
                if u.get('email') == email:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "Ezzel az e-mail címmel már regisztráltak fiókot!"}, ensure_ascii=False).encode('utf-8'))
                    return

            role = "user"
            if admin_code == "admin123" or email.startswith("admin@"):
                role = "admin"

            verification_token = str(uuid.uuid4())
            new_user = {
                "id": "user_" + str(int(datetime.now().timestamp() * 1000)),
                "email": email,
                "name": name if name else email.split('@')[0],
                "passwordHash": hash_password(password),
                "role": role,
                "emailVerified": False,
                "verificationToken": verification_token,
                "createdAt": datetime.now().isoformat()
            }

            users.append(new_user)
            users_db["users"] = users
            save_users(users_db)

            verify_url = f"/api/auth/verify?token={verification_token}"
            print(f"\n[AUTH REGISZTRÁCIÓ] Új felhasználó: {email} (Szerep: {role})")
            print(f"[AUTH E-MAIL VERIFIKÁCIÓS LINK]: {verify_url}\n")

            response = {
                "success": True,
                "message": "Sikeres regisztráció! Kérjük, aktiváld a fiókodat a megadott e-mail címre küldött linkkel.",
                "verificationToken": verification_token,
                "verificationUrl": verify_url,
                "user": {
                    "id": new_user["id"],
                    "email": new_user["email"],
                    "name": new_user["name"],
                    "role": new_user["role"],
                    "emailVerified": False
                }
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            print(f"Hiba a regisztráció során: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False).encode('utf-8'))

    def handle_auth_login(self):
        """Felhasználó bejelentkeztetése, e-mail visszaigazolás és jelszó ellenőrzése"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            email = (data.get('email') or '').strip().lower()
            password = (data.get('password') or '').strip()

            if not email or not password:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "E-mail cím és jelszó megadása kötelező!"}, ensure_ascii=False).encode('utf-8'))
                return

            users_db = load_users()
            users = users_db.get("users", [])

            user = None
            for u in users:
                if u.get('email') == email:
                    user = u
                    break

            if not user or user.get('passwordHash') != hash_password(password):
                self.send_response(401)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Hibás e-mail cím vagy jelszó!"}, ensure_ascii=False).encode('utf-8'))
                return

            if not user.get('emailVerified', False):
                self.send_response(403)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                resp = {
                    "success": False,
                    "unverified": True,
                    "error": "A fiókod még nincs megerősítve! Kérjük, kattints az e-mailben kapott visszaigazoló linkre.",
                    "email": user.get('email'),
                    "verificationToken": user.get('verificationToken'),
                    "verificationUrl": f"/api/auth/verify?token={user.get('verificationToken')}"
                }
                self.wfile.write(json.dumps(resp, ensure_ascii=False).encode('utf-8'))
                return

            session_token = str(uuid.uuid4())
            response = {
                "success": True,
                "message": "Sikeres bejelentkezés!",
                "token": session_token,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "role": user.get("role", "user"),
                    "isAdmin": user.get("role") == "admin",
                    "emailVerified": True
                }
            }
            print(f"[AUTH BELÉPÉS] Sikeres belépés: {user['email']} (Admin: {user.get('role') == 'admin'})")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            print(f"Hiba a bejelentkezés során: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False).encode('utf-8'))

    def handle_auth_resend_verification(self):
        """Visszaigazoló link újragenerálása és elküldése"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            email = (data.get('email') or '').strip().lower()
            users_db = load_users()
            users = users_db.get("users", [])

            user = None
            for u in users:
                if u.get('email') == email:
                    user = u
                    break

            if not user:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Nem található felhasználó ezzel az e-mail címmel!"}, ensure_ascii=False).encode('utf-8'))
                return

            if user.get('emailVerified', False):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Ez a fiók már meg van erősítve. Jelentkezz be bátran!"}, ensure_ascii=False).encode('utf-8'))
                return

            new_token = str(uuid.uuid4())
            user['verificationToken'] = new_token
            save_users(users_db)

            verify_url = f"/api/auth/verify?token={new_token}"
            print(f"[AUTH ÚJRAKÜLDÉS] Megerősítő link: {verify_url}")

            response = {
                "success": True,
                "message": "A visszaigazoló linket újra elküldtük az e-mail címedre!",
                "verificationUrl": verify_url
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False).encode('utf-8'))

    def handle_verify_email(self, query):
        """Aktiváló linkre kattintás kezelése, fiók státuszának aktívvá tétele"""
        token = query.get('token', [''])[0]
        users_db = load_users()
        users = users_db.get("users", [])

        found = False
        user_name = ""
        for u in users:
            if u.get('verificationToken') == token and token != '':
                u['emailVerified'] = True
                u['verificationToken'] = None
                user_name = u.get('name', 'Felhasználó')
                found = True
                break

        if found:
            save_users(users_db)
            html = f"""<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-mail Megerősítve - 3D Bútortervező</title>
    <style>
        body {{
            background: #0b1120;
            color: #f8fafc;
            font-family: 'Segoe UI', system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }}
        .card {{
            background: #1e293b;
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 16px;
            padding: 40px;
            max-width: 460px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }}
        .icon {{
            font-size: 56px;
            margin-bottom: 20px;
        }}
        h1 {{
            color: #10b981;
            font-size: 24px;
            margin-bottom: 12px;
        }}
        p {{
            color: #94a3b8;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 28px;
        }}
        .btn {{
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #0284c7);
            color: #ffffff;
            font-weight: 700;
            font-size: 15px;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
            transition: all 0.2s;
        }}
        .btn:hover {{
            background: linear-gradient(135deg, #2563eb, #0369a1);
            transform: translateY(-2px);
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🎉</div>
        <h1>Sikeres e-mail visszaigazolás!</h1>
        <p>Kedves <strong>{user_name}</strong>! Az e-mail címedet sikeresen ellenőriztük és aktiváltuk a fiókodat. Most már teljes hozzáféréssel beléphetsz az alkalmazásba!</p>
        <a href="/" class="btn">🚀 Tovább a 3D Bútortervezőbe</a>
    </div>
</body>
</html>"""
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
        else:
            html_err = """<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <title>Hiba - 3D Bútortervező</title>
    <style>
        body { background:#0b1120; color:#fff; font-family:'Segoe UI',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
        .card { background:#1e293b; border:1px solid #ef4444; border-radius:16px; padding:40px; max-width:440px; text-align:center; }
        h1 { color:#ef4444; font-size:22px; }
        p { color:#94a3b8; }
        a { color:#3b82f6; text-decoration:none; font-weight:600; }
    </style>
</head>
<body>
    <div class="card">
        <div style="font-size:48px; margin-bottom:12px;">⚠️</div>
        <h1>Érvénytelen vagy lejárt megerősítő link</h1>
        <p>Ez az aktiváló link már nem érvényes, vagy a fiókot már korábban megerősítetted.</p>
        <a href="/">← Vissza a kezdőlapra</a>
    </div>
</body>
</html>"""
            self.send_response(400)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html_err.encode('utf-8'))


def find_available_server(preferred_port=None):
    socketserver.TCPServer.allow_reuse_address = True
    ports_to_try = [preferred_port] if preferred_port else []
    ports_to_try.extend([p for p in DEFAULT_PORTS if p != preferred_port])
    for port in ports_to_try:
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
    preferred_port = None
    if len(sys.argv) > 1:
        try:
            preferred_port = int(sys.argv[1])
        except ValueError:
            pass
    httpd, port = find_available_server(preferred_port)
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
