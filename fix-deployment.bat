@echo off
echo 🚀 Fix Gamer-Chat Vercel Deployment...
echo ---------------------------------------

:: 1. Force remove all cached files from Git index
echo 🗑️ clearing Git cache...
git rm -r --cached .

:: 2. Re-add everything (Git will now respect .gitignore)
echo 📁 Re-indexing files...
git add .

:: 3. Commit and Push
echo 💾 Committing cleanup...
git commit -m "Fix: Remove node_modules from Git history once and for all"
echo 🚀 Pushing to GitHub...
git push

echo ---------------------------------------
echo ✅ DONE! Now check your Vercel dashboard.
pause
