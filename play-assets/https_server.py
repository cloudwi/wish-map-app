"""HTTPS static file server for Play Console image uploads (CORS-enabled)."""
import http.server
import ssl
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 17338
srv = http.server.HTTPServer(("127.0.0.1", port), Handler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(certfile=os.path.join(HERE, ".cert.pem"), keyfile=os.path.join(HERE, ".key.pem"))
srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
print(f"HTTPS ready on https://127.0.0.1:{port}")
srv.serve_forever()
