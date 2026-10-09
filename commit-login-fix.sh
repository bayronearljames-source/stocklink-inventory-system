#!/bin/bash

# Commit and push login credential fix to a feature branch
# (Direct push to main is blocked — opens a PR instead)

BRANCH="fix/login-quick-credentials"

echo "🔀 Creating branch: $BRANCH"
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

echo "📦 Staging changes..."
git add client/src/pages/auth/Login.jsx

echo "✅ Committing..."
git commit -m "fix: update quick login buttons to match actual DB credentials

- Changed admin1 → testadmin (Admin1234!)
- Changed manager1 → testmanager (Admin1234!)
- Changed clerk1 → testclerk (Admin1234!)
- Updated display labels to match real usernames"

echo "🚀 Pushing branch to origin..."
git push origin "$BRANCH"

echo ""
echo "✅ Done! Open a Pull Request on GitHub:"
echo "   https://github.com/bayronearljames-source/stocklink-inventory-system/compare/$BRANCH"

