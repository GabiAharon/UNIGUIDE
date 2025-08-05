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
  type: 'program' | 'faq' | 'event' | 'system' | 'document' | 'quiz' | 'link' | 'button' | 'image' | 'video'
  title: string
  description: string
  category?: string
  options?: string[]
  correct?: number
  url?: string
  src?: string
  alt?: string
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
    console.log(`Found ${allDictionaryItems.length} dictionary items`)
    
    allDictionaryItems.forEach((item, index) => {
      const titleEl = item.querySelector('.term')
      const descEl = item.querySelector('.definition')
      
      // If no .term/.definition, try to extract from the content directly
      let title = ''
      let description = ''
      
      if (titleEl && descEl) {
        title = titleEl.textContent?.trim() || ''
        description = descEl.textContent?.trim() || descEl.innerHTML?.trim() || ''
      } else {
        // Fallback: extract from the whole content
        const fullText = item.textContent?.trim() || ''
        const lines = fullText.split('\n').filter(line => line.trim())
        title = lines[0] || `פריט ${index + 1}`
        description = lines.slice(1).join(' ').trim() || 'ללא תיאור'
      }
      
      if (title) {
        // Determine type based on ID or context
        let type: ContentItem['type'] = 'program'
        let category = 'תכניות'
        
        const itemId = item.id || item.getAttribute('id') || `item-${index}`
        const idLower = itemId.toLowerCase()
        const titleLower = title.toLowerCase()
        
        if (idLower.includes('salesforce') || idLower.includes('uninet') || idLower.includes('sharepoint') || 
            titleLower.includes('salesforce') || titleLower.includes('uninet') || titleLower.includes('sharepoint')) {
          type = 'system'
          category = 'מערכות'
        } else if (idLower.includes('student') || idLower.includes('health') || idLower.includes('charter') ||
                   titleLower.includes('אמנת') || titleLower.includes('הצהרת') || titleLower.includes('טופס')) {
          type = 'document'
          category = 'מסמכים'
        } else if (idLower.includes('mentor') || idLower.includes('fellow') || idLower.includes('training') ||
                   titleLower.includes('מנטור') || titleLower.includes('הכשרה') || titleLower.includes('הדרכה')) {
          type = 'event'
          category = 'הכשרות ואירועים'
        }

        items.push({
          id: itemId,
          type,
          title,
          description: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
          category
        })
      }
    })

    // Extract FAQ items
    const faqItems = doc.querySelectorAll('.faq-card')
    console.log(`Found ${faqItems.length} FAQ items`)
    
    faqItems.forEach((item, index) => {
      const questionEl = item.querySelector('.faq-question')
      const answerEl = item.querySelector('.faq-answer')
      
      let question = ''
      let answer = ''
      
      if (questionEl && answerEl) {
        question = questionEl.textContent?.trim() || ''
        answer = answerEl.textContent?.trim() || answerEl.innerHTML?.trim() || ''
      } else {
        // Fallback: try to extract from the whole content
        const fullText = item.textContent?.trim() || ''
        const parts = fullText.split('\n').filter(part => part.trim())
        question = parts[0] || `שאלה ${index + 1}`
        answer = parts.slice(1).join(' ').trim() || 'ללא תשובה'
      }
      
      if (question) {
        items.push({
          id: `faq-${index}`,
          type: 'faq',
          title: question,
          description: answer.substring(0, 300) + (answer.length > 300 ? '...' : ''),
          category: 'שאלות נפוצות'
        })
      }
    })

    // Extract headers as editable items
    const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    console.log(`Found ${headers.length} headers`)
    
    headers.forEach((header, index) => {
      const headerText = header.textContent?.trim() || ''
      const headerId = header.id || `header-${index}`
      
      if (headerText && headerText.length > 2) { // Skip very short headers
        let category = 'כותרות וחלקים'
        let type: ContentItem['type'] = 'document'
        
        // Determine category based on header text
        if (headerText.includes('תכנית') || headerText.includes('תכניות')) {
          category = 'תכניות'
          type = 'program'
        } else if (headerText.includes('שאלות נפוצות') || headerText.includes('שו"ת')) {
          category = 'שאלות נפוצות'
          type = 'faq'
        } else if (headerText.includes('מערכת') || headerText.includes('מערכות')) {
          category = 'מערכות'
          type = 'system'
        } else if (headerText.includes('אירוע') || headerText.includes('אירועים') || 
                   headerText.includes('הכשרה') || headerText.includes('הדרכה')) {
          category = 'אירועים'
          type = 'event'
        }

        // Don't add if we already have this exact title
        const existingItem = items.find(item => item.title === headerText)
        if (!existingItem) {
          items.push({
            id: headerId,
            type,
            title: headerText,
            description: `כותרת מסוג ${header.tagName}`,
            category
          })
        }
      }
    })

    // Extract quiz questions if this is quiz.html
    if (htmlContent.includes('const questions = [')) {
      console.log('Parsing quiz questions...')
      const scriptMatch = htmlContent.match(/const questions = \[([\s\S]*?)\];/)
      if (scriptMatch) {
        try {
          // More robust parsing - split by question objects
          const questionsText = scriptMatch[1]
          
          // Split by closing brace + comma pattern to separate questions
          const questionBlocks = questionsText.split(/\},\s*\{/)
          
          questionBlocks.forEach((block, index) => {
            // Clean up the block - add missing braces
            let cleanBlock = block.trim()
            if (!cleanBlock.startsWith('{')) {
              cleanBlock = '{' + cleanBlock
            }
            if (!cleanBlock.endsWith('}')) {
              cleanBlock = cleanBlock + '}'
            }
            
            // Extract question text
            const questionMatch = cleanBlock.match(/question:\s*["'](.*?)["']/)
            
            // Extract options array
            const optionsMatch = cleanBlock.match(/options:\s*\[([\s\S]*?)\]/)
            
            // Extract correct answer
            const correctMatch = cleanBlock.match(/correct:\s*(\d+)/)
            
            if (questionMatch) {
              const questionText = questionMatch[1]
              let options: string[] = []
              let correct = 0
              
              if (optionsMatch) {
                const optionsText = optionsMatch[1]
                // Split options more carefully, handling quotes and commas
                options = optionsText
                  .split(/",\s*"/)
                  .map(opt => opt.trim().replace(/^["']|["']$/g, ''))
                  .filter(opt => opt.length > 0)
              }
              
              if (correctMatch) {
                correct = parseInt(correctMatch[1])
              }
              
              if (questionText && options.length > 0) {
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
            }
          })
          
          console.log(`Found ${items.filter(item => item.type === 'quiz').length} quiz questions`)
        } catch (error) {
          console.error('Error parsing quiz questions:', error)
        }
      }
    }

    // Extract links (a tags) - but skip navigation links
    const links = doc.querySelectorAll('a[href]')
    console.log(`Found ${links.length} links`)
    
    links.forEach((link, index) => {
      const href = link.getAttribute('href') || ''
      const linkText = link.textContent?.trim() || ''
      const linkId = link.id || `link-${index}`
      
      // Skip navigation links that are just anchors
      const isNavLink = href.startsWith('#') && linkText.length < 50
      
      if (linkText && href && !isNavLink) {
        items.push({
          id: linkId,
          type: 'link',
          title: linkText,
          description: `קישור ל: ${href}`,
          category: 'קישורים',
          url: href
        })
      }
    })

    // Extract buttons (button tags and styled elements)
    const buttons = doc.querySelectorAll('button, .quiz-button, .ready-button, .category-btn, .collapsible-button')
    console.log(`Found ${buttons.length} buttons`)
    
    buttons.forEach((button, index) => {
      const buttonText = button.textContent?.trim() || ''
      const buttonHref = button.getAttribute('href') || ''
      const buttonOnclick = button.getAttribute('onclick') || ''
      const buttonId = button.id || `button-${index}`
      
      if (buttonText && buttonText.length < 100) { // Skip very long text that's not really a button
        let action = ''
        if (buttonHref) action = buttonHref
        else if (buttonOnclick) action = buttonOnclick
        
        items.push({
          id: buttonId,
          type: 'button',
          title: buttonText,
          description: action ? `כפתור עם פעולה: ${action}` : 'כפתור',
          category: 'כפתורים',
          url: action
        })
      }
    })

    // Extract images
    const images = doc.querySelectorAll('img')
    console.log(`Found ${images.length} images`)
    
    images.forEach((img, index) => {
      const src = img.getAttribute('src') || ''
      const alt = img.getAttribute('alt') || ''
      const title = img.getAttribute('title') || alt || `תמונה ${index + 1}`
      const imgId = img.id || `img-${index}`
      
      if (src) {
        items.push({
          id: imgId,
          type: 'image',
          title,
          description: `תמונה: ${src}`,
          category: 'תמונות',
          src,
          alt
        })
      }
    })

    // Extract videos (video tags and iframe embeds)
    const videos = doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="video"]')
    console.log(`Found ${videos.length} videos`)
    
    videos.forEach((video, index) => {
      const src = video.getAttribute('src') || ''
      const title = video.getAttribute('title') || `סרטון ${index + 1}`
      const videoId = video.id || `video-${index}`
      
      if (src) {
        items.push({
          id: videoId,
          type: 'video',
          title,
          description: `סרטון: ${src}`,
          category: 'סרטונים',
          src
        })
      }
    })

    console.log(`Total items found: ${items.length}`)
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
    
    // Add edit buttons to ALL dictionary items (with or without ID)
    modifiedContent = modifiedContent.replace(
      /<div([^>]*class="dictionary-item"[^>]*?)>([\s\S]*?)<\/div>/g,
      (match, attributes, innerContent) => {
        // Extract ID if exists
        const idMatch = attributes.match(/id="([^"]*)"/)
        const id = idMatch ? idMatch[1] : null
        
        // Try to find item by ID or by content matching
        let item = null
        if (id) {
          item = contentItems.find(item => item.id === id)
        }
        
        // If no ID match, try to match by content
        if (!item) {
          const termMatch = innerContent.match(/<div class="term">(.*?)<\/div>/)
          if (termMatch) {
            const termText = termMatch[1].trim()
            item = contentItems.find(item => item.title.trim() === termText)
          }
        }
        
        // If still no match, create a temporary item
        if (!item) {
          const termMatch = innerContent.match(/<div class="term">(.*?)<\/div>/)
          const defMatch = innerContent.match(/<div class="definition">(.*?)<\/div>/)
          if (termMatch) {
            const tempId = `temp-${Date.now()}-${Math.random()}`
            item = {
              id: tempId,
              type: 'program' as const,
              title: termMatch[1].trim(),
              description: defMatch ? defMatch[1].trim() : '',
              category: 'תכניות'
            }
            // Add to contentItems temporarily
            contentItems.push(item)
          }
        }
        
        if (item) {
          return `<div${attributes} style="position: relative; border: 2px dashed transparent; padding: 15px; margin: 10px 0; transition: all 0.3s; border-radius: 8px;" 
            onmouseover="this.style.border='2px dashed #3b82f6'; this.style.backgroundColor='#f0f9ff'; this.querySelector('.edit-controls').style.display='flex';" 
            onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
            ${innerContent}
            <div style="position: absolute; top: 8px; right: 8px; display: none; gap: 8px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${item.id}'}, '*')" 
                style="background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#2563eb';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#3b82f6';">
                ✏️ ערוך
              </button>
              <button onclick="window.parent.postMessage({action: 'delete', id: '${item.id}'}, '*')" 
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
    
    // Add edit buttons to ALL FAQ cards
    modifiedContent = modifiedContent.replace(
      /<div([^>]*class="faq-card"[^>]*)>([\s\S]*?)<\/div>/g,
      (match, attributes, innerContent, index) => {
        // Try to find FAQ item by question text
        const faqQuestionMatch = innerContent.match(/<div class="faq-question">(.*?)<\/div>/)
        let faqItem = null
        
        if (faqQuestionMatch) {
          const questionText = faqQuestionMatch[1].trim()
          faqItem = contentItems.find(item => item.title.trim() === questionText && item.type === 'faq')
        }
        
        // If no match found, create temporary item
        if (!faqItem && faqQuestionMatch) {
          const answerMatch = innerContent.match(/<div class="faq-answer">(.*?)<\/div>/)
          const tempId = `temp-faq-${Date.now()}-${Math.random()}`
          faqItem = {
            id: tempId,
            type: 'faq' as const,
            title: faqQuestionMatch[1].trim(),
            description: answerMatch ? answerMatch[1].trim() : '',
            category: 'שאלות נפוצות'
          }
          contentItems.push(faqItem)
        }
        
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
        return match
      }
    )

    // Add edit buttons to ALL headers (h1, h2, h3, h4, h5, h6)
    modifiedContent = modifiedContent.replace(
      /<(h[1-6])([^>]*?)>(.*?)<\/h[1-6]>/g,
      (match, tag, attributes, innerText) => {
        // Extract ID if exists
        const idMatch = attributes.match(/id="([^"]*)"/)
        const id = idMatch ? idMatch[1] : null
        
        // Try to find header item
        let headerItem = null
        if (id) {
          headerItem = contentItems.find(item => item.id === id)
        }
        
        // If no ID match, try to match by text
        if (!headerItem) {
          const headerText = innerText.trim()
          headerItem = contentItems.find(item => item.title.trim() === headerText)
        }
        
        // If still no match, create temporary item
        if (!headerItem && innerText.trim().length > 2) {
          const tempId = id || `temp-header-${Date.now()}-${Math.random()}`
          headerItem = {
            id: tempId,
            type: 'document' as const,
            title: innerText.trim(),
            description: `כותרת מסוג ${tag.toUpperCase()}`,
            category: 'כותרות וחלקים'
          }
          contentItems.push(headerItem)
        }
        
        if (headerItem) {
          const newAttributes = id ? attributes : `${attributes} id="${headerItem.id}"`
          return `<${tag}${newAttributes} style="position: relative; border: 2px dashed transparent; padding: 10px; margin: 15px 0; transition: all 0.3s; border-radius: 8px;" 
            onmouseover="this.style.border='2px dashed #f59e0b'; this.style.backgroundColor='#fffbeb'; this.querySelector('.edit-controls').style.display='flex';" 
            onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
            ${innerText}
            <div style="position: absolute; top: 5px; right: 5px; display: none; gap: 6px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${headerItem.id}'}, '*')" 
                style="background: #f59e0b; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#d97706';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#f59e0b';">
                ✏️ ערוך כותרת
              </button>
              <button onclick="window.parent.postMessage({action: 'delete', id: '${headerItem.id}'}, '*')" 
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

    // Add edit buttons to links
    modifiedContent = modifiedContent.replace(
      /<a([^>]*href="([^"]*)"[^>]*)>(.*?)<\/a>/g,
      (match, attributes, href, innerText) => {
        // Extract ID if exists or create one
        const idMatch = attributes.match(/id="([^"]*)"/)
        const id = idMatch ? idMatch[1] : null
        
        // Find link item
        let linkItem = null
        if (id) {
          linkItem = contentItems.find(item => item.id === id && item.type === 'link')
        }
        
        // If no match, try to find by text and href
        if (!linkItem) {
          const linkText = innerText.trim()
          linkItem = contentItems.find(item => 
            item.type === 'link' && 
            item.title.trim() === linkText && 
            item.url === href
          )
        }
        
        // Create temporary item if needed
        if (!linkItem) {
          const tempId = id || `temp-link-${Date.now()}-${Math.random()}`
          linkItem = {
            id: tempId,
            type: 'link' as const,
            title: innerText.trim(),
            description: `קישור ל: ${href}`,
            category: 'קישורים',
            url: href
          }
          contentItems.push(linkItem)
        }
        
        if (linkItem) {
          const newAttributes = id ? attributes : `${attributes} id="${linkItem.id}"`
          return `<a${newAttributes} style="position: relative; display: inline-block; border: 2px dashed transparent; padding: 5px; margin: 2px; transition: all 0.3s; border-radius: 4px;" 
            onmouseover="this.style.border='2px dashed #8b5cf6'; this.style.backgroundColor='#f3f4f6'; this.querySelector('.edit-controls').style.display='flex';" 
            onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
            ${innerText}
            <div style="position: absolute; top: -5px; right: -5px; display: none; gap: 4px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${linkItem.id}'}, '*')" 
                style="background: #8b5cf6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#7c3aed';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#8b5cf6';">
                🔗 ערוך קישור
              </button>
            </div>
          </a>`
        }
        return match
      }
    )

    // Add edit buttons to regular buttons
    modifiedContent = modifiedContent.replace(
      /<button([^>]*)>(.*?)<\/button>/g,
      (match, attributes, innerText) => {
        const idMatch = attributes.match(/id="([^"]*)"/)
        const id = idMatch ? idMatch[1] : null
        
        let buttonItem = null
        if (id) {
          buttonItem = contentItems.find(item => item.id === id && item.type === 'button')
        }
        
        if (!buttonItem) {
          const buttonText = innerText.trim()
          buttonItem = contentItems.find(item => 
            item.type === 'button' && 
            item.title.trim() === buttonText
          )
        }
        
        if (!buttonItem) {
          const tempId = id || `temp-button-${Date.now()}-${Math.random()}`
          const onclick = attributes.match(/onclick="([^"]*)"/)
          buttonItem = {
            id: tempId,
            type: 'button' as const,
            title: innerText.trim(),
            description: onclick ? `כפתור עם פעולה: ${onclick[1]}` : 'כפתור',
            category: 'כפתורים',
            url: onclick ? onclick[1] : ''
          }
          contentItems.push(buttonItem)
        }
        
        if (buttonItem) {
          const newAttributes = id ? attributes : `${attributes} id="${buttonItem.id}"`
          return `<div style="position: relative; display: inline-block; margin: 5px;">
            <button${newAttributes} style="border: 2px dashed transparent; transition: all 0.3s; border-radius: 4px;" 
              onmouseover="this.style.border='2px dashed #ec4899'; this.parentElement.querySelector('.edit-controls').style.display='flex';" 
              onmouseout="this.style.border='2px dashed transparent'; this.parentElement.querySelector('.edit-controls').style.display='none';">
              ${innerText}
            </button>
            <div style="position: absolute; top: -10px; right: -10px; display: none; gap: 4px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${buttonItem.id}'}, '*')" 
                style="background: #ec4899; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#db2777';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#ec4899';">
                🔘 ערוך כפתור
              </button>
            </div>
          </div>`
        }
        return match
      }
    )

    // Add edit buttons to styled button links (quiz-button, ready-button, etc.)
    modifiedContent = modifiedContent.replace(
      /<a([^>]*class="[^"]*(?:quiz-button|ready-button|category-btn|collapsible-button)[^"]*"[^>]*)>(.*?)<\/a>/g,
      (match, attributes, innerText) => {
        const idMatch = attributes.match(/id="([^"]*)"/)
        const hrefMatch = attributes.match(/href="([^"]*)"/)
        const onclickMatch = attributes.match(/onclick="([^"]*)"/)
        const id = idMatch ? idMatch[1] : null
        const href = hrefMatch ? hrefMatch[1] : ''
        const onclick = onclickMatch ? onclickMatch[1] : ''
        
        let buttonItem = null
        if (id) {
          buttonItem = contentItems.find(item => item.id === id && item.type === 'button')
        }
        
        if (!buttonItem) {
          const buttonText = innerText.trim()
          buttonItem = contentItems.find(item => 
            item.type === 'button' && 
            item.title.trim() === buttonText
          )
        }
        
        if (!buttonItem) {
          const tempId = id || `temp-styled-button-${Date.now()}-${Math.random()}`
          const action = href || onclick
          buttonItem = {
            id: tempId,
            type: 'button' as const,
            title: innerText.trim(),
            description: action ? `כפתור עם פעולה: ${action}` : 'כפתור מעוצב',
            category: 'כפתורים',
            url: action
          }
          contentItems.push(buttonItem)
        }
        
        if (buttonItem) {
          const newAttributes = id ? attributes : `${attributes} id="${buttonItem.id}"`
          return `<div style="position: relative; display: inline-block; margin: 5px;">
            <a${newAttributes} style="position: relative; border: 2px dashed transparent; transition: all 0.3s; border-radius: 4px; display: inline-block;" 
              onmouseover="this.style.border='2px dashed #ec4899'; this.parentElement.querySelector('.edit-controls').style.display='flex';" 
              onmouseout="this.style.border='2px dashed transparent'; this.parentElement.querySelector('.edit-controls').style.display='none';">
              ${innerText}
            </a>
            <div style="position: absolute; top: -10px; right: -10px; display: none; gap: 4px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${buttonItem.id}'}, '*')" 
                style="background: #ec4899; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#db2777';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#ec4899';">
                🔘 ערוך כפתור
              </button>
            </div>
          </div>`
        }
        return match
      }
    )

    // Add edit buttons to images
    modifiedContent = modifiedContent.replace(
      /<img([^>]*src="([^"]*)"[^>]*)>/g,
      (match, attributes, src) => {
        const idMatch = attributes.match(/id="([^"]*)"/)
        const altMatch = attributes.match(/alt="([^"]*)"/)
        const id = idMatch ? idMatch[1] : null
        const alt = altMatch ? altMatch[1] : ''
        
        let imgItem = null
        if (id) {
          imgItem = contentItems.find(item => item.id === id && item.type === 'image')
        }
        
        if (!imgItem) {
          imgItem = contentItems.find(item => 
            item.type === 'image' && 
            item.src === src
          )
        }
        
        if (!imgItem) {
          const tempId = id || `temp-img-${Date.now()}-${Math.random()}`
          imgItem = {
            id: tempId,
            type: 'image' as const,
            title: alt || `תמונה`,
            description: `תמונה: ${src}`,
            category: 'תמונות',
            src,
            alt
          }
          contentItems.push(imgItem)
        }
        
        if (imgItem) {
          const newAttributes = id ? attributes : `${attributes} id="${imgItem.id}"`
          return `<div style="position: relative; display: inline-block; border: 2px dashed transparent; padding: 5px; margin: 5px; transition: all 0.3s; border-radius: 8px;" 
            onmouseover="this.style.border='2px dashed #06b6d4'; this.style.backgroundColor='#f0f9ff'; this.querySelector('.edit-controls').style.display='flex';" 
            onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
            <img${newAttributes}>
            <div style="position: absolute; top: 5px; right: 5px; display: none; gap: 4px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${imgItem.id}'}, '*')" 
                style="background: #06b6d4; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#0891b2';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#06b6d4';">
                🖼️ ערוך תמונה
              </button>
            </div>
          </div>`
        }
        return match
      }
    )

    // Add edit buttons to videos (iframe embeds)
    modifiedContent = modifiedContent.replace(
      /<iframe([^>]*src="([^"]*)"[^>]*)><\/iframe>/g,
      (match, attributes, src) => {
        const idMatch = attributes.match(/id="([^"]*)"/)
        const titleMatch = attributes.match(/title="([^"]*)"/)
        const id = idMatch ? idMatch[1] : null
        const title = titleMatch ? titleMatch[1] : 'סרטון'
        
        let videoItem = null
        if (id) {
          videoItem = contentItems.find(item => item.id === id && item.type === 'video')
        }
        
        if (!videoItem) {
          videoItem = contentItems.find(item => 
            item.type === 'video' && 
            item.src === src
          )
        }
        
        if (!videoItem) {
          const tempId = id || `temp-video-${Date.now()}-${Math.random()}`
          videoItem = {
            id: tempId,
            type: 'video' as const,
            title,
            description: `סרטון: ${src}`,
            category: 'סרטונים',
            src
          }
          contentItems.push(videoItem)
        }
        
        if (videoItem) {
          const newAttributes = id ? attributes : `${attributes} id="${videoItem.id}"`
          return `<div style="position: relative; display: inline-block; border: 2px dashed transparent; padding: 5px; margin: 5px; transition: all 0.3s; border-radius: 8px;" 
            onmouseover="this.style.border='2px dashed #dc2626'; this.style.backgroundColor='#fef2f2'; this.querySelector('.edit-controls').style.display='flex';" 
            onmouseout="this.style.border='2px dashed transparent'; this.style.backgroundColor='transparent'; this.querySelector('.edit-controls').style.display='none';">
            <iframe${newAttributes}></iframe>
            <div style="position: absolute; top: 5px; right: 5px; display: none; gap: 4px; z-index: 1000;" class="edit-controls">
              <button onclick="window.parent.postMessage({action: 'edit', id: '${videoItem.id}'}, '*')" 
                style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;" 
                onmouseover="this.style.transform='scale(1.05)'; this.style.backgroundColor='#b91c1c';" 
                onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#dc2626';">
                🎥 ערוך סרטון
              </button>
            </div>
          </div>`
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
                              <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                                item.type === 'program' ? 'bg-blue-100 text-blue-800' :
                                item.type === 'faq' ? 'bg-green-100 text-green-800' :
                                item.type === 'system' ? 'bg-purple-100 text-purple-800' :
                                item.type === 'event' ? 'bg-orange-100 text-orange-800' :
                                item.type === 'quiz' ? 'bg-red-100 text-red-800' :
                                item.type === 'link' ? 'bg-violet-100 text-violet-800' :
                                item.type === 'button' ? 'bg-pink-100 text-pink-800' :
                                item.type === 'image' ? 'bg-cyan-100 text-cyan-800' :
                                item.type === 'video' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.type === 'program' ? 'תכנית' :
                                 item.type === 'faq' ? 'שאלה נפוצה' :
                                 item.type === 'system' ? 'מערכת' :
                                 item.type === 'event' ? 'אירוע' :
                                 item.type === 'quiz' ? 'שאלת מבחן' :
                                 item.type === 'link' ? 'קישור' :
                                 item.type === 'button' ? 'כפתור' :
                                 item.type === 'image' ? 'תמונה' :
                                 item.type === 'video' ? 'סרטון' : 'מסמך'}
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
                             e.target.value === 'quiz' ? 'שאלות מבחן' :
                             e.target.value === 'link' ? 'קישורים' :
                             e.target.value === 'button' ? 'כפתורים' :
                             e.target.value === 'image' ? 'תמונות' :
                             e.target.value === 'video' ? 'סרטונים' : 'מסמכים'
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="program">תכנית</option>
                  <option value="faq">שאלה נפוצה</option>
                  <option value="system">מערכת</option>
                  <option value="event">אירוע</option>
                  <option value="document">מסמך</option>
                  <option value="quiz">שאלת מבחן</option>
                  <option value="link">קישור</option>
                  <option value="button">כפתור</option>
                  <option value="image">תמונה</option>
                  <option value="video">סרטון</option>
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

              {/* URL field for links and buttons */}
              {(newItem.type === 'link' || newItem.type === 'button') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {newItem.type === 'link' ? 'קישור (URL)' : 'פעולה/קישור'}
                  </label>
                  <input
                    type="text"
                    value={newItem.url || ''}
                    onChange={(e) => setNewItem({...newItem, url: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={newItem.type === 'link' ? "https://example.com" : "onclick או href"}
                  />
                </div>
              )}

              {/* Source field for images and videos */}
              {(newItem.type === 'image' || newItem.type === 'video') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {newItem.type === 'image' ? 'מקור תמונה (src)' : 'מקור סרטון (src)'}
                  </label>
                  <input
                    type="text"
                    value={newItem.src || ''}
                    onChange={(e) => setNewItem({...newItem, src: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={newItem.type === 'image' ? "path/to/image.jpg" : "https://youtube.com/embed/..."}
                  />
                </div>
              )}

              {/* Alt text for images */}
              {newItem.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">טקסט חלופי (Alt)</label>
                  <input
                    type="text"
                    value={newItem.alt || ''}
                    onChange={(e) => setNewItem({...newItem, alt: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="תיאור התמונה לנגישות..."
                  />
                </div>
              )}

              {/* Description field for non-quiz items */}
              {newItem.type !== 'quiz' && newItem.type !== 'image' && (
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

              {/* URL field for links and buttons */}
              {(editingItem.type === 'link' || editingItem.type === 'button') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {editingItem.type === 'link' ? 'קישור (URL)' : 'פעולה/קישור'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.url || ''}
                    onChange={(e) => setEditingItem({...editingItem, url: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={editingItem.type === 'link' ? "https://example.com" : "onclick או href"}
                  />
                </div>
              )}

              {/* Source field for images and videos */}
              {(editingItem.type === 'image' || editingItem.type === 'video') && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {editingItem.type === 'image' ? 'מקור תמונה (src)' : 'מקור סרטון (src)'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.src || ''}
                    onChange={(e) => setEditingItem({...editingItem, src: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={editingItem.type === 'image' ? "path/to/image.jpg" : "https://youtube.com/embed/..."}
                  />
                </div>
              )}

              {/* Alt text for images */}
              {editingItem.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">טקסט חלופי (Alt)</label>
                  <input
                    type="text"
                    value={editingItem.alt || ''}
                    onChange={(e) => setEditingItem({...editingItem, alt: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="תיאור התמונה לנגישות..."
                  />
                </div>
              )}

              {/* Description field for non-quiz items */}
              {editingItem.type !== 'quiz' && editingItem.type !== 'image' && (
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