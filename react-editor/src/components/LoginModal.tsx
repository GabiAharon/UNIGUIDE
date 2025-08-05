import React, { useState, useEffect } from 'react'
import { Lock, FileText } from 'lucide-react'

interface LoginModalProps {
  onLogin: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password === 'unistream2024') {
      onLogin()
    } else {
      setError('סיסמה שגויה!')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  useEffect(() => {
    // Focus on password input when component mounts
    const input = document.getElementById('password-input') as HTMLInputElement
    if (input) {
      input.focus()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">עורך UNIGuide</h1>
          <p className="text-white/70">React + TypeScript Edition</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password-input" className="block text-white/90 font-medium mb-2">
              🔐 הכנס סיסמה
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="הכנס סיסמה..."
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            כניסה לעורך
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">✨ תכונות העורך:</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• עריכה בזמן אמת עם תצוגה מקדימה</li>
              <li>• שמירה מקומית ושמירה לגיטהאב</li>
              <li>• עיצוב מודרני עם React + TypeScript</li>
              <li>• קיצורי מקלדת: Ctrl+S, Ctrl+Enter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal