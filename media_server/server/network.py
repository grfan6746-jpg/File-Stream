import socket
import subprocess
import re

def get_primary_ip():
    """
    Finds the primary local LAN IP address of the Android TV device.
    Uses UDP socket probe towards a private broadcast/gateway which does not send actual packets
    but asks the OS routing table for the outbound interface IP.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Does not actually connect or send data, but forces OS to select the local route
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        try:
            # Fallback 2: public DNS probe
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_all_local_ips():
    """
    Returns a list of all detected IPv4 addresses (excluding loopback 127.0.0.1).
    """
    ips = set()
    primary = get_primary_ip()
    if primary and primary != '127.0.0.1':
        ips.add(primary)

    # Attempt to query via hostname resolution
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            addr = info[4][0]
            if ':' not in addr and not addr.startswith('127.'):
                ips.add(addr)
    except Exception:
        pass

    # In Termux / Android, also try reading 'ip route' or 'ifconfig'
    try:
        output = subprocess.check_output(['ip', '-4', 'addr', 'show'], stderr=subprocess.DEVNULL, timeout=2).decode('utf-8', errors='ignore')
        matches = re.findall(r'inet\s+(\d+\.\d+\.\d+\.\d+)', output)
        for m in matches:
            if not m.startswith('127.'):
                ips.add(m)
    except Exception:
        pass

    result = list(ips)
    if not result:
        result = [primary]
    return sorted(result)
