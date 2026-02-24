#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  FitBuddy — Pre-Deployment Check                            ║
# ║  Run before deploying to verify the build is safe.          ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

echo "🔍 FitBuddy Pre-Deployment Check"
echo "================================="

# 1. Build
echo ""
echo "📦 Building..."
npm run build

# 2. Check for API keys in bundle
echo ""
echo "🔐 Checking for leaked API keys in bundle..."
if grep -r "sk-proj-\|sk-live-\|sk-test-\|sk-ant-" dist/ 2>/dev/null; then
  echo "❌ ERROR: API key found in build output! Do NOT deploy."
  exit 1
fi
echo "✅ No API keys found in bundle."

# 3. Check for VITE_OPENAI_API_KEY usage (should not be in prod builds)
echo ""
echo "🔐 Checking for VITE_OPENAI_API_KEY references..."
KEY_COUNT=$(grep -r "VITE_OPENAI_API_KEY" dist/ 2>/dev/null | wc -l)
if [ "$KEY_COUNT" -gt 0 ]; then
  echo "⚠️  Warning: VITE_OPENAI_API_KEY references found ($KEY_COUNT occurrences)."
  echo "   This is OK for local dev but the key should not be set in prod env."
else
  echo "✅ No VITE_OPENAI_API_KEY references in bundle."
fi

# 4. Check bundle size
echo ""
echo "📊 Bundle size:"
du -sh dist/
echo ""
ls -lh dist/assets/*.js | awk '{print "   " $5 " " $NF}'

# 5. Verify index.html exists
echo ""
if [ -f "dist/index.html" ]; then
  echo "✅ dist/index.html exists."
else
  echo "❌ ERROR: dist/index.html missing!"
  exit 1
fi

# 6. Verify vercel.json exists
if [ -f "vercel.json" ]; then
  echo "✅ vercel.json exists (SPA rewrites configured)."
else
  echo "⚠️  Warning: vercel.json missing (SPA routing may break)."
fi

echo ""
echo "================================="
echo "✅ All checks passed! Ready to deploy."
