import React, { useState, useEffect } from 'react'
import { Save, FileText, Github, Lock, Eye, Code, Settings, Download, Upload } from 'lucide-react'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Toolbar from './components/Toolbar'
import LoginModal from './components/LoginModal'
import VisualEditor from './components/VisualEditor'
import { useLocalStorage } from './hooks/useLocalStorage'
import { INDEX1_CONTENT } from './data/index1Content'
import { QUIZ_CONTENT } from './data/quizContent'

interface EditorState {
  content: string
  filename: string
  isModified: boolean
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentView, setCurrentView] = useState<'editor' | 'preview' | 'split' | 'visual'>('visual')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editorState, setEditorState] = useState<EditorState>({
    content: '',
    filename: 'index1.html',
    isModified: false
  })
  
  const [githubToken, setGithubToken] = useLocalStorage('github_token', '')
  const [githubRepo, setGithubRepo] = useLocalStorage('github_repo', '')

  // Load file content
  const loadFile = async (filename: string) => {
    try {
      // Try to load from parent directory (where the real files are)
      const response = await fetch(`../${filename}`)
      if (response.ok) {
        const content = await response.text()
        setEditorState({
          content,
          filename,
          isModified: false
        })
      } else {
        // If file doesn't exist, start with default content
        setEditorState({
          content: getDefaultContent(filename),
          filename,
          isModified: false
        })
      }
    } catch (error) {
      console.error('Error loading file:', error)
      // Fallback to default content
      setEditorState({
        content: getDefaultContent(filename),
        filename,
        isModified: false
      })
    }
  }

  const getDefaultContent = (filename: string) => {
    if (filename === 'index1.html') {
      return INDEX1_CONTENT
    }
    if (filename === 'quiz.html') {
      return QUIZ_CONTENT
    }
    if (filename === 'index.html') {
      return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>מדריך יוניסטרים</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            direction: rtl;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .content {
            line-height: 1.6;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 מדריך יוניסטרים</h1>
        <div class="content">
            <p>ברוכים הבאים למדריך יוניסטרים!</p>
            <p>כאן תוכלו למצוא מידע על תכניות לימודים, מלגות ועוד.</p>
        </div>
    </div>
</body>
</html>`
    }
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
</head>
<body>
    <h1>קובץ חדש: ${filename}</h1>
</body>
</html>`
  }

  // Save file locally
  const saveFile = async () => {
    // Create download
    const blob = new Blob([editorState.content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = editorState.filename
    a.click()
    URL.revokeObjectURL(url)
    
    // Also try to save via API to the parent directory
    try {
      const response = await fetch('/api/save-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: `../${editorState.filename}`,
          content: editorState.content
        })
      })
      
      // If saving index1.html, also save as index.html
      if (editorState.filename === 'index1.html') {
        try {
          await fetch('/api/save-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: '../index.html',
              content: editorState.content
            })
          })
        } catch (error) {
          console.log('Could not save index.html:', error)
        }
      }
      
      if (response.ok) {
        alert('✅ נשמר גם במיקום המקורי!')
      }
    } catch (error) {
      console.log('Could not save to original location:', error)
    }
    
    setEditorState(prev => ({ ...prev, isModified: false }))
  }

  // Save to GitHub
  const saveToGitHub = async () => {
    if (!githubToken || !githubRepo) {
      alert('אנא הכנס טוקן GitHub ושם רפוזיטורי')
      return
    }

    try {
      // Get current file SHA (if exists)
      let sha = null
      try {
        const getResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${editorState.filename}`, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
        if (getResponse.ok) {
          const data = await getResponse.json()
          sha = data.sha
        }
      } catch (error) {
        console.log('File might not exist yet')
      }

      // Save file
      const saveData = {
        message: `Update ${editorState.filename} via UNIGuide React Editor`,
        content: btoa(unescape(encodeURIComponent(editorState.content))),
        ...(sha && { sha })
      }

      const saveResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${editorState.filename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      })

      if (saveResponse.ok) {
        // If saving index1.html, also save as index.html for GitHub Pages
        if (editorState.filename === 'index1.html') {
          try {
            // Get current index.html SHA (if exists)
            let indexSha = null
            try {
              const getIndexResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/index.html`, {
                headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Accept': 'application/vnd.github.v3+json'
                }
              })
              if (getIndexResponse.ok) {
                const data = await getIndexResponse.json()
                indexSha = data.sha
              }
            } catch (error) {
              console.log('index.html might not exist yet')
            }

            // Save as index.html too
            const indexSaveData = {
              message: `Update index.html (from index1.html) via UNIGuide React Editor`,
              content: btoa(unescape(encodeURIComponent(editorState.content))),
              ...(indexSha && { sha: indexSha })
            }

            const indexSaveResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/index.html`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(indexSaveData)
            })

            if (indexSaveResponse.ok) {
              alert('✅ נשמר בהצלחה לגיטהאב!\n🌐 גם index.html עודכן עבור GitHub Pages!')
            } else {
              alert('✅ נשמר בהצלחה לגיטהאב!\n⚠️ אבל index.html לא עודכן')
            }
          } catch (error) {
            alert('✅ נשמר בהצלחה לגיטהאב!\n⚠️ אבל index.html לא עודכן')
            console.error('Failed to update index.html:', error)
          }
        } else {
          alert('✅ נשמר בהצלחה לגיטהאב!')
        }
        setEditorState(prev => ({ ...prev, isModified: false }))
      } else {
        const error = await saveResponse.text()
        alert(`❌ שגיאה בשמירה: ${saveResponse.status}`)
        console.error('GitHub save error:', error)
      }
    } catch (error) {
      alert('❌ שגיאה בחיבור לגיטהאב')
      console.error('Save to GitHub failed:', error)
    }
  }

  // Handle content change
  const handleContentChange = (content: string) => {
    setEditorState(prev => ({
      ...prev,
      content,
      isModified: prev.content !== content
    }))
  }

  // Handle file change
  const handleFileChange = (filename: string) => {
    if (editorState.isModified) {
      if (confirm('יש שינויים לא שמורים. האם אתה בטוח שברצונך לעבור לקובץ אחר?')) {
        loadFile(filename)
      }
    } else {
      loadFile(filename)
    }
  }

  // Load initial file
  useEffect(() => {
    if (isLoggedIn) {
      loadFile('index1.html')
      // Show helpful message
      setTimeout(() => {
        alert('🎉 ברוך הבא לעורך הויזואלי החדש!\n\n✨ לחץ על "עריכה" כדי להתחיל לערוך את האתר\n📝 תוכל להוסיף תכניות, שאלות נפוצות ועוד\n👀 כל השינויים יופיעו מיד בתצוגה המקדימה!')
      }, 1000)
    }
  }, [isLoggedIn])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveFile()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        saveToGitHub()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editorState])

  if (!isLoggedIn) {
    return <LoginModal onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">עורך UNIGuide React</h1>
                <p className="text-white/70">עורך מקצועי מבוסס React + TypeScript</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editorState.isModified && (
                <span className="text-yellow-300 text-sm">● לא נשמר</span>
              )}
              <span className="text-white/70 text-sm">{editorState.filename}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <Toolbar
          currentFile={editorState.filename}
          onFileChange={handleFileChange}
          onSave={saveFile}
          onSaveToGitHub={saveToGitHub}
          githubToken={githubToken}
          githubRepo={githubRepo}
          onGithubTokenChange={setGithubToken}
          onGithubRepoChange={setGithubRepo}
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
          {currentView === 'visual' && (
            <div className="h-[calc(100vh-300px)]">
              <VisualEditor
                content={editorState.content}
                onChange={handleContentChange}
                isEditMode={isEditMode}
                onToggleEditMode={() => setIsEditMode(!isEditMode)}
              />
            </div>
          )}

          {currentView === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-300px)]">
              <div className="border-l border-white/20">
                <div className="bg-white/5 p-3 border-b border-white/20 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <span className="font-medium">עריכה</span>
                </div>
                <Editor
                  content={editorState.content}
                  onChange={handleContentChange}
                />
              </div>
              <div>
                <div className="bg-white/5 p-3 border-b border-white/20 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">תצוגה מקדימה</span>
                </div>
                <Preview content={editorState.content} />
              </div>
            </div>
          )}

          {currentView === 'editor' && (
            <div className="h-[calc(100vh-300px)]">
              <div className="bg-white/5 p-3 border-b border-white/20 flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="font-medium">עריכה</span>
              </div>
              <Editor
                content={editorState.content}
                onChange={handleContentChange}
              />
            </div>
          )}

          {currentView === 'preview' && (
            <div className="h-[calc(100vh-300px)]">
              <div className="bg-white/5 p-3 border-b border-white/20 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="font-medium">תצוגה מקדימה</span>
              </div>
              <Preview content={editorState.content} />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-6">
          <div className="flex items-center justify-between text-sm text-white/70">
            <div className="flex items-center gap-4">
              <span>שורות: {editorState.content.split('\n').length}</span>
              <span>תווים: {editorState.content.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Ctrl+S - שמירה מקומית</span>
              <span>Ctrl+Enter - שמירה לגיטהאב</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App