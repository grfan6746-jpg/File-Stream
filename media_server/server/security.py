import os
from functools import wraps
from flask import session, request, redirect, url_for, jsonify, current_app

def is_safe_path(base_dir, path, follow_symlinks=True):
    """
    Guarantees that the target path is strictly located inside base_dir.
    Prevents directory traversal attacks ('../', encoded slashes, symlink escapes).
    """
    if follow_symlinks:
        match_base = os.path.realpath(base_dir)
        match_path = os.path.realpath(path)
    else:
        match_base = os.path.abspath(base_dir)
        match_path = os.path.abspath(path)

    # Use os.path.commonpath to ensure strict prefix containment
    try:
        common = os.path.commonpath([match_base, match_path])
        return common == match_base
    except (ValueError, Exception):
        return False

def check_auth(username, password):
    """Verifies username and password against server configuration."""
    cfg = current_app.config.get('MEDIA_CONFIG', {})
    if not cfg.get('authentication', False):
        return True
    return username == cfg.get('username') and password == cfg.get('password')

def is_authenticated():
    """Checks if current request is authenticated via session or basic auth."""
    cfg = current_app.config.get('MEDIA_CONFIG', {})
    if not cfg.get('authentication', False):
        return True
    
    # 1. Check Flask session
    if session.get('authenticated'):
        return True

    # 2. Check HTTP Basic Auth header (useful for VLC or mobile clients)
    auth = request.authorization
    if auth and check_auth(auth.username, auth.password):
        return True

    return False

def login_required(f):
    """Decorator to require login on web pages or API endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401
            return redirect(url_for('main.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function
