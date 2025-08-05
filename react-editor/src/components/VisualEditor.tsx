import React, { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, Eye } from 'lucide-react'

interface VisualEditorProps {
  content: string
  onChange: (content: string) => void
  isEditMode: boolean
  onToggleEditMode: () => void
}

interface ContentItem {
  id: string
  type: 'program' | 'faq' | 'event' | 'system' | 'document' | 'quiz'
  title: string
  description: string
  category?: string
  options?: string[]
  correct?: number
}

const VisualEditor: React.FC<VisualEditorProps> = ({ 
  content, 
  onChange, 
  isEditMode, 
  onToggleEditMode 
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [newItem, setNewItem] = useState<ContentItem>({
    id: '',
    type: 'program',
    title: '',
    description: '',
    category: '',
    options: ['', '', '', ''],
    correct: 0
  })
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Parse content to extract items
  const parseContent = (htmlContent: string): ContentItem[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const items: ContentItem[] = []

    // Extract all dictionary items (programs, systems, etc.)
    const allDictionaryItems = doc.querySelectorAll('.dictionary-item')
    allDictionaryItems.forEach((item, index) => {
      const titleEl = item.querySelector('.term')
      const descEl = item.querySelector('.definition')
      if (titleEl && descEl) {
        // Determine type based on ID or context
        let type: ContentItem['type'] = 'program'
        let category = 'תכניות'
        
        const itemId = item.id || item.getAttribute('id') || ''
        if (itemId.includes('system') || itemId.includes('salesforce') || itemId.includes('uninet') || itemId.includes('sharepoint')) {
          type = 'system'
          category = 'מערכות'
        } else if (itemId.includes('event')) {
          type = 'event'
          category = 'אירועים'
        } else if (itemId.includes('document')) {
          type = 'document'
          category = 'מסמכים'
        }

        items.push({
          id: itemId || `item-${index}`,
          type,
          title: titleEl.textContent?.trim() || '',
          description: descEl.textContent?.trim() || descEl.innerHTML?.trim() || '',
          category
        })
      }
    })

    // Extract FAQ items
    const faqItems = doc.querySelectorAll('.faq-card')
    faqItems.forEach((item, index) => {
      const questionEl = item.querySelector('.faq-question')
      const answerEl = item.querySelector('.faq-answer')
      if (questionEl && answerEl) {
        items.push({
          id: `faq-${index}`,
          type: 'faq',
          title: questionEl.textContent?.trim() || '',
          description: answerEl.textContent?.trim() || answerEl.innerHTML?.trim() || '',
          category: 'שאלות נפוצות'
        })
      }
    })

    // Extract sections with headers (h2, h3, etc.)
    const headers = doc.querySelectorAll('h2, h3, h4')
    headers.forEach((header, index) => {
      const headerText = header.textContent?.trim() || ''
      const headerId = header.id || `header-${index}`
      
      // Get content after header until next header
      let content = ''
      let nextElement = header.nextElementSibling
      while (nextElement && !nextElement.matches('h1, h2, h3, h4, h5, h6')) {
        if (nextElement.textContent?.trim()) {
          content += nextElement.textContent.trim() + ' '
        }
        nextElement = nextElement.nextElementSibling
      }

      if (headerText && content.trim()) {
        // Determine category based on header text
        let category = 'כללי'
        let type: ContentItem['type'] = 'document'
        
        if (headerText.includes('תכנית') || headerText.includes('תכניות')) {
          category = 'תכניות'
          type = 'program'
        } else if (headerText.includes('שאלות נפוצות') || headerText.includes('שו"ת')) {
          category = 'שאלות נפוצות'
          type = 'faq'
        } else if (headerText.includes('מערכת') || headerText.includes('מערכות')) {
          category = 'מערכות'
          type = 'system'
        } else if (headerText.includes('אירוע') || headerText.includes('אירועים')) {
          category = 'אירועים'
          type = 'event'
        }

        // Don't add if we already have this as a dictionary item
        const existingItem = items.find(item => item.title === headerText)
        if (!existingItem) {
          items.push({
            id: headerId,
            type,
            title: headerText,
            description: content.trim().substring(0, 500) + (content.length > 500 ? '...' : ''),
            category
          })
        }
      }
    })

    // Extract quiz questions if this is quiz.html
    if (htmlContent.includes('const questions = [')) {
      const scriptMatch = htmlContent.match(/const questions = \[([\s\S]*?)\];/)
      if (scriptMatch) {
        try {
          // Parse individual question objects
          const questionsText = scriptMatch[1]
          const questionObjects = questionsText.split('},').map(q => q.trim() + '}')
          
          questionObjects.forEach((questionObj, index) => {
            const questionMatch = questionObj.match(/question:\s*["'](.*?)["']/)
            const optionsMatch = questionObj.match(/options:\s*\[([\s\S]*?)\]/)
            const correctMatch = questionObj.match(/correct:\s*(\d+)/)
            
            if (questionMatch) {
              const questionText = questionMatch[1]
              let options: string[] = []
              let correct = 0
              
              if (optionsMatch) {
                const optionsText = optionsMatch[1]
                options = optionsText
                  .split(',')
                  .map(opt => opt.trim().replace(/^["']|["']$/g, ''))
                  .filter(opt => opt.length > 0)
              }
              
              if (correctMatch) {
                correct = parseInt(correctMatch[1])
              }
              
              items.push({
                id: `quiz-question-${index}`,
                type: 'quiz',
                title: questionText,
                description: `תשובה נכונה: ${options[correct] || 'לא זוהתה'}`,
                category: 'שאלות מבחן',
                options,
                correct
              })
            }
          })
        } catch (error) {
          console.log('Could not parse quiz questions:', error)
        }
      }
    }

    return items
  }

  const contentItems = parseContent(content)

  // Update preview with edit buttons if in edit mode
  useEffect(() => {
    if (previewRef.current) {
      const iframe = previewRef.current
      const doc = iframe.contentDocument
      if (doc) {
        let displayContent = content
        
        // If in edit mode, inject edit buttons into the content
        if (isEditMode) {
          displayContent = injectEditButtons(content)
        }
        
        doc.open()
        doc.write(displayContent)
        doc.close()
        
        // Add event listeners for edit buttons if in edit mode
        if (isEditMode) {
          addEditButtonListeners()
        }
      }
    }
  }, [content, isEditMode])

  // Inject edit buttons into HTML content
  const injectEditButtons = (htmlContent: string): string => {
    let modifiedContent = htmlContent
    
    // Add edit buttons to dictionary items
    modifiedContent = modifiedContent.replace(
      /<div([^>]*class="dictionary-item"[^>]*id="([^"]*)"[^>]*)>([\s\S]*?)<\/div>/g,
      (match, attributes, id, innerContent) => {
        const item = contentItems.find(item => item.id === id)
        if (item) {
          return `<div${attributes} style="position: relative; border: 2px dashed transparent; padding: 15px; margin: 10px 0; transition: all 0.3s; border-radius: 8px;" 
            onmouseover="this.style.border='2px dashed #3b82f6'; this.style.backgroundColor='#f0f9ff'; this.querySelector('.edit-controls').style.display='flex';" 
            onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
            ${innerContent}
            <div style="position: absolute; top: 8px; right: 8px; display: none; gap: 8px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${id}'}, '*')" 
                style="background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#2563eb';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#3b82f6';">
                ✏️ ערוך
              </button>
              <button onclick="window.parent.postMessage({action: 'delete', id: '${id}'}, '*')" 
                style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#dc2626';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#ef4444';">
                🗑️ מחק
              </button>
            </div>
          </div>`
        }
        return match
      }
    )
    
    // Add edit buttons to FAQ cards
    modifiedContent = modifiedContent.replace(
      /<div([^>]*class="faq-card"[^>]*)>([\s\S]*?)<\/div>/g,
      (match, attributes, innerContent) => {
        const faqMatch = innerContent.match(/<div class="faq-question">(.*?)<\/div>/)
        if (faqMatch) {
          const questionText = faqMatch[1].trim()
          const faqItem = contentItems.find(item => item.title.trim() === questionText && item.type === 'faq')
          if (faqItem) {
            return `<div${attributes} style="position: relative; border: 2px dashed transparent; padding: 15px; margin: 10px 0; transition: all 0.3s; border-radius: 8px;" 
              onmouseover="this.style.border='2px dashed #10b981'; this.style.backgroundColor='#f0fdf4'; this.querySelector('.edit-controls').style.display='flex';" 
              onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
              ${innerContent}
              <div style="position: absolute; top: 8px; right: 8px; display: none; gap: 8px; z-index: 1000;" class="edit-controls">
                <button onclick="window.parent.postMessage({action: 'edit', id: '${faqItem.id}'}, '*')" 
                  style="background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                  onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#059669';" 
                  onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#10b981';">
                  ✏️ ערוך שאלה
                </button>
                <button onclick="window.parent.postMessage({action: 'delete', id: '${faqItem.id}'}, '*')" 
                  style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                  onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#dc2626';" 
                  onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#ef4444';">
                  🗑️ מחק
                </button>
              </div>
            </div>`
          }
        }
        return match
      }
    )

    // Add edit buttons to headers (h2, h3, h4)
    modifiedContent = modifiedContent.replace(
      /<(h[2-4])([^>]*id="([^"]*)"[^>]*)>(.*?)<\/h[2-4]>/g,
      (match, tag, attributes, id, innerText) => {
        const headerItem = contentItems.find(item => item.id === id)
        if (headerItem) {
          return `<${tag}${attributes} style="position: relative; border: 2px dashed transparent; padding: 10px; margin: 15px 0; transition: all 0.3s; border-radius: 8px;" 
            onmouseover="this.style.border='2px dashed #f59e0b'; this.style.backgroundColor='#fffbeb'; this.querySelector('.edit-controls').style.display='flex';" 
            onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
            ${innerText}
            <div style="position: absolute; top: 5px; right: 5px; display: none; gap: 6px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${id}'}, '*')" 
                style="background: #f59e0b; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#d97706';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#f59e0b';">
                ✏️ ערוך כותרת
              </button>
              <button onclick="window.parent.postMessage({action: 'delete', id: '${id}'}, '*')" 
                style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#dc2626';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#ef4444';">
                🗑️ מחק
              </button>
            </div>
          </${tag}>`
        }
        return match
      }
    )
    
    return modifiedContent
  }

  // Add event listeners for edit buttons
  const addEditButtonListeners = () => {
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action && event.source === previewRef.current?.contentWindow) {
        const { action, id } = event.data
        const item = contentItems.find(item => item.id === id)
        if (item) {
          if (action === 'edit') {
            handleEditItem(item)
          } else if (action === 'delete') {
            if (confirm(`האם אתה בטוח שברצונך למחוק את "${item.title}"?`)) {
              handleDeleteItem(item)
            }
          }
        }
      }
    }
    
    // Remove existing listener if any
    window.removeEventListener('message', handleMessage)
    // Add new listener
    window.addEventListener('message', handleMessage)
  }

  const handleAddItem = () => {
    const itemId = `${newItem.type}-${Date.now()}`
    
    // Special handling for quiz questions
    if (newItem.type === 'quiz') {
      // Add question to the questions array in the script
      const questionObj = {
        question: newItem.title,
        options: newItem.options || [],
        correct: newItem.correct || 0
      }
      
      const questionString = `            {
                question: "${questionObj.question}",
                options: [
                    "${questionObj.options[0] || ''}",
                    "${questionObj.options[1] || ''}",
                    "${questionObj.options[2] || ''}",
                    "${questionObj.options[3] || ''}"
                ],
                correct: ${questionObj.correct}
            }`
      
      // Find the questions array and add the new question
      const questionsMatch = content.match(/(const questions = \[)([\s\S]*?)(\];)/)
      if (questionsMatch) {
        const beforeQuestions = questionsMatch[1]
        const existingQuestions = questionsMatch[2]
        const afterQuestions = questionsMatch[3]
        
        const updatedQuestions = existingQuestions.trim() + 
          (existingQuestions.trim() ? ',\n' : '') + questionString
        
        const updatedContent = content.replace(
          /const questions = \[[\s\S]*?\];/,
          beforeQuestions + updatedQuestions + '\n        ' + afterQuestions
        )
        onChange(updatedContent)
      }
    } else {
      // Regular content item
      const itemHTML = generateItemHTML(newItem, itemId)
      
      // Find the appropriate section and add the item
      let updatedContent = content
      const sectionMap = {
        'program': 'programs',
        'faq': 'faq',
        'system': 'systems',
        'event': 'events',
        'document': 'documents'
      }
      
      const sectionId = sectionMap[newItem.type as keyof typeof sectionMap]
      if (sectionId) {
        const sectionRegex = new RegExp(`(<h2[^>]*id="${sectionId}"[^>]*>.*?</h2>)`, 'i')
        
        if (sectionRegex.test(updatedContent)) {
          updatedContent = updatedContent.replace(
            sectionRegex,
            `$1\n\n${itemHTML}`
          )
        } else {
          // If section doesn't exist, add it at the end
          const insertPoint = updatedContent.lastIndexOf('</div>')
          if (insertPoint > -1) {
            updatedContent = updatedContent.slice(0, insertPoint) + 
              `\n\n<h2 id="${sectionId}" style="color: #007bff; margin: 40px 0 20px;">${newItem.category}</h2>\n${itemHTML}\n\n` +
              updatedContent.slice(insertPoint)
          }
        }
      }
      
      onChange(updatedContent)
    }
    
    setNewItem({ 
      id: '', 
      type: 'program', 
      title: '', 
      description: '', 
      category: '',
      options: ['', '', '', ''],
      correct: 0
    })
    setShowAddModal(false)
  }

  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item)
  }

  const handleUpdateItem = () => {
    if (!editingItem) return

    if (editingItem.type === 'quiz') {
      // Update quiz question in the questions array
      const questionIndex = parseInt(editingItem.id.replace('quiz-question-', ''))
      const questionObj = {
        question: editingItem.title,
        options: editingItem.options || [],
        correct: editingItem.correct || 0
      }
      
      const questionString = `            {
                question: "${questionObj.question}",
                options: [
                    "${questionObj.options[0] || ''}",
                    "${questionObj.options[1] || ''}",
                    "${questionObj.options[2] || ''}",
                    "${questionObj.options[3] || ''}"
                ],
                correct: ${questionObj.correct}
            }`
      
      // Find and replace the specific question
      const questionsMatch = content.match(/(const questions = \[)([\s\S]*?)(\];)/)
      if (questionsMatch) {
        const questionsText = questionsMatch[2]
        const questionObjects = questionsText.split('},').map((q, index) => {
          if (index === questionIndex) {
            return questionString
          }
          return q.trim() + (index < questionsText.split('},').length - 1 ? '}' : '')
        })
        
        const updatedQuestions = questionObjects.join(',\n')
        const updatedContent = content.replace(
          /const questions = \[[\s\S]*?\];/,
          `const questions = [\n${updatedQuestions}\n        ];`
        )
        onChange(updatedContent)
      }
    } else {
      // Regular content item update
      let updatedContent = content
      const itemRegex = new RegExp(`<div[^>]*id="${editingItem.id}"[^>]*>.*?</div>(?:\\s*</div>)?`, 'gis')
      const newItemHTML = generateItemHTML(editingItem, editingItem.id)
      
      updatedContent = updatedContent.replace(itemRegex, newItemHTML)
      onChange(updatedContent)
    }
    
    setEditingItem(null)
  }

  const handleDeleteItem = (item: ContentItem) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את "${item.title}"?`)) {
      let updatedContent = content
      const itemRegex = new RegExp(`<div[^>]*id="${item.id}"[^>]*>.*?</div>(?:\\s*</div>)?`, 'gis')
      updatedContent = updatedContent.replace(itemRegex, '')
      onChange(updatedContent)
    }
  }

  const generateItemHTML = (item: ContentItem, id: string): string => {
    switch (item.type) {
      case 'program':
        return `
                <div id="${id}" class="dictionary-item">
                    <div class="term">${item.title}</div>
                    <div class="definition">
                        ${item.description}
                    </div>
                </div>`
      case 'faq':
        return `
                <div class="faq-card">
                    <div class="faq-question">${item.title}</div>
                    <div class="faq-answer">
                        ${item.description}
                    </div>
                </div>`
      case 'quiz':
        // Quiz questions are handled in JavaScript, return a comment
        return `<!-- Quiz question: ${item.title} -->`
      case 'system':
        return `
                <div id="${id}" class="dictionary-item">
                    <div class="term">${item.title}</div>
                    <div class="definition">
                        ${item.description}
                    </div>
                </div>`
      case 'event':
        return `
                <div id="${id}" class="dictionary-item">
                    <div class="term">${item.title}</div>
                    <div class="definition">
                        ${item.description}
                    </div>
                </div>`
      case 'document':
        return `
                <h3 id="${id}">${item.title}</h3>
                <p>${item.description}</p>`
      default:
        return `
                <div id="${id}" class="dictionary-item">
                    <div class="term">${item.title}</div>
                    <div class="definition">
                        ${item.description}
                    </div>
                </div>`
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <div className="flex gap-2">
          <button
            onClick={onToggleEditMode}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isEditMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isEditMode ? <Save size={18} /> : <Edit size={18} />}
            {isEditMode ? 'שמור' : 'עריכה'}
          </button>
          
          {isEditMode && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
            >
              <Plus size={18} />
              הוסף תוכן
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-gray-500" />
          <span className="text-gray-700">
            {isEditMode ? 'תצוגה מקדימה + עריכה ישירה' : 'תצוגה מקדימה'}
          </span>
          {isEditMode && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              העבר עכבר על תוכן לעריכה
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Items List (Edit Mode) */}
        {isEditMode && (
          <div className="w-1/3 bg-gray-50 border-r flex flex-col">
            {/* Fixed Header */}
            <div className="p-4 border-b bg-white">
              <h3 className="font-bold text-lg text-gray-800">תוכן האתר לעריכה</h3>
              <p className="text-sm text-gray-600 mt-1">
                {contentItems.length} פריטים נמצאו • גלול למטה לעוד תוכן
              </p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(
                contentItems.reduce((acc, item) => {
                  if (!acc[item.category || 'אחר']) acc[item.category || 'אחר'] = []
                  acc[item.category || 'אחר'].push(item)
                  return acc
                }, {} as Record<string, ContentItem[]>)
              ).map(([category, items]) => (
                <div key={category} className="mb-8">
                  <div className="sticky top-0 bg-gray-50 py-2 mb-3">
                    <h4 className="font-semibold text-blue-600 text-lg border-b border-blue-200 pb-1">
                      {category} ({items.length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white rounded-lg border hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 mb-2 text-base">
                              {item.title}
                            </h5>
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {item.description.length > 150 
                                ? `${item.description.substring(0, 150)}...` 
                                : item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                {item.type === 'program' ? 'תכנית' :
                                 item.type === 'faq' ? 'שאלה נפוצה' :
                                 item.type === 'system' ? 'מערכת' :
                                 item.type === 'event' ? 'אירוע' :
                                 item.type === 'quiz' ? 'שאלת מבחן' : 'מסמך'}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors border border-blue-200 hover:border-blue-300"
                                  title="ערוך פריט"
                                >
                                  <Edit size={14} className="inline mr-1" />
                                  ערוך
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item)}
                                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors border border-red-200 hover:border-red-300"
                                  title="מחק פריט"
                                >
                                  <Trash2 size={14} className="inline mr-1" />
                                  מחק
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {contentItems.length === 0 && (
                <div className="text-center text-gray-500 mt-12">
                  <div className="bg-gray-100 rounded-lg p-8">
                    <h4 className="text-lg font-medium mb-2">אין תוכן לעריכה</h4>
                    <p className="text-sm mb-4">לחץ על "הוסף תוכן" כדי להתחיל ליצור תוכן חדש</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      + הוסף תוכן ראשון
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className={`${isEditMode ? 'w-2/3' : 'w-full'} bg-white`}>
          <iframe
            ref={previewRef}
            className="w-full h-full border-none"
            title="תצוגה מקדימה"
          />
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">הוסף תוכן חדש</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">סוג התוכן</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({
                    ...newItem, 
                    type: e.target.value as ContentItem['type'],
                    category: e.target.value === 'program' ? 'תכניות' :
                             e.target.value === 'faq' ? 'שאלות נפוצות' :
                             e.target.value === 'system' ? 'מערכות' :
                             e.target.value === 'event' ? 'אירועים' :
                             e.target.value === 'quiz' ? 'שאלות מבחן' : 'מסמכים'
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="program">תכנית</option>
                  <option value="faq">שאלה נפוצה</option>
                  <option value="system">מערכת</option>
                  <option value="event">אירוע</option>
                  <option value="document">מסמך</option>
                  <option value="quiz">שאלת מבחן</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">כותרת</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="הכנס כותרת..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  {newItem.type === 'quiz' ? 'שאלה' : 'תיאור'}
                </label>
                <textarea
                  value={newItem.type === 'quiz' ? newItem.title : newItem.description}
                  onChange={(e) => newItem.type === 'quiz' 
                    ? setNewItem({...newItem, title: e.target.value})
                    : setNewItem({...newItem, description: e.target.value})
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg h-32 text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                  placeholder={newItem.type === 'quiz' ? "הכנס את השאלה..." : "הכנס תיאור מפורט..."}
                />
              </div>

              {newItem.type === 'quiz' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">אופציות תשובה</label>
                    {newItem.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={newItem.correct === index}
                          onChange={() => setNewItem({...newItem, correct: index})}
                          className="text-blue-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(newItem.options || [])]
                            newOptions[index] = e.target.value
                            setNewItem({...newItem, options: newOptions})
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder={`אופציה ${index + 1}`}
                        />
                      </div>
                    ))}
                    <p className="text-sm text-gray-600 mt-2">
                      בחר את התשובה הנכונה על ידי לחיצה על הרדיו כפתור
                    </p>
                  </div>
                </>
              )}

              {newItem.type !== 'quiz' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">תיאור</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg h-32 text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                    placeholder="הכנס תיאור מפורט..."
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.title || !newItem.description}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                הוסף
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">ערוך תוכן</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  {editingItem.type === 'quiz' ? 'שאלה' : 'כותרת'}
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {editingItem.type === 'quiz' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">אופציות תשובה</label>
                  {editingItem.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="edit-correct-answer"
                        checked={editingItem.correct === index}
                        onChange={() => setEditingItem({...editingItem, correct: index})}
                        className="text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(editingItem.options || [])]
                          newOptions[index] = e.target.value
                          setEditingItem({...editingItem, options: newOptions})
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder={`אופציה ${index + 1}`}
                      />
                    </div>
                  ))}
                  <p className="text-sm text-gray-600 mt-2">
                    בחר את התשובה הנכונה על ידי לחיצה על הרדיו כפתור
                  </p>
                </div>
              )}

              {editingItem.type !== 'quiz' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">תיאור</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg h-32 text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleUpdateItem}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                עדכן
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisualEditor