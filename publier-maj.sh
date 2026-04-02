#!/bin/bash
echo ""
echo " ========================================"
echo "   OVERSEER - Publication de mise a jour"
echo " ========================================"
echo ""

cd "$(dirname "$0")"

# 1. Demander le numero de version
read -p "Nouvelle version (ex: 2.1.0) : " VERSION
if [ -z "$VERSION" ]; then
    echo "Annule - pas de version entree."
    exit 1
fi

# 2. Mettre a jour package.json avec la nouvelle version
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
echo "[OK] Version mise a jour : $VERSION"

# 3. Commit + Push
echo ""
echo "[...] Commit et push sur GitHub..."
git add -A
git commit -m "v$VERSION"
git push origin master
echo "[OK] Code pousse sur GitHub !"

# 4. Build + Publish
echo ""
echo "[...] Build de l'app et publication sur GitHub Releases..."
echo "     (ca peut prendre 1-2 minutes)"
echo ""

export GH_TOKEN=$(gh auth token)
export CSC_IDENTITY_AUTO_DISCOVERY=false

npx vite build
npx electron-builder --linux --publish always

echo ""
echo " ========================================"
echo "   PUBLIE ! Tes potes recevront la v$VERSION"
echo "   automatiquement au lancement de l'app"
echo " ========================================"
echo ""
read -p "Appuie sur Entree pour fermer..."
