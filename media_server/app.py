#!/usr/bin/env python3
"""
Local Media Server for Android TV via Termux
Streams local & USB media directly to mobile devices (VLC Player) with HTTP Range support.
"""

import sys
import os

# Add media_server directory to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import create_app
from server.network import get_primary_ip, get_all_local_ips

def main():
    app = create_app()
    cfg = app.config.get('MEDIA_CONFIG', {})
    port = int(os.environ.get('PORT', cfg.get('port', 8080)))
    host = os.environ.get('HOST', cfg.get('host', '0.0.0.0'))
    
    primary_ip = get_primary_ip()
    all_ips = get_all_local_ips()

    banner = f"""
============================================================
   📺 Android TV Local Media Server (Termux Edition)
============================================================
  ● Status:      ONLINE
  ● Local IP:    {primary_ip}
  ● Port:        {port}
  ● Web UI:      http://{primary_ip}:{port}/
  ● All IPs:     {', '.join(all_ips)}
  ● VLC Direct:  Streams on http://{primary_ip}:{port}/media/<storage>/<path>
  ● Auth:        {'Enabled' if cfg.get('authentication') else 'Disabled (Open LAN)'}
============================================================
  Press CTRL+C to stop the server.
"""
    print(banner)
    app.media_logger.info(f"Server starting on {host}:{port} (TV IP: {primary_ip})")

    try:
        app.run(host=host, port=port, threaded=True)
    except KeyboardInterrupt:
        print("\n[!] Server stopped by user.")
        app.media_logger.info("Server stopped by user interrupt")
    except Exception as e:
        print(f"\n[ERROR] Server failed to start: {e}")
        app.media_logger.critical(f"Server fatal error: {e}")

if __name__ == '__main__':
    main()
