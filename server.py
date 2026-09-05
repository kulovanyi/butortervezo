#!/usr/bin/env python3
"""
3D Bútortervező Web Szerver (server.py)
Automatikus szabad port kereséssel (8080 -> 8081 -> ...) és böngésző indítással.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

DEFAULT_PORTS = [8080, 8081, 8082, 8083, 8084, 8085, 3000, 8000]
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Cache letiltása a fejlesztéshez és Access-Control
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

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
    httpd, port = find_available_server()
    url = f"http://localhost:{port}"

    print("=" * 60)
    print(f"  3D Bútortervező és Katalógus Stúdió elindult!")
    print(f"  Elérési cím: {url}")
    print(f"  Munkakönyvtár: {DIRECTORY}")
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
