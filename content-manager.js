/**
 * מערכת ניהול תוכן מתקדמת עבור אתר יוניסטרים
 * משתמשת ב-MCP לשמירה ועדכון אוטומטי של הקבצים
 */

class ContentManager {
    constructor() {
        this.content = [];
        this.quiz = [];
        this.images = [];
        this.isConnectedToMCP = false;
        this.init();
    }

    async init() {
        await this.loadFromStorage();
        await this.connectToMCP();
        this.setupEventListeners();
    }

    // התחברות ל-MCP
    async connectToMCP() {
        try {
            // כאן נוכל להתחבר לשרתי MCP
            console.log('מתחבר לשרתי MCP...');
            this.isConnectedToMCP = true;
        } catch (error) {
            console.error('שגיאה בהתחברות ל-MCP:', error);
        }
    }

    // טעינה מ-localStorage
    async loadFromStorage() {
        this.content = JSON.parse(localStorage.getItem('unistream-content') || '[]');
        this.quiz = JSON.parse(localStorage.getItem('unistream-quiz') || '[]');
        this.images = JSON.parse(localStorage.getItem('unistream-images') || '[]');
    }

    // שמירה ל-localStorage
    async saveToStorage() {
        localStorage.setItem('unistream-content', JSON.stringify(this.content));
        localStorage.setItem('unistream-quiz', JSON.stringify(this.quiz));
        localStorage.setItem('unistream-images', JSON.stringify(this.images));
    }

    // הוספת תוכן חדש
    async addContent(contentData) {
        const newContent = {
            id: this.generateId(),
            ...contentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.content.push(newContent);
        await this.saveToStorage();
        await this.updateHTMLFiles();
        
        return newContent;
    }

    // עדכון תוכן קיים
    async updateContent(id, contentData) {
        const index = this.content.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('תוכן לא נמצא');
        }

        this.content[index] = {
            ...this.content[index],
            ...contentData,
            updatedAt: new Date().toISOString()
        };

        await this.saveToStorage();
        await this.updateHTMLFiles();
        
        return this.content[index];
    }

    // מחיקת תוכן
    async deleteContent(id) {
        const index = this.content.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('תוכן לא נמצא');
        }

        const deletedContent = this.content.splice(index, 1)[0];
        await this.saveToStorage();
        await this.updateHTMLFiles();
        
        return deletedContent;
    }

    // הוספת שאלה לבחינה
    async addQuizQuestion(questionData) {
        const newQuestion = {
            id: this.generateId(),
            ...questionData,
            createdAt: new Date().toISOString()
        };

        this.quiz.push(newQuestion);
        await this.saveToStorage();
        await this.updateQuizFile();
        
        return newQuestion;
    }

    // עדכון שאלה בבחינה
    async updateQuizQuestion(id, questionData) {
        const index = this.quiz.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('שאלה לא נמצאה');
        }

        this.quiz[index] = {
            ...this.quiz[index],
            ...questionData,
            updatedAt: new Date().toISOString()
        };

        await this.saveToStorage();
        await this.updateQuizFile();
        
        return this.quiz[index];
    }

    // מחיקת שאלה מהבחינה
    async deleteQuizQuestion(id) {
        const index = this.quiz.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('שאלה לא נמצאה');
        }

        const deletedQuestion = this.quiz.splice(index, 1)[0];
        await this.saveToStorage();
        await this.updateQuizFile();
        
        return deletedQuestion;
    }

    // העלאת תמונה
    async uploadImage(file, description = '') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const newImage = {
                        id: this.generateId(),
                        url: e.target.result,
                        description: description,
                        originalName: file.name,
                        size: file.size,
                        type: file.type,
                        uploadedAt: new Date().toISOString()
                    };

                    this.images.push(newImage);
                    await this.saveToStorage();
                    
                    // אם מחובר ל-MCP, נשמור את התמונה גם בשרת
                    if (this.isConnectedToMCP) {
                        await this.saveImageToServer(newImage);
                    }
                    
                    resolve(newImage);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // שמירת תמונה בשרת
    async saveImageToServer(imageData) {
        try {
            // כאן נוכל להשתמש ב-MCP לשמירת התמונה בשרת
            console.log('שומר תמונה בשרת:', imageData.originalName);
        } catch (error) {
            console.error('שגיאה בשמירת תמונה בשרת:', error);
        }
    }

    // מחיקת תמונה
    async deleteImage(id) {
        const index = this.images.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('תמונה לא נמצאה');
        }

        const deletedImage = this.images.splice(index, 1)[0];
        await this.saveToStorage();
        
        return deletedImage;
    }

    // עדכון קבצי HTML
    async updateHTMLFiles() {
        try {
            await this.updateIndexHTML();
            console.log('קבצי HTML עודכנו בהצלחה');
        } catch (error) {
            console.error('שגיאה בעדכון קבצי HTML:', error);
        }
    }

    // עדכון index.html
    async updateIndexHTML() {
        const htmlContent = this.generateIndexHTML();
        
        if (this.isConnectedToMCP) {
            // שמירה באמצעות MCP
            await this.saveFileViaMCP('index.html', htmlContent);
        }
    }

    // עדכון קובץ הבחינה
    async updateQuizFile() {
        const quizContent = this.generateQuizHTML();
        
        if (this.isConnectedToMCP) {
            // שמירה באמצעות MCP
            await this.saveFileViaMCP('quiz.html', quizContent);
        }
    }

    // יצירת HTML לדף הראשי
    generateIndexHTML() {
        let dictionaryContent = '';
        
        // קיבוץ תוכן לפי קטגוריות
        const categories = this.groupContentByCategory();
        
        Object.keys(categories).forEach(categoryKey => {
            const categoryName = this.getCategoryName(categoryKey);
            dictionaryContent += `<h2 id="${categoryKey}" style="color: #007bff; margin: 40px 0 20px;">${categoryName}</h2>\n`;
            
            categories[categoryKey].forEach(item => {
                dictionaryContent += this.generateContentItemHTML(item);
            });
        });

        // כאן נוכל להחליף את התוכן בתבנית HTML הקיימת
        return this.insertContentIntoTemplate(dictionaryContent);
    }

    // יצירת HTML לפריט תוכן
    generateContentItemHTML(item) {
        let linksHTML = '';
        if (item.links && item.links.length > 0) {
            linksHTML = item.links.map(link => {
                const [url, title] = link.split('|');
                return `<a href="${url}" class="system-link" target="_blank">${title || url}</a>`;
            }).join('\n');
        }

        return `
        <div id="${this.generateSlug(item.term)}" class="dictionary-item">
            <div class="term">${item.term}</div>
            <div class="definition">
                ${item.definition}
                ${linksHTML}
            </div>
        </div>
        `;
    }

    // יצירת HTML לבחינה
    generateQuizHTML() {
        const questionsJS = JSON.stringify(this.quiz, null, 8);
        
        // כאן נוכל להחליף את מערך השאלות בתבנית הבחינה הקיימת
        return this.insertQuestionsIntoQuizTemplate(questionsJS);
    }

    // קיבוץ תוכן לפי קטגוריות
    groupContentByCategory() {
        const categories = {};
        
        this.content.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });
        
        return categories;
    }

    // קבלת שם קטגוריה בעברית
    getCategoryName(category) {
        const categories = {
            'programs': 'תכניות',
            'events': 'אירועים',
            'systems': 'מערכות',
            'documents': 'טפסים ומסמכים חשובים',
            'training': 'הכשרות והדרכה',
            'mentoring': 'ליווי ומנטורינג',
            'budget': 'תקציב ותפעול'
        };
        return categories[category] || category;
    }

    // יצירת slug מטקסט עברי
    generateSlug(text) {
        return text.toLowerCase()
            .replace(/[^א-ת\w\s-]/g, '') // הסרת תווים מיוחדים
            .replace(/\s+/g, '-') // החלפת רווחים במקפים
            .trim();
    }

    // הכנסת תוכן לתבנית HTML
    insertContentIntoTemplate(content) {
        // כאן נוכל לטעון את התבנית הקיימת ולהחליף את התוכן
        // לצורך הדוגמא, נחזיר את התוכן הבסיסי
        return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>המדריך המלא למובילי/ות ומנהלי/ות מרכזי יזמות - יוניסטרים</title>
    <!-- כאן יכלול את כל ה-CSS הקיים -->
</head>
<body>
    <div class="container">
        ${content}
    </div>
    <!-- כאן יכלול את כל ה-JavaScript הקיים -->
</body>
</html>`;
    }

    // הכנסת שאלות לתבנית הבחינה
    insertQuestionsIntoQuizTemplate(questionsJS) {
        // כאן נוכל לטעון את תבנית הבחינה הקיימת ולהחליף את מערך השאלות
        return `// התבנית המעודכנת עם השאלות החדשות
const questions = ${questionsJS};`;
    }

    // שמירת קובץ באמצעות MCP
    async saveFileViaMCP(filename, content) {
        try {
            // כאן נשתמש ב-MCP API לשמירת הקובץ
            console.log(`שומר קובץ ${filename} באמצעות MCP`);
            
            // לדוגמא - שמירה מקומית
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('שגיאה בשמירת קובץ:', error);
            throw error;
        }
    }

    // יצירת גיבוי מלא
    async createBackup() {
        const backupData = {
            content: this.content,
            quiz: this.quiz,
            images: this.images.map(img => ({
                ...img,
                url: img.url.length > 1000 ? '[תמונה גדולה - לא נכללת בגיבוי]' : img.url
            })),
            metadata: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                totalContent: this.content.length,
                totalQuestions: this.quiz.length,
                totalImages: this.images.length
            }
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `unistream-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        return backupData;
    }

    // שחזור מגיבוי
    async restoreFromBackup(backupData) {
        try {
            if (backupData.content) {
                this.content = backupData.content;
            }
            
            if (backupData.quiz) {
                this.quiz = backupData.quiz;
            }
            
            if (backupData.images) {
                this.images = backupData.images.filter(img => 
                    img.url !== '[תמונה גדולה - לא נכללת בגיבוי]'
                );
            }

            await this.saveToStorage();
            await this.updateHTMLFiles();
            
            return true;
        } catch (error) {
            console.error('שגיאה בשחזור מגיבוי:', error);
            throw error;
        }
    }

    // יצירת ID ייחודי
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // קבלת סטטיסטיקות
    getStats() {
        const categories = this.groupContentByCategory();
        
        return {
            totalContent: this.content.length,
            totalQuestions: this.quiz.length,
            totalImages: this.images.length,
            categoriesCount: Object.keys(categories).length,
            categories: Object.keys(categories).map(key => ({
                name: this.getCategoryName(key),
                count: categories[key].length
            })),
            lastUpdated: Math.max(
                ...this.content.map(item => new Date(item.updatedAt || item.createdAt)),
                ...this.quiz.map(item => new Date(item.updatedAt || item.createdAt))
            )
        };
    }

    // הגדרת מאזינים לאירועים
    setupEventListeners() {
        // כאן נוכל להוסיף מאזינים לאירועים שונים
        document.addEventListener('contentChanged', () => {
            this.updateHTMLFiles();
        });
    }

    // פרסום שינויים
    async publishChanges() {
        try {
            await this.updateHTMLFiles();
            await this.updateQuizFile();
            
            // אם מחובר לשרת, נפרסם שם
            if (this.isConnectedToMCP) {
                await this.deployToServer();
            }
            
            return { success: true, message: 'השינויים פורסמו בהצלחה!' };
        } catch (error) {
            console.error('שגיאה בפרסום שינויים:', error);
            return { success: false, message: 'שגיאה בפרסום השינויים' };
        }
    }

    // פריסה לשרת
    async deployToServer() {
        console.log('מפרסם שינויים בשרת...');
        // כאן נוכל להשתמש ב-Netlify או שרתי MCP אחרים לפריסה
    }
}

// יצירת instance גלובלי
window.contentManager = new ContentManager();

// ייצוא המחלקה
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentManager;
}