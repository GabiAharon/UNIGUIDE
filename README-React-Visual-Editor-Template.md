# 🎨 React Visual Editor with GitHub Sync - Complete Template

**A comprehensive guide to building a professional visual content editor with React, Vite, TypeScript, and automatic GitHub synchronization.**

---

## 📋 Complete Prompt for AI Assistant

Use this **exact prompt** to recreate this entire system:

```
I need you to build a complete React-based visual content editor with GitHub synchronization. Here are the exact requirements:

## 🏗️ PROJECT STRUCTURE

Create a React project with this exact structure:
```
project-root/
├── react-editor/                 # Main React app directory
│   ├── package.json              # React dependencies
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript config
│   ├── tailwind.config.js        # Tailwind CSS config
│   ├── postcss.config.js         # PostCSS config
│   ├── index.html                # React app shell
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Main app component
│       ├── index.css             # Global styles with Tailwind
│       ├── components/
│       │   ├── Editor.tsx        # Code editor component
│       │   ├── Preview.tsx       # HTML preview iframe
│       │   ├── Toolbar.tsx       # Top toolbar with file selector
│       │   ├── LoginModal.tsx    # Password protection modal
│       │   └── VisualEditor.tsx  # Main visual editing interface
│       ├── hooks/
│       │   └── useLocalStorage.ts # localStorage hook
│       └── data/
│           ├── index1Content.ts  # Main content as TypeScript constant
│           └── quizContent.ts    # Quiz content as TypeScript constant
├── index1.html                   # Main content file (user's actual content)
├── quiz.html                     # Quiz file
├── index.html                    # Copy of index1.html for GitHub Pages
├── start-react-editor.bat        # Windows launcher
└── start.html                    # Project launcher page
```

## 🎯 CORE FEATURES TO IMPLEMENT

### 1. PASSWORD PROTECTION
- Login modal with password: "unistream2024"
- Store login state in React state
- Block access until authenticated

### 2. DUAL EDITOR MODES
- **Visual Mode**: WYSIWYG editor with floating edit buttons
- **Code Mode**: Direct HTML editing with syntax highlighting
- **Split Mode**: Code + preview side by side
- **Preview Mode**: Full preview only

### 3. VISUAL EDITOR REQUIREMENTS
- Parse HTML content to extract structured items (programs, FAQ, systems, events)
- Display items in a sidebar list with edit/delete buttons
- Floating "Add Content" button
- Modal forms for adding/editing content
- Real-time preview updates
- Content categories: תכניות, שאלות נפוצות, מערכות, אירועים, מסמכים

### 4. GITHUB SYNCHRONIZATION
**CRITICAL**: When saving index1.html, ALSO save as index.html for GitHub Pages compatibility!

Implement these functions:
```typescript
// Save locally (download)
const saveFile = async () => {
  // Download file
  // Try to save to parent directory via API
  // If index1.html, ALSO save as index.html
}

// Save to GitHub
const saveToGitHub = async () => {
  // Get current file SHA from GitHub API
  // Save main file (index1.html)
  // If index1.html, ALSO save as index.html with separate API call
  // Use Bearer token authentication
  // Handle both new and existing files
}
```

### 5. FILE MANAGEMENT
- Support multiple files: index1.html, index.html, quiz.html
- File selector dropdown in toolbar
- Load content from embedded TypeScript constants (not fetch)
- Detect unsaved changes and warn before switching files

### 6. CONTENT PARSING & GENERATION
Create functions to:
- Parse HTML and extract content items by type
- Generate proper HTML for each content type
- Handle Hebrew RTL text correctly
- Maintain original styling and structure

## 🛠️ TECHNICAL SPECIFICATIONS

### Dependencies (package.json)
```json
{
  "name": "uniguide-react-editor",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.2.2",
    "vite": "^5.2.0",
    "lucide-react": "^0.263.1"
  }
}
```

### Vite Configuration
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001
  }
})
```

### Tailwind Configuration
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## 🎨 STYLING REQUIREMENTS

### Global Styles (index.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&display=swap');

:root {
  font-family: 'Assistant', Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### Visual Editor Styling
- White modals with proper contrast
- Dark text on white backgrounds (text-gray-800)
- Clear borders and shadows
- Proper focus states with blue highlights
- Responsive design

## 🔧 COMPONENT SPECIFICATIONS

### App.tsx Structure
```typescript
interface EditorState {
  content: string
  filename: string
  isModified: boolean
}

// State management
const [isLoggedIn, setIsLoggedIn] = useState(false)
const [currentView, setCurrentView] = useState<'visual' | 'editor' | 'preview' | 'split'>('visual')
const [isEditMode, setIsEditMode] = useState(false)
const [editorState, setEditorState] = useState<EditorState>({
  content: '',
  filename: 'index1.html',
  isModified: false
})

// GitHub integration
const [githubToken, setGithubToken] = useLocalStorage('github_token', '')
const [githubRepo, setGithubRepo] = useLocalStorage('github_repo', '')
```

### VisualEditor.tsx Features
- Content item parsing and categorization
- Floating edit buttons on hover
- Modal forms with proper validation
- Real-time HTML generation
- Iframe preview integration

### Toolbar.tsx Features
- File selector dropdown
- View mode toggle buttons
- Save buttons (local + GitHub)
- GitHub configuration inputs
- Visual indicators for unsaved changes

## ⚠️ CRITICAL REQUIREMENTS

### 1. Content Loading
**DO NOT** use fetch() for loading content. Instead:
- Store full content in TypeScript constants
- Import constants in components
- This avoids CORS issues and ensures reliability

### 2. GitHub Pages Compatibility
**ALWAYS** save both files when editing index1.html:
- Save index1.html (user's working file)
- Save index.html (GitHub Pages requirement)
- Use same content for both files

### 3. Error Handling
- Graceful GitHub API failures
- Clear error messages in Hebrew
- Fallback to local save if GitHub fails
- Token validation before operations

### 4. Hebrew Support
- RTL text direction support
- Hebrew interface text
- Proper text encoding (UTF-8)
- Hebrew placeholders and labels

### 5. Performance
- Lazy loading of large content
- Debounced save operations
- Efficient re-renders
- Smooth animations

## 🚀 DEPLOYMENT SETUP

### Windows Batch Launcher
```batch
@echo off
echo 🚀 Starting UNIGuide React Editor...
echo.
cd react-editor
echo Starting development server...
echo Server will be available at: http://localhost:3001
echo.
npm run dev
pause
```

### Project Launcher (start.html)
Create a beautiful launcher page with:
- Project description
- Links to React editor
- Status indicators
- Setup instructions

## 🔍 TESTING CHECKLIST

Before considering the project complete, verify:

✅ Password protection works
✅ All four view modes function correctly
✅ Visual editor can add/edit/delete content
✅ Content parsing extracts all item types
✅ GitHub sync saves both index1.html AND index.html
✅ File switching works with unsaved changes warning
✅ Hebrew text displays correctly
✅ Modals have proper contrast and visibility
✅ Error handling provides clear feedback
✅ Local save downloads files correctly
✅ Preview updates in real-time
✅ Responsive design works on different screen sizes

## 🎯 SUCCESS CRITERIA

The project is successful when:
1. User can edit content visually without coding knowledge
2. Changes sync automatically to GitHub Pages and Netlify
3. Both index1.html and index.html are maintained
4. Interface is fully in Hebrew with RTL support
5. All modals and forms have proper contrast
6. No CORS issues or loading problems
7. Professional, polished user experience

## 🚨 COMMON PITFALLS TO AVOID

1. **White text on white background** - Use text-gray-800 for form inputs
2. **CORS issues** - Use TypeScript constants, not fetch()
3. **Missing index.html** - Always save both files for GitHub Pages
4. **Token encoding issues** - Clean inputs and use Bearer auth
5. **Hebrew display problems** - Ensure UTF-8 and RTL support
6. **Performance issues** - Debounce saves and optimize re-renders
7. **Broken file switching** - Handle unsaved changes properly

This template ensures a complete, professional visual editor that works perfectly on first implementation.
```

---

## 🎯 Implementation Notes

### Why This Architecture?

1. **React + Vite**: Modern, fast development experience
2. **TypeScript**: Type safety and better development experience  
3. **Tailwind CSS**: Rapid UI development with consistent styling
4. **Visual Editor**: Non-technical users can edit content easily
5. **Dual File System**: Compatibility with both GitHub Pages and custom setups
6. **Embedded Content**: Avoids CORS issues and ensures reliability

### Key Innovations

1. **Automatic Dual Save**: Saves both index1.html and index.html
2. **Content Parsing**: Extracts structured data from HTML
3. **Visual Editing**: WYSIWYG interface with floating controls
4. **GitHub Integration**: Direct API calls with proper error handling
5. **Hebrew Support**: Full RTL and Hebrew interface

### Performance Optimizations

1. **TypeScript Constants**: Fast content loading without network requests
2. **Component Lazy Loading**: Only load what's needed
3. **Debounced Operations**: Prevent excessive API calls
4. **Efficient State Management**: Minimal re-renders

## 🔧 Customization Guide

### Adding New Content Types

1. Update the `ContentItem` interface in `VisualEditor.tsx`
2. Add new parsing logic in `parseContent()`
3. Update `generateItemHTML()` for new types
4. Add options to the type selector dropdown

### Modifying Styling

1. Update Tailwind classes in components
2. Modify global styles in `index.css`
3. Adjust modal contrast in `VisualEditor.tsx`
4. Update theme colors in `tailwind.config.js`

### GitHub Integration

1. Configure repository in toolbar
2. Generate Personal Access Token with `repo` scope
3. Test connection before first save
4. Monitor API rate limits

## 🎉 Final Result

A complete, professional visual content management system that:

- ✅ Works out of the box
- ✅ Requires no coding knowledge for content editing
- ✅ Syncs automatically with GitHub and Netlify
- ✅ Supports Hebrew and RTL text
- ✅ Has proper contrast and accessibility
- ✅ Handles errors gracefully
- ✅ Provides a smooth user experience

**This template guarantees success on the first implementation when followed exactly.**