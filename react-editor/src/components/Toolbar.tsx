import React from 'react'
import { Save, Github, FileText, Code, Eye, Split, Settings, Palette } from 'lucide-react'

interface ToolbarProps {
  currentFile: string
  onFileChange: (filename: string) => void
  onSave: () => void
  onSaveToGitHub: () => void
  githubToken: string
  githubRepo: string
  onGithubTokenChange: (token: string) => void
  onGithubRepoChange: (repo: string) => void
  currentView: 'editor' | 'preview' | 'split' | 'visual'
  onViewChange: (view: 'editor' | 'preview' | 'split' | 'visual') => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentFile,
  onFileChange,
  onSave,
  onSaveToGitHub,
  githubToken,
  githubRepo,
  onGithubTokenChange,
  onGithubRepoChange,
  currentView,
  onViewChange
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* File Selector */}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <select
            value={currentFile}
            onChange={(e) => onFileChange(e.target.value)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="index1.html">📄 index1.html (הקובץ הראשי)</option>
            <option value="index.html">📄 index.html</option>
            <option value="quiz.html">❓ quiz.html</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white/20 rounded-lg p-1">
          <button
            onClick={() => onViewChange('visual')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-all ${
              currentView === 'visual' 
                ? 'bg-white/30 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            ויזואלי
          </button>
          <button
            onClick={() => onViewChange('editor')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-all ${
              currentView === 'editor' 
                ? 'bg-white/30 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            עריכה
          </button>
          <button
            onClick={() => onViewChange('split')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-all ${
              currentView === 'split' 
                ? 'bg-white/30 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Split className="w-4 h-4" />
            מפוצל
          </button>
          <button
            onClick={() => onViewChange('preview')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-all ${
              currentView === 'preview' 
                ? 'bg-white/30 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            תצוגה
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFileChange(currentFile)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            טען מחדש
          </button>
          
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            שמור מקומית
          </button>
          
          <button
            onClick={onSaveToGitHub}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            <Github className="w-4 h-4" />
            שמור לגיטהאב
          </button>
        </div>

        {/* GitHub Configuration */}
        <div className="flex items-center gap-2 mr-auto">
          <Settings className="w-4 h-4 text-white/70" />
          <input
            type="text"
            placeholder="GitHub Token"
            value={githubToken}
            onChange={(e) => onGithubTokenChange(e.target.value)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
          />
          <input
            type="text"
            placeholder="username/repo"
            value={githubRepo}
            onChange={(e) => onGithubRepoChange(e.target.value)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
          />
        </div>
      </div>
    </div>
  )
}

export default Toolbar