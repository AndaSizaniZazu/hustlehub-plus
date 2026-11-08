#!/bin/sh
set -e

# Create a self-signed certificate on first start if none was mounted.
# For a real deployment, mount real certificates into $CERT_DIR instead.
if [ ! -f "$CERT_DIR/localhost.pem" ] || [ ! -f "$CERT_DIR/localhost-key.pem" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$CERT_DIR/localhost-key.pem" \
    -out "$CERT_DIR/localhost.pem" \
    -days 365 -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:backend,IP:127.0.0.1" 2>/dev/null
  echo "Generated self-signed certificate in $CERT_DIR"
fi

exec "$@"
