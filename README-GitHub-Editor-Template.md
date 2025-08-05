# 🔐 Secure GitHub Web Editor

A complete solution for editing files directly in the browser with automatic GitHub synchronization.

## ✨ Features

- 🔐 **Password Protection** - Secure access control
- 💾 **Direct GitHub Save** - No terminal commands needed
- 👀 **Real-time Preview** - See changes instantly
- 🎯 **Built-in Tools** - Content insertion helpers
- 📊 **Statistics** - Track characters, words, lines
- ⚡ **Auto-save** - Every 30 seconds with changes
- 🔧 **CORS Solutions** - Multiple fallback options

## 🚀 Quick Setup

### Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set name: "Web Editor"
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
   - ✅ **public_repo** (Access public repositories)
5. Click "Generate token"
6. **Important!** Copy the token immediately - it's shown only once

### Step 2: Request AI Assistant

Use this **exact prompt** with your AI assistant:

```
I want to create a secure web-based editor for my project files with direct GitHub synchronization. Please create:

1. A password-protected HTML editor (secure-editor.html) that can:
   - Edit multiple files (like index.html, about.html, etc.)
   - Save directly to GitHub using API
   - Show real-time preview
   - Include content insertion tools
   - Handle CORS issues gracefully

2. Include these CORS fallback solutions:
   - Local server batch file (start-server.bat)
   - Manual sync tool (quick-save.bat) 
   - Node.js sync script (github-sync.js)

3. Make sure to:
   - Use modern GitHub API (Bearer tokens, not basic auth)
   - Clean all inputs to prevent encoding issues
   - Provide detailed error messages and debugging
   - Include comprehensive token permission testing
   - Handle both public and private repositories

4. Avoid these common mistakes:
   - Don't use Hebrew text in commit messages (causes encoding errors)
   - Don't forget to encode URLs properly with encodeURIComponent()
   - Don't use old 'token' authorization (use 'Bearer' instead)
   - Don't assume the file exists (handle both create/update scenarios)

5. The editor should work for repository: [YOUR_USERNAME/YOUR_REPOSITORY]
   Password: [YOUR_CHOSEN_PASSWORD]

Please provide a complete, working solution with all necessary files.
```

**Replace:**
- `[YOUR_USERNAME/YOUR_REPOSITORY]` with your actual GitHub repository
- `[YOUR_CHOSEN_PASSWORD]` with your preferred password

### Step 3: Setup Files

After the AI creates the files, you'll have:
- `secure-editor.html` - Main editor
- `start-server.bat` - Local server launcher
- `quick-save.bat` - Manual sync tool
- `github-sync.js` - Node.js sync script

### Step 4: Configure

1. Open `secure-editor.html`
2. Enter your password
3. Enter your GitHub token
4. Enter repository name: `username/repository`
5. Click "Save Settings"

## 🔧 CORS Solutions

### Problem: Browser CORS Policy

When opening HTML files directly (`file://`), browsers block GitHub API calls.

### Solution 1: Local Server (Recommended)
```bash
# Double-click or run:
start-server.bat

# Then open: http://localhost:8000/secure-editor.html
```

### Solution 2: Manual Sync
```bash
# After editing, double-click:
quick-save.bat

# Enter token and repository (first time only)
```

### Solution 3: NPM Scripts
```bash
npm run github:sync    # Sync all files
npm run github:watch   # Watch for changes
npm run github:upload  # Upload specific file
```

## 🛠️ Troubleshooting

### Token Issues
- **401 Unauthorized**: Token expired or invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Repository doesn't exist or no access

**Fix:** Create new token with `repo` permissions

### CORS Issues
- **Error**: `Failed to fetch` or `CORS policy`
- **Fix**: Use local server or manual sync tools

### Encoding Issues
- **Error**: `non ISO-8859-1 code point`
- **Fix**: Ensure clean ASCII tokens and repository names

### Repository Access
- **Private repos**: Need `repo` scope
- **Public repos**: Need `public_repo` scope
- **Organization repos**: May need additional permissions

## 📁 File Structure

```
your-project/
├── secure-editor.html      # Main editor interface
├── start-server.bat        # Local server launcher
├── quick-save.bat         # Manual sync tool
├── github-sync.js         # Node.js sync script
├── package.json           # NPM configuration
└── .env                   # GitHub credentials (auto-created)
```

## 🔒 Security Notes

- **Password**: Change default password in `secure-editor.html`
- **Token**: Stored in browser localStorage only
- **Access**: Only password holders can use the editor
- **History**: All changes tracked in Git history

## 🎯 Customization

### Change Password
Edit `secure-editor.html`:
```javascript
const CONFIG = {
    password: 'YOUR_NEW_PASSWORD',  // Change here
    // ...
};
```

### Add File Types
Edit the file list in `secure-editor.html`:
```javascript
<div class="file-item" onclick="selectFile('new-file.html')">
    📄 new-file.html
</div>
```

### Modify Auto-save Interval
```javascript
const CONFIG = {
    // ...
    autoSaveInterval: 60000 // 60 seconds (in milliseconds)
};
```

## 📞 Support

If you encounter issues:

1. **Check Console** (F12) for detailed error messages
2. **Test Token** using the "🔬 Check Permissions" button
3. **Verify Repository** name and access permissions
4. **Use CORS Solutions** if direct saving fails

## 🎉 Success Indicators

- ✅ Token validation shows your username
- ✅ Repository access confirmed
- ✅ Files save with "✅ Saved successfully!" message
- ✅ Changes appear in GitHub repository
- ✅ Preview updates in real-time

---

**Built with ❤️ for seamless GitHub integration**

*This solution eliminates the need for command-line Git operations while maintaining full version control.*