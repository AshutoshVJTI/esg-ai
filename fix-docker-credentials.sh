#!/bin/bash

# Fix Docker Credential Issues on macOS
# This script fixes the common "docker-credential-osxkeychain" error

echo "🔧 Docker Credential Fix for macOS"
echo "==================================="

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    exit 1
fi

# Create Docker config directory
mkdir -p "$HOME/.docker"

# Backup existing config if it exists
if [ -f "$HOME/.docker/config.json" ]; then
    echo "📝 Backing up existing Docker config..."
    cp "$HOME/.docker/config.json" "$HOME/.docker/config.json.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create minimal config without credential helpers
echo "🔧 Creating new Docker config without credential helpers..."
DOCKER_VERSION=$(docker --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo "27.3.1")
cat > "$HOME/.docker/config.json" << EOF
{
  "auths": {},
  "HttpHeaders": {
    "User-Agent": "Docker-Client/${DOCKER_VERSION} (darwin)"
  },
  "credsStore": ""
}
EOF

echo "✅ Docker credentials fixed!"
echo "📝 To restore original config, check for backup files in ~/.docker/"
echo "🚀 You can now run: ./run.sh" 