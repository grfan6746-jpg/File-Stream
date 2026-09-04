import os
import re
import urllib.parse
import mimetypes
from flask import Response, request, abort

# Register essential media mimetypes that might be missing on minimal Python installs
mimetypes.add_type('video/x-matroska', '.mkv')
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')
mimetypes.add_type('video/quicktime', '.mov')
mimetypes.add_type('video/x-msvideo', '.avi')
mimetypes.add_type('video/mp2t', '.ts')
mimetypes.add_type('audio/flac', '.flac')
mimetypes.add_type('audio/mpeg', '.mp3')
mimetypes.add_type('audio/ogg', '.ogg')
mimetypes.add_type('audio/opus', '.opus')
mimetypes.add_type('audio/wav', '.wav')
mimetypes.add_type('audio/aac', '.aac')
mimetypes.add_type('audio/mp4', '.m4a')

def get_safe_content_disposition(file_path, disposition='inline'):
    """
    Generates an RFC 5987 / RFC 6266 compliant Content-Disposition header.
    Guarantees 100% ASCII/Latin-1 compatibility for Python's http.server/WSGI
    to prevent UnicodeEncodeError when streaming files with Persian/Arabic/Unicode names,
    while allowing modern browsers and VLC to receive the original UTF-8 filename.
    """
    try:
        raw_name = os.path.basename(file_path)
        ext = os.path.splitext(raw_name)[1]
        # ASCII fallback: replace non-ASCII and quotes/control chars with '_'
        clean_ascii = re.sub(r'[^\x20-\x7E]|["\';\\]', '_', raw_name).strip()
        if not clean_ascii or clean_ascii == ext:
            clean_ascii = f"media{ext}"
        # Percent-encode original UTF-8 filename (strictly ASCII chars only: %XX, A-Z, 0-9)
        utf8_encoded = urllib.parse.quote(raw_name, safe='')
        return f'{disposition}; filename="{clean_ascii}"; filename*=UTF-8\'\'{utf8_encoded}'
    except Exception:
        return f'{disposition}; filename="media.mp4"'

def stream_file_with_range(file_path, chunk_size=1024 * 1024):
    """
    Streams a media file with full support for HTTP Range requests (RFC 7233).
    Supports seeking, resuming, fast-forwarding in VLC and media players.
    Uses chunked generator to prevent loading large files (10GB-50GB) into RAM.
    """
    if not os.path.isfile(file_path):
        abort(404)

    file_size = os.path.getsize(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = 'application/octet-stream'

    disposition_header = get_safe_content_disposition(file_path, disposition='inline')
    range_header = request.headers.get('Range', None)

    # If client did not request Range, serve standard full stream with Accept-Ranges
    if not range_header:
        def full_generator():
            with open(file_path, 'rb') as f:
                while True:
                    data = f.read(chunk_size)
                    if not data:
                        break
                    yield data

        headers = {
            'Content-Type': mime_type,
            'Content-Length': str(file_size),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
            'Content-Disposition': disposition_header
        }
        return Response(full_generator(), status=200, headers=headers)

    # Parse Range Header: e.g. "bytes=0-1048575" or "bytes=5000000-"
    range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
    if not range_match:
        # Invalid range syntax
        return Response(status=416, headers={
            'Content-Range': f'bytes */{file_size}',
            'Accept-Ranges': 'bytes'
        })

    start = int(range_match.group(1))
    end_val = range_match.group(2)
    end = int(end_val) if end_val else file_size - 1

    # Validate range limits
    if start >= file_size or end >= file_size or start > end:
        return Response(status=416, headers={
            'Content-Range': f'bytes */{file_size}',
            'Accept-Ranges': 'bytes'
        })

    length = end - start + 1

    def partial_generator():
        with open(file_path, 'rb') as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                read_amount = min(chunk_size, remaining)
                data = f.read(read_amount)
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        'Content-Type': mime_type,
        'Content-Range': f'bytes {start}-{end}/{file_size}',
        'Content-Length': str(length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'Content-Disposition': disposition_header
    }

    return Response(partial_generator(), status=206, headers=headers)
