import os
import shutil
import glob
import re

VIDEO_EXTS = {'.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.ts', '.mpeg', '.mpg'}
AUDIO_EXTS = {'.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus'}
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

def get_media_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext in VIDEO_EXTS:
        return 'video'
    if ext in AUDIO_EXTS:
        return 'audio'
    if ext in IMAGE_EXTS:
        return 'image'
    return 'other'

def format_size(bytes_size):
    """Converts bytes into human-readable format."""
    if bytes_size is None or bytes_size < 0:
        return "Unknown"
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}" if unit != 'B' else f"{bytes_size} B"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} PB"

def resolve_storage_path(raw_path):
    """
    Expands '~' or environment variables to absolute path.
    For Android TV / Termux, handles '/data/data/com.termux/files/home' expansion.
    """
    if raw_path.startswith('~'):
        home = os.environ.get('HOME', '/data/data/com.termux/files/home')
        return os.path.normpath(raw_path.replace('~', home, 1))
    return os.path.normpath(os.path.expanduser(os.path.expandvars(raw_path)))

def get_storage_stats(resolved_path):
    """Returns total, used, free space and accessibility status for a storage path."""
    if not os.path.exists(resolved_path):
        return {
            'accessible': False,
            'total_str': 'N/A',
            'free_str': 'N/A',
            'used_str': 'N/A',
            'percent_used': 0,
            'error': 'Storage path not found or disconnected'
        }
    
    try:
        total, used, free = shutil.disk_usage(resolved_path)
        percent = int((used / total) * 100) if total > 0 else 0
        return {
            'accessible': True,
            'total': total,
            'used': used,
            'free': free,
            'total_str': format_size(total),
            'free_str': format_size(free),
            'used_str': format_size(used),
            'percent_used': percent,
            'error': None
        }
    except Exception as e:
        return {
            'accessible': True,
            'total_str': 'N/A',
            'free_str': 'N/A',
            'used_str': 'N/A',
            'percent_used': 0,
            'error': str(e)
        }

def detect_potential_usb_storages():
    """
    Scans typical Android / Termux paths where external USB flash drives / HDDs appear:
    1. Termux storage links in ~/storage/ (e.g. ~/storage/external-1, external-2)
    2. /storage/XXXX-XXXX (Android FAT32 / exFAT mount points)
    3. /mnt/media_rw/
    """
    candidates = []
    
    # Check Termux storage links created by termux-setup-storage
    home = os.environ.get('HOME', '/data/data/com.termux/files/home')
    termux_storage = os.path.join(home, 'storage')
    if os.path.exists(termux_storage):
        for entry in os.listdir(termux_storage):
            if entry.startswith('external-'):
                full_p = os.path.join(termux_storage, entry)
                if os.path.exists(full_p):
                    candidates.append({
                        'name': f"USB/SD ({entry})",
                        'path': f"~/storage/{entry}"
                    })

    # Check /storage/XXXX-XXXX (Standard Android external volumes)
    if os.path.exists('/storage'):
        try:
            for item in os.listdir('/storage'):
                # Android external drives usually have uppercase hex format e.g. 1A2B-3C4D
                if re.match(r'^[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}$', item):
                    p = f"/storage/{item}"
                    if os.path.exists(p) and os.access(p, os.R_OK):
                        candidates.append({
                            'name': f"USB Drive ({item})",
                            'path': p
                        })
        except Exception:
            pass

    return candidates

def list_directory_contents(base_storage_path, rel_subpath='', show_hidden=False):
    """
    Safely lists folders and media files inside a storage directory.
    Returns:
      - current_path: relative path
      - breadcrumbs: list of parts for navigation
      - directories: list of subfolder objects
      - files: list of media file objects
    """
    resolved_base = resolve_storage_path(base_storage_path)
    target_dir = os.path.normpath(os.path.join(resolved_base, rel_subpath.lstrip('/\\')))

    if not os.path.exists(target_dir):
        raise FileNotFoundError("Directory does not exist or storage is disconnected")
    if not os.path.isdir(target_dir):
        raise NotADirectoryError("Target path is not a directory")

    items = os.listdir(target_dir)
    directories = []
    files = []

    for item in items:
        if not show_hidden and item.startswith('.'):
            continue

        item_path = os.path.join(target_dir, item)
        item_rel = os.path.normpath(os.path.join(rel_subpath, item)).replace('\\', '/')
        if item_rel.startswith('/'):
            item_rel = item_rel[1:]

        try:
            is_dir = os.path.isdir(item_path)
            stat = os.stat(item_path)
            if is_dir:
                directories.append({
                    'name': item,
                    'path': item_rel,
                    'is_dir': True,
                    'modified': stat.st_mtime
                })
            else:
                m_type = get_media_type(item)
                files.append({
                    'name': item,
                    'path': item_rel,
                    'is_dir': False,
                    'size': stat.st_size,
                    'size_str': format_size(stat.st_size),
                    'extension': os.path.splitext(item)[1].lower().replace('.', ''),
                    'type': m_type,
                    'modified': stat.st_mtime
                })
        except (PermissionError, OSError):
            continue

    # Clean breadcrumb construction
    breadcrumbs = []
    accum = []
    if rel_subpath.strip('/'):
        for part in rel_subpath.strip('/').split('/'):
            accum.append(part)
            breadcrumbs.append({
                'name': part,
                'path': '/'.join(accum)
            })

    return {
        'current_rel_path': rel_subpath.strip('/'),
        'breadcrumbs': breadcrumbs,
        'directories': sorted(directories, key=lambda x: x['name'].lower()),
        'files': sorted(files, key=lambda x: x['name'].lower())
    }

def search_files(storages, query, max_results=100, max_depth=4):
    """
    Performs an on-demand, safe search across all registered and accessible storages.
    Depth-limited and result-capped to prevent CPU spikes on Android TV.
    """
    if not query or len(query.strip()) < 2:
        return []
    
    query = query.strip().lower()
    results = []

    for storage in storages:
        storage_name = storage['name']
        base_path = resolve_storage_path(storage['path'])

        if not os.path.exists(base_path) or not os.path.isdir(base_path):
            continue

        for root, dirs, filenames in os.walk(base_path):
            # Calculate current depth relative to storage base
            rel = os.path.relpath(root, base_path)
            depth = 0 if rel == '.' else len(rel.split(os.sep))
            if depth >= max_depth:
                dirs.clear()  # Don't descend further

            for fname in filenames:
                if query in fname.lower():
                    fpath = os.path.join(root, fname)
                    try:
                        st = os.stat(fpath)
                        rel_file_path = os.path.relpath(fpath, base_path).replace('\\', '/')
                        m_type = get_media_type(fname)
                        results.append({
                            'storage': storage_name,
                            'name': fname,
                            'path': rel_file_path,
                            'size': st.st_size,
                            'size_str': format_size(st.st_size),
                            'extension': os.path.splitext(fname)[1].lower().replace('.', ''),
                            'type': m_type
                        })
                        if len(results) >= max_results:
                            return results
                    except (PermissionError, OSError):
                        continue

    return results
