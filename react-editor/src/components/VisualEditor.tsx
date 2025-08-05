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
  type: 'program' | 'faq' | 'event' | 'system' | 'document'
  title: string
  description: string
  category?: string
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
    category: ''
  })
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Parse content to extract items
  const parseContent = (htmlContent: string): ContentItem[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const items: ContentItem[] = []

    // Extract programs
    const programs = doc.querySelectorAll('#programs + .dictionary-item, .dictionary-item[id*="program"]')
    programs.forEach((item, index) => {
      const titleEl = item.querySelector('.term')
      const descEl = item.querySelector('.definition')
      if (titleEl && descEl) {
        items.push({
          id: item.id || `program-${index}`,
          type: 'program',
          title: titleEl.textContent || '',
          description: descEl.textContent || '',
          category: 'תכניות'
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
          title: questionEl.textContent || '',
          description: answerEl.textContent || '',
          category: 'שאלות נפוצות'
        })
      }
    })

    // Extract systems
    const systems = doc.querySelectorAll('#systems + .dictionary-item, .dictionary-item[id*="system"]')
    systems.forEach((item, index) => {
      const titleEl = item.querySelector('.term')
      const descEl = item.querySelector('.definition')
      if (titleEl && descEl) {
        items.push({
          id: item.id || `system-${index}`,
          type: 'system',
          title: titleEl.textContent || '',
          description: descEl.textContent || '',
          category: 'מערכות'
        })
      }
    })

    return items
  }

  const contentItems = parseContent(content)

  // Update preview
  useEffect(() => {
    if (previewRef.current) {
      const iframe = previewRef.current
      const doc = iframe.contentDocument
      if (doc) {
        doc.open()
        doc.write(content)
        doc.close()
      }
    }
  }, [content])

  const handleAddItem = () => {
    const itemId = `${newItem.type}-${Date.now()}`
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
    
    const sectionId = sectionMap[newItem.type]
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
    
    onChange(updatedContent)
    setNewItem({ id: '', type: 'program', title: '', description: '', category: '' })
    setShowAddModal(false)
  }

  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item)
  }

  const handleUpdateItem = () => {
    if (!editingItem) return

    let updatedContent = content
    const itemRegex = new RegExp(`<div[^>]*id="${editingItem.id}"[^>]*>.*?</div>(?:\\s*</div>)?`, 'gis')
    const newItemHTML = generateItemHTML(editingItem, editingItem.id)
    
    updatedContent = updatedContent.replace(itemRegex, newItemHTML)
    onChange(updatedContent)
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
      case 'system':
        return `
                <div id="${id}" class="dictionary-item">
                    <div class="term">${item.title}</div>
                    <div class="definition">
                        ${item.description}
                    </div>
                </div>`
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
          <span className="text-gray-700">תצוגה מקדימה</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex">
        {/* Items List (Edit Mode) */}
        {isEditMode && (
          <div className="w-1/3 bg-gray-50 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-bold text-lg mb-4">תוכן האתר</h3>
              
              {Object.entries(
                contentItems.reduce((acc, item) => {
                  if (!acc[item.category || 'אחר']) acc[item.category || 'אחר'] = []
                  acc[item.category || 'אחר'].push(item)
                  return acc
                }, {} as Record<string, ContentItem[]>)
              ).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-semibold text-blue-600 mb-2">{category}</h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white rounded-lg border hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">
                              {item.title}
                            </h5>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {item.description.substring(0, 100)}...
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">הוסף תוכן חדש</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">סוג התוכן</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({
                    ...newItem, 
                    type: e.target.value as ContentItem['type'],
                    category: e.target.value === 'program' ? 'תכניות' :
                             e.target.value === 'faq' ? 'שאלות נפוצות' :
                             e.target.value === 'system' ? 'מערכות' :
                             e.target.value === 'event' ? 'אירועים' : 'מסמכים'
                  })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="program">תכנית</option>
                  <option value="faq">שאלה נפוצה</option>
                  <option value="system">מערכת</option>
                  <option value="event">אירוע</option>
                  <option value="document">מסמך</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">כותרת</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="הכנס כותרת..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תיאור</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full p-2 border rounded-lg h-32"
                  placeholder="הכנס תיאור מפורט..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ביטול
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.title || !newItem.description}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
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
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">ערוך תוכן</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">כותרת</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תיאור</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full p-2 border rounded-lg h-32"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ביטול
              </button>
              <button
                onClick={handleUpdateItem}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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