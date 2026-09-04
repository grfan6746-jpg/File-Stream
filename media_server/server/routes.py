import os
import json
import urllib.parse
from flask import (
    Blueprint, render_template, request, jsonify, redirect, 
    url_for, session, current_app, abort
)
from .security import is_safe_path, login_required, check_auth
from .streaming import stream_file_with_range
from .storage import (
    resolve_storage_path, get_storage_stats, list_directory_contents,
    detect_potential_usb_storages, search_files
)
from .network import get_primary_ip, get_all_local_ips

main_bp = Blueprint('main', __name__)

def get_config():
    return current_app.config.get('MEDIA_CONFIG', {})

def save_config(cfg):
    current_app.config['MEDIA_CONFIG'] = cfg
    config_path = current_app.config.get('CONFIG_PATH')
    if config_path:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)

def find_storage(storage_name):
    cfg = get_config()
    for s in cfg.get('storages', []):
        if s['name'] == storage_name:
            return s
    return None

# ============================
# Web Views
# ============================

@main_bp.route('/')
@login_required
def index():
    cfg = get_config()
    tv_ip = get_primary_ip()
    all_ips = get_all_local_ips()
    port = cfg.get('port', 8080)
    server_name = cfg.get('server_name', 'Android TV Media Server')
    
    storages_data = []
    for s in cfg.get('storages', []):
        resolved = resolve_storage_path(s['path'])
        stats = get_storage_stats(resolved)
        storages_data.append({
            'name': s['name'],
            'path': s['path'],
            'resolved_path': resolved,
            'stats': stats
        })

    return render_template(
        'index.html',
        server_name=server_name,
        tv_ip=tv_ip,
        all_ips=all_ips,
        port=port,
        storages=storages_data,
        theme=cfg.get('theme', 'dark')
    )

@main_bp.route('/browser/<storage_name>')
@login_required
def browser(storage_name):
    cfg = get_config()
    storage = find_storage(storage_name)
    if not storage:
        abort(404, description=f"Storage '{storage_name}' not found.")

    subpath = request.args.get('path', '').strip()
    show_hidden = cfg.get('show_hidden_files', False)
    
    resolved_base = resolve_storage_path(storage['path'])
    if not os.path.exists(resolved_base):
        return render_template(
            'browser.html',
            storage=storage,
            error="Storage device is disconnected or path does not exist.",
            current_path=subpath,
            breadcrumbs=[],
            directories=[],
            files=[],
            server_ip=get_primary_ip(),
            port=cfg.get('port', 8080)
        )

    # Validate security
    target_abs = os.path.normpath(os.path.join(resolved_base, subpath.lstrip('/\\')))
    if not is_safe_path(resolved_base, target_abs):
        current_app.media_logger.warning(f"Path traversal attempt blocked: {subpath} in {storage_name}")
        abort(403, description="Access Denied: Path outside storage boundary.")

    try:
        contents = list_directory_contents(resolved_base, subpath, show_hidden=show_hidden)
    except Exception as e:
        return render_template(
            'browser.html',
            storage=storage,
            error=str(e),
            current_path=subpath,
            breadcrumbs=[],
            directories=[],
            files=[],
            server_ip=get_primary_ip(),
            port=cfg.get('port', 8080)
        )

    return render_template(
        'browser.html',
        storage=storage,
        error=None,
        current_path=contents['current_rel_path'],
        breadcrumbs=contents['breadcrumbs'],
        directories=contents['directories'],
        files=contents['files'],
        server_ip=get_primary_ip(),
        port=cfg.get('port', 8080),
        theme=cfg.get('theme', 'dark')
    )

@main_bp.route('/play/<storage_name>/<path:file_path>')
@login_required
def player(storage_name, file_path):
    """In-browser HTML5 Video / Audio Player with zero transcoding."""
    cfg = get_config()
    storage = find_storage(storage_name)
    if not storage:
        abort(404, description=f"Storage '{storage_name}' not found.")

    resolved_base = resolve_storage_path(storage['path'])
    unquoted_path = urllib.parse.unquote(file_path)
    target_abs = os.path.normpath(os.path.join(resolved_base, unquoted_path.lstrip('/\\')))

    if not is_safe_path(resolved_base, target_abs):
        current_app.media_logger.error(f"Security violation on player: {unquoted_path}")
        abort(403, description="Access Denied")

    if not os.path.exists(target_abs) or not os.path.isfile(target_abs):
        abort(404, description="File does not exist or storage disconnected.")

    try:
        file_name = os.path.basename(target_abs)
        file_size = os.path.getsize(target_abs)
        from .storage import format_size, get_media_type, get_file_type
        size_str = format_size(file_size)
        ext = os.path.splitext(file_name)[1].lower().lstrip('.')
        file_type = get_media_type(file_name)

        stream_url = url_for('main.stream_media', storage_name=storage_name, file_path=file_path, _external=True)
        back_folder = os.path.dirname(unquoted_path).replace('\\', '/')

        return render_template(
            'player.html',
            storage=storage,
            file_name=file_name,
            file_path=unquoted_path,
            file_size=file_size,
            size_str=size_str,
            file_type=file_type,
            extension=ext,
            stream_url=stream_url,
            back_folder=back_folder,
            server_ip=get_primary_ip(),
            port=cfg.get('port', 8080),
            server_name=cfg.get('server_name', 'Android TV Media Server'),
            theme=cfg.get('theme', 'dark')
        )
    except Exception as e:
        current_app.media_logger.error(f"Error rendering player for {unquoted_path}: {e}", exc_info=True)
        abort(500, description=f"Player error: {str(e)}")

@main_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    cfg = get_config()
    msg = None
    msg_type = 'success'

    if request.method == 'POST':
        server_name = request.form.get('server_name', '').strip()
        port = int(request.form.get('port', cfg.get('port', 8080)))
        auth_enabled = bool(request.form.get('authentication'))
        username = request.form.get('username', '').strip()
        new_password = request.form.get('password', '').strip()
        show_hidden = bool(request.form.get('show_hidden_files'))
        theme = request.form.get('theme', 'dark')

        if server_name:
            cfg['server_name'] = server_name
        cfg['port'] = port
        cfg['authentication'] = auth_enabled
        if username:
            cfg['username'] = username
        if new_password:
            cfg['password'] = new_password
        cfg['show_hidden_files'] = show_hidden
        cfg['theme'] = theme

        save_config(cfg)
        current_app.media_logger.info(f"Server settings updated by user (auth={auth_enabled})")
        msg = "Settings updated successfully! If you changed the port, please restart the server."

    detected_usbs = detect_potential_usb_storages()

    return render_template(
        'settings.html',
        config=cfg,
        detected_usbs=detected_usbs,
        message=msg,
        message_type=msg_type,
        server_ip=get_primary_ip()
    )

@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    cfg = get_config()
    if not cfg.get('authentication', False):
        return redirect(url_for('main.index'))

    error = None
    if request.method == 'POST':
        user = request.form.get('username', '').strip()
        pwd = request.form.get('password', '').strip()

        if check_auth(user, pwd):
            session['authenticated'] = True
            session['username'] = user
            current_app.media_logger.info(f"User '{user}' logged in from {request.remote_addr}")
            next_url = request.args.get('next') or url_for('main.index')
            return redirect(next_url)
        else:
            current_app.media_logger.warning(f"Failed login attempt for '{user}' from {request.remote_addr}")
            error = "Invalid username or password"

    return render_template('login.html', error=error, server_name=cfg.get('server_name', 'Android TV Media Server'))

@main_bp.route('/logout')
def logout():
    session.pop('authenticated', None)
    session.pop('username', None)
    return redirect(url_for('main.login'))

# ============================
# Streaming Endpoint (VLC / Mobile)
# ============================

@main_bp.route('/media/<storage_name>/<path:file_path>')
def stream_media(storage_name, file_path):
    storage = find_storage(storage_name)
    if not storage:
        current_app.media_logger.warning(f"Stream request for unknown storage: {storage_name}")
        abort(404, description="Storage not found")

    resolved_base = resolve_storage_path(storage['path'])
    unquoted_path = urllib.parse.unquote(file_path)
    target_abs = os.path.normpath(os.path.join(resolved_base, unquoted_path.lstrip('/\\')))

    # Security check: Ensure strictly inside storage base
    if not is_safe_path(resolved_base, target_abs):
        current_app.media_logger.error(f"Path traversal blocked on stream: {unquoted_path}")
        abort(403, description="Access Denied")

    if not os.path.exists(target_abs):
        current_app.media_logger.warning(f"File not found: {target_abs}")
        abort(404, description="File does not exist or storage disconnected")

    current_app.media_logger.info(f"Streaming: '{unquoted_path}' to {request.remote_addr} (Range: {request.headers.get('Range', 'Full')})")
    chunk_size = get_config().get('chunk_size_kb', 1024) * 1024
    return stream_file_with_range(target_abs, chunk_size=chunk_size)

# ============================
# JSON REST APIs
# ============================

@main_bp.route('/api/info')
def api_info():
    cfg = get_config()
    primary_ip = get_primary_ip()
    all_ips = get_all_local_ips()
    return jsonify({
        'server_name': cfg.get('server_name', 'Android TV Media Server'),
        'primary_ip': primary_ip,
        'all_ips': all_ips,
        'port': cfg.get('port', 8080),
        'status': 'online',
        'auth_required': cfg.get('authentication', False),
        'theme': cfg.get('theme', 'dark')
    })

@main_bp.route('/api/storages')
@login_required
def api_storages():
    cfg = get_config()
    results = []
    for s in cfg.get('storages', []):
        resolved = resolve_storage_path(s['path'])
        stats = get_storage_stats(resolved)
        results.append({
            'name': s['name'],
            'path': s['path'],
            'resolved_path': resolved,
            'accessible': stats['accessible'],
            'total_str': stats.get('total_str', 'N/A'),
            'free_str': stats.get('free_str', 'N/A'),
            'used_str': stats.get('used_str', 'N/A'),
            'percent_used': stats.get('percent_used', 0),
            'error': stats.get('error')
        })
    return jsonify(results)

@main_bp.route('/api/storages/refresh', methods=['POST'])
@login_required
def api_refresh_storages():
    """Detects any newly attached USB drives or Termux storage links."""
    cfg = get_config()
    candidates = detect_potential_usb_storages()
    existing_paths = {s['path'] for s in cfg.get('storages', [])}

    added = []
    for c in candidates:
        if c['path'] not in existing_paths:
            cfg['storages'].append(c)
            existing_paths.add(c['path'])
            added.append(c)

    if added:
        save_config(cfg)
        current_app.media_logger.info(f"Auto-detected and registered new USB storages: {[x['name'] for x in added]}")

    return jsonify({
        'status': 'ok',
        'detected': candidates,
        'newly_added': added,
        'total_storages': len(cfg.get('storages', []))
    })

@main_bp.route('/api/files')
@login_required
def api_files():
    storage_name = request.args.get('storage')
    rel_path = request.args.get('path', '')

    if not storage_name:
        return jsonify({'error': 'storage parameter is required'}), 400

    storage = find_storage(storage_name)
    if not storage:
        return jsonify({'error': f"Storage '{storage_name}' not found"}), 404

    resolved_base = resolve_storage_path(storage['path'])
    target_abs = os.path.normpath(os.path.join(resolved_base, rel_path.lstrip('/\\')))

    if not is_safe_path(resolved_base, target_abs):
        return jsonify({'error': 'Path traversal blocked'}), 403

    try:
        cfg = get_config()
        contents = list_directory_contents(resolved_base, rel_path, show_hidden=cfg.get('show_hidden_files', False))
        return jsonify(contents)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main_bp.route('/api/search')
@login_required
def api_search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    cfg = get_config()
    results = search_files(cfg.get('storages', []), query)
    return jsonify(results)

@main_bp.route('/api/storage/add', methods=['POST'])
@login_required
def api_add_storage():
    data = request.get_json(silent=True) or request.form
    name = data.get('name', '').strip()
    path = data.get('path', '').strip()

    if not name or not path:
        return jsonify({'error': 'Name and path are required'}), 400

    cfg = get_config()
    # Check if name already exists
    for s in cfg.get('storages', []):
        if s['name'] == name:
            return jsonify({'error': 'Storage with this name already exists'}), 400

    new_storage = {'name': name, 'path': path}
    cfg['storages'].append(new_storage)
    save_config(cfg)
    current_app.media_logger.info(f"New storage '{name}' added at path '{path}'")

    return jsonify({'status': 'ok', 'storage': new_storage})

@main_bp.route('/api/storage/remove', methods=['POST'])
@login_required
def api_remove_storage():
    data = request.get_json(silent=True) or request.form
    name = data.get('name', '').strip()

    cfg = get_config()
    storages = cfg.get('storages', [])
    initial_len = len(storages)
    cfg['storages'] = [s for s in storages if s['name'] != name]

    if len(cfg['storages']) < initial_len:
        save_config(cfg)
        current_app.media_logger.info(f"Storage '{name}' removed")
        return jsonify({'status': 'ok'})
    return jsonify({'error': 'Storage not found'}), 404
