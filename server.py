#!/usr/bin/env python3

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

PROJECT_DIR = Path(__file__).resolve().parent
DATA_FILE = PROJECT_DIR / "data.json"

DEFAULT_PORT = 8888


def load_data():
    if not DATA_FILE.exists():
        return []

    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_data(data):
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=4,
        )
        file.write("\n")


class CineMemoHandler(BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        response = json.dumps(
            data,
            ensure_ascii=False,
        ).encode("utf-8")

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8",
        )

        self.send_header(
            "Content-Length",
            str(len(response)),
        )

        self.end_headers()

        self.wfile.write(response)

    def send_error_json(self, message, status=400):
        self.send_json(
            {
                "error": message,
            },
            status,
        )

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))

        if content_length == 0:
            return None

        body = self.rfile.read(content_length)

        return json.loads(body.decode("utf-8"))

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/api/content":
            self.handle_get_content()
            return

        self.serve_static_file(path)

    def do_POST(self):
        path = urlparse(self.path).path

        if path == "/api/content":
            self.handle_create_content()
            return

        self.send_error_json(
            "Endpoint not found.",
            404,
        )

    def do_PUT(self):
        path = urlparse(self.path).path

        if path.startswith("/api/content/"):
            self.handle_update_content(path)
            return

        self.send_error_json(
            "Endpoint not found.",
            404,
        )

    def do_DELETE(self):
        path = urlparse(self.path).path

        if path.startswith("/api/content/"):
            self.handle_delete_content(path)
            return

        self.send_error_json(
            "Endpoint not found.",
            404,
        )

    def handle_get_content(self):
        try:
            data = load_data()

            self.send_json(data)

        except (json.JSONDecodeError, OSError) as error:
            self.send_error_json(
                f"Could not read data.json: {error}",
                500,
            )

    def handle_create_content(self):
        try:
            content = self.read_json_body()

            if not isinstance(content, dict):
                self.send_error_json("Request body must be a JSON object.")
                return

            data = load_data()

            existing_ids = [
                item.get("id")
                for item in data
                if isinstance(item, dict) and isinstance(item.get("id"), int)
            ]

            new_id = max(existing_ids, default=0) + 1

            content["id"] = new_id

            data.append(content)

            save_data(data)

            self.send_json(
                content,
                201,
            )

        except json.JSONDecodeError:
            self.send_error_json("Invalid JSON.")

        except OSError as error:
            self.send_error_json(
                f"Could not save data.json: {error}",
                500,
            )

    def handle_update_content(self, path):
        try:
            content_id = int(path.rsplit("/", 1)[1])

        except ValueError:
            self.send_error_json(
                "Invalid content ID.",
                400,
            )
            return

        try:
            updated_content = self.read_json_body()

            if not isinstance(updated_content, dict):
                self.send_error_json("Request body must be a JSON object.")
                return

            data = load_data()

            for index, item in enumerate(data):
                if item.get("id") == content_id:
                    updated_content["id"] = content_id

                    data[index] = updated_content

                    save_data(data)

                    self.send_json(updated_content)

                    return

            self.send_error_json(
                "Content not found.",
                404,
            )

        except json.JSONDecodeError:
            self.send_error_json("Invalid JSON.")

        except OSError as error:
            self.send_error_json(
                f"Could not save data.json: {error}",
                500,
            )

    def handle_delete_content(self, path):
        try:
            content_id = int(path.rsplit("/", 1)[1])

        except ValueError:
            self.send_error_json(
                "Invalid content ID.",
                400,
            )
            return

        try:
            data = load_data()

            original_length = len(data)

            data = [item for item in data if item.get("id") != content_id]

            if len(data) == original_length:
                self.send_error_json(
                    "Content not found.",
                    404,
                )
                return

            save_data(data)

            self.send_json(
                {
                    "message": "Content deleted successfully.",
                }
            )

        except OSError as error:
            self.send_error_json(
                f"Could not save data.json: {error}",
                500,
            )

    def serve_static_file(self, path):
        if path == "/":
            path = "/index.html"

        requested_file = (PROJECT_DIR / path.lstrip("/")).resolve()

        try:
            requested_file.relative_to(PROJECT_DIR)

        except ValueError:
            self.send_error(
                403,
                "Forbidden",
            )
            return

        if requested_file.is_dir():
            if not path.endswith("/"):
                self.send_response(301)
                self.send_header(
                    "Location",
                    f"{path}/",
                )
                self.end_headers()
                return

            requested_file = requested_file / "index.html"

        if not requested_file.is_file():
            self.send_error(
                404,
                "File not found",
            )
            return

        try:
            content = requested_file.read_bytes()

        except OSError:
            self.send_error(
                500,
                "Could not read file",
            )
            return

        content_type = self.get_content_type(requested_file)

        self.send_response(200)

        self.send_header(
            "Content-Type",
            content_type,
        )

        self.send_header(
            "Content-Length",
            str(len(content)),
        )

        self.end_headers()

        self.wfile.write(content)

    @staticmethod
    def get_content_type(file):
        suffix = file.suffix.lower()

        content_types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        }

        return content_types.get(
            suffix,
            "application/octet-stream",
        )

    def log_message(self, format, *args):
        print(f"[CineMemo] {self.address_string()} - {format % args}")


def main():
    port = DEFAULT_PORT

    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])

        except ValueError:
            print("❌ Invalid port.")
            sys.exit(1)

    server = ThreadingHTTPServer(
        ("127.0.0.1", port),
        CineMemoHandler,
    )

    print("🎬 CineMemo Lite")
    print()
    print(f"   http://127.0.0.1:{port}/")
    print()
    print("API:")
    print(f"   GET    http://127.0.0.1:{port}/api/content")
    print(f"   POST   http://127.0.0.1:{port}/api/content")
    print(f"   PUT    http://127.0.0.1:{port}/api/content/{{id}}")
    print(f"   DELETE http://127.0.0.1:{port}/api/content/{{id}}")
    print()
    print("Press Ctrl+C to stop the server.")
    print()

    try:
        server.serve_forever()

    except KeyboardInterrupt:
        print()
        print("🛑 CineMemo Lite stopped.")

    finally:
        server.server_close()


if __name__ == "__main__":
    main()
