#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  FitBuddy — Hetzner VPS Initial Setup                          ║
# ║  Run once on a fresh Ubuntu 24.04 LTS server                   ║
# ║  Usage: ssh root@YOUR_IP < setup-server.sh                     ║
# ╚══════════════════════════════════════════════════════════════════╝

set -euo pipefail

echo "=== FitBuddy Server Setup ==="
echo "Target: Hetzner CX31, Ubuntu 24.04 LTS"
echo ""

# ── 1. System Update ────────────────────────────────────────────
echo "[1/8] System update..."
apt-get update && apt-get upgrade -y
apt-get install -y \
  curl wget git unzip htop \
  ufw fail2ban \
  ca-certificates gnupg lsb-release

# ── 2. Docker installieren ─────────────────────────────────────
echo "[2/8] Docker installieren..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
docker --version

# ── 3. Docker Compose (Plugin) pruefen ─────────────────────────
echo "[3/8] Docker Compose pruefen..."
docker compose version

# ── 4. Firewall konfigurieren ──────────────────────────────────
echo "[4/8] Firewall (UFW) konfigurieren..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp   # HTTP (Caddy redirect)
ufw allow 443/tcp  # HTTPS
ufw allow 443/udp  # HTTP/3 (QUIC)
ufw --force enable
ufw status

# ── 5. Fail2ban aktivieren ─────────────────────────────────────
echo "[5/8] Fail2ban aktivieren..."
systemctl enable fail2ban
systemctl start fail2ban

# ── 6. Deploy-User erstellen ──────────────────────────────────
echo "[6/8] Deploy-User 'fitbuddy' erstellen..."
if ! id "fitbuddy" &>/dev/null; then
  useradd -m -s /bin/bash -G docker fitbuddy
  echo "User 'fitbuddy' erstellt. SSH-Key manuell hinzufuegen:"
  echo "  mkdir -p /home/fitbuddy/.ssh"
  echo "  echo 'YOUR_PUBLIC_KEY' >> /home/fitbuddy/.ssh/authorized_keys"
  echo "  chown -R fitbuddy:fitbuddy /home/fitbuddy/.ssh"
  echo "  chmod 700 /home/fitbuddy/.ssh && chmod 600 /home/fitbuddy/.ssh/authorized_keys"
fi

# ── 7. Projektverzeichnis anlegen ──────────────────────────────
echo "[7/8] Projektverzeichnis anlegen..."
DEPLOY_DIR="/opt/fitbuddy"
mkdir -p "$DEPLOY_DIR"/{frontend,volumes/functions,volumes/db,volumes/api}
chown -R fitbuddy:fitbuddy "$DEPLOY_DIR"

# ── 8. Swap-File (fuer CX31 mit 8GB RAM) ──────────────────────
echo "[8/8] Swap konfigurieren..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "2GB Swap erstellt"
fi

# ── Zusammenfassung ────────────────────────────────────────────
echo ""
echo "=== Setup abgeschlossen! ==="
echo ""
echo "Naechste Schritte:"
echo "  1. SSH-Key fuer User 'fitbuddy' einrichten (siehe oben)"
echo "  2. Dateien nach $DEPLOY_DIR kopieren:"
echo "     scp docker-compose.yml Caddyfile .env fitbuddy@SERVER:$DEPLOY_DIR/"
echo "  3. Kong-Config + DB-Scripts kopieren (volumes/)"
echo "  4. .env ausfuellen (Secrets generieren!)"
echo "  5. cd $DEPLOY_DIR && docker compose up -d"
echo "  6. Migrationen ausfuehren: ./migrate.sh"
echo "  7. DNS: fitbuddy.app → Server-IP"
echo ""
echo "Studio (intern): ssh -L 3000:localhost:3000 fitbuddy@SERVER"
echo "  → http://localhost:3000"
