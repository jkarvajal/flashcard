#!/usr/bin/env python3
"""Servidor local para FlashCard.

Ejecuta la app en http://localhost:8000 con las cabeceras correctas para
que funcionen el Service Worker y la instalación como PWA.

Uso:
    python serve.py           # sirve en el puerto 8000
    python serve.py 5500      # sirve en el puerto indicado
"""
import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".js": "text/javascript",
        ".json": "application/json",
    }

    def end_headers(self):
        # Evita cache agresiva durante el desarrollo
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Servidor multi-hilo: evita que una conexión persistente bloquee al resto."""
    daemon_threads = True
    allow_reuse_address = True


with Server(("0.0.0.0", PORT), Handler) as httpd:
    print("FlashCard sirviendo en:")
    print("  PC:      http://localhost:%d" % PORT)
    print("  Red LAN: http://<IP-de-tu-PC>:%d   (para abrir desde el móvil en la misma wifi)" % PORT)
    print("Pulsa Ctrl+C para detener.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
