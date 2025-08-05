/**
 * מודול אינטגרציה עם שרתי MCP
 * מאפשר שמירה, סנכרון ופרסום אוטומטי של התוכן
 */

class MCPIntegration {
    constructor() {
        this.isConnected = false;
        this.serverInfo = null;
        this.syncEnabled = true;
        this.init();
    }

    async init() {
        await this.detectAvailableServers();
        this.setupAutoSync();
    }

    // זיהוי שרתי MCP זמינים
    async detectAvailableServers() {
        try {
            console.log('מחפש שרתי MCP זמינים...');
            
            // בדיקת Netlify MCP
            if (await this.checkNetlifyMCP()) {
                this.serverInfo = { type: 'netlify', connected: true };
                this.isConnected = true;
                console.log('✅ מחובר לשרת Netlify MCP');
            }
            
            // בדיקת Filesystem MCP
            if (await this.checkFilesystemMCP()) {
                this.serverInfo = { 
                    ...this.serverInfo, 
                    filesystem: true,
                    type: this.serverInfo?.type || 'filesystem'
                };
                this.isConnected = true;
                console.log('✅ מחובר לשרת Filesystem MCP');
            }

            // בדיקת Memory MCP
            if (await this.checkMemoryMCP()) {
                this.serverInfo = { 
                    ...this.serverInfo, 
                    memory: true,
                    type: this.serverInfo?.type || 'memory'
                };
                console.log('✅ מחובר לשרת Memory MCP');
            }

        } catch (error) {
            console.error('שגיאה בזיהוי שרתי MCP:', error);
        }
    }

    // בדיקת זמינות Netlify MCP
    async checkNetlifyMCP() {
        try {
            // ניסיון לקרוא ל-Netlify API
            const response = await fetch('/api/netlify-check', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    // בדיקת זמינות Filesystem MCP
    async checkFilesystemMCP() {
        try {
            // בדיקה אם יש גישה לקבצים מקומיים
            return typeof window.showDirectoryPicker === 'function' || 
                   typeof window.webkitRequestFileSystem === 'function';
        } catch {
            return false;
        }
    }

    // בדיקת זמינות Memory MCP
    async checkMemoryMCP() {
        try {
            // בדיקה אם יש תמיכה במערכת זיכרון
            return typeof localStorage !== 'undefined' && 
                   typeof indexedDB !== 'undefined';
        } catch {
            return false;
        }
    }

    // שמירת קובץ באמצעות MCP
    async saveFile(filename, content, options = {}) {
        if (!this.isConnected) {
            throw new Error('לא מחובר לשרת MCP');
        }

        try {
            if (this.serverInfo.type === 'netlify') {
                return await this.saveViaNetlify(filename, content, options);
            } else if (this.serverInfo.filesystem) {
                return await this.saveViaFilesystem(filename, content, options);
            } else {
                return await this.saveViaMemory(filename, content, options);
            }
        } catch (error) {
            console.error('שגיאה בשמירת קובץ:', error);
            throw error;
        }
    }

    // שמירה באמצעות Netlify
    async saveViaNetlify(filename, content, options) {
        const response = await fetch('/api/save-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename,
                content,
                ...options
            })
        });

        if (!response.ok) {
            throw new Error(`שגיאה בשמירה ב-Netlify: ${response.statusText}`);
        }

        return await response.json();
    }

    // שמירה באמצעות Filesystem API
    async saveViaFilesystem(filename, content, options) {
        try {
            // שימוש ב-File System Access API אם זמין
            if (window.showSaveFilePicker) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'HTML files',
                        accept: { 'text/html': ['.html'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();

                return { success: true, filename };
            } else {
                // Fallback להורדה
                return this.downloadFile(filename, content);
            }
        } catch (error) {
            console.error('שגיאה בשמירה מקומית:', error);
            return this.downloadFile(filename, content);
        }
    }

    // שמירה בזיכרון מקומי
    async saveViaMemory(filename, content, options) {
        const key = `mcp-file-${filename}`;
        const data = {
            content,
            filename,
            savedAt: new Date().toISOString(),
            ...options
        };

        localStorage.setItem(key, JSON.stringify(data));
        
        return { success: true, filename, storage: 'localStorage' };
    }

    // הורדת קובץ
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        return { success: true, filename, method: 'download' };
    }

    // העלאת תמונה
    async uploadImage(file, options = {}) {
        if (!this.isConnected) {
            throw new Error('לא מחובר לשרת MCP');
        }

        try {
            // המרה ל-Base64
            const base64 = await this.fileToBase64(file);
            
            const imageData = {
                filename: file.name,
                content: base64,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                ...options
            };

            if (this.serverInfo.type === 'netlify') {
                return await this.uploadImageToNetlify(imageData);
            } else {
                return await this.saveImageLocally(imageData);
            }
        } catch (error) {
            console.error('שגיאה בהעלאת תמונה:', error);
            throw error;
        }
    }

    // העלאת תמונה ל-Netlify
    async uploadImageToNetlify(imageData) {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(imageData)
        });

        if (!response.ok) {
            throw new Error(`שגיאה בהעלאת תמונה: ${response.statusText}`);
        }

        return await response.json();
    }

    // שמירת תמונה מקומית
    async saveImageLocally(imageData) {
        const images = JSON.parse(localStorage.getItem('mcp-images') || '[]');
        const newImage = {
            id: Date.now().toString(),
            url: imageData.content,
            originalName: imageData.filename,
            type: imageData.type,
            size: imageData.size,
            uploadedAt: imageData.uploadedAt
        };

        images.push(newImage);
        localStorage.setItem('mcp-images', JSON.stringify(images));

        return {
            success: true,
            image: newImage,
            url: newImage.url
        };
    }

    // המרת קובץ ל-Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // פרסום באתר
    async publishSite(options = {}) {
        if (!this.isConnected || !this.serverInfo.type === 'netlify') {
            throw new Error('פרסום זמין רק עם חיבור ל-Netlify');
        }

        try {
            const response = await fetch('/api/deploy-site', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...options,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`שגיאה בפרסום: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('שגיאה בפרסום האתר:', error);
            throw error;
        }
    }

    // סנכרון אוטומטי
    setupAutoSync() {
        if (!this.syncEnabled) return;

        // סנכרון כל 5 דקות
        setInterval(async () => {
            try {
                await this.syncData();
            } catch (error) {
                console.error('שגיאה בסנכרון אוטומטי:', error);
            }
        }, 5 * 60 * 1000);

        // סנכרון בסגירת הדף
        window.addEventListener('beforeunload', () => {
            this.syncData();
        });
    }

    // סנכרון נתונים
    async syncData() {
        if (!this.isConnected) return;

        try {
            console.log('מסנכרן נתונים...');
            
            const contentData = localStorage.getItem('unistream-content');
            const quizData = localStorage.getItem('unistream-quiz');
            const imagesData = localStorage.getItem('unistream-images');

            if (contentData) {
                await this.saveFile('data/content.json', contentData);
            }

            if (quizData) {
                await this.saveFile('data/quiz.json', quizData);
            }

            if (imagesData) {
                await this.saveFile('data/images.json', imagesData);
            }

            console.log('✅ סנכרון הושלם בהצלחה');
        } catch (error) {
            console.error('שגיאה בסנכרון:', error);
        }
    }

    // קבלת סטטיסטיקות שרת
    async getServerStats() {
        if (!this.isConnected) {
            return { connected: false };
        }

        try {
            if (this.serverInfo.type === 'netlify') {
                const response = await fetch('/api/server-stats');
                return await response.json();
            } else {
                // סטטיסטיקות מקומיות
                return {
                    connected: true,
                    type: 'local',
                    storage: {
                        used: this.calculateLocalStorageUsage(),
                        available: this.getLocalStorageQuota()
                    }
                };
            }
        } catch (error) {
            console.error('שגיאה בקבלת סטטיסטיקות:', error);
            return { connected: false, error: error.message };
        }
    }

    // חישוב שימוש ב-localStorage
    calculateLocalStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return total;
    }

    // קבלת מכסת localStorage
    getLocalStorageQuota() {
        try {
            // ניסיון לחשב מכסה משוערת
            return 5 * 1024 * 1024; // 5MB משוער
        } catch {
            return null;
        }
    }

    // יצירת גיבוי באמצעות MCP
    async createCloudBackup() {
        if (!this.isConnected) {
            throw new Error('נדרש חיבור ל-MCP ליצירת גיבוי בענן');
        }

        const backupData = {
            content: JSON.parse(localStorage.getItem('unistream-content') || '[]'),
            quiz: JSON.parse(localStorage.getItem('unistream-quiz') || '[]'),
            images: JSON.parse(localStorage.getItem('unistream-images') || '[]'),
            metadata: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                serverInfo: this.serverInfo
            }
        };

        const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
        return await this.saveFile(`backups/${filename}`, JSON.stringify(backupData, null, 2));
    }

    // שחזור מגיבוי בענן
    async restoreFromCloudBackup(backupFilename) {
        if (!this.isConnected) {
            throw new Error('נדרש חיבור ל-MCP לשחזור מהענן');
        }

        try {
            const response = await fetch(`/api/get-backup/${backupFilename}`);
            if (!response.ok) {
                throw new Error('קובץ גיבוי לא נמצא');
            }

            const backupData = await response.json();
            
            if (backupData.content) {
                localStorage.setItem('unistream-content', JSON.stringify(backupData.content));
            }
            
            if (backupData.quiz) {
                localStorage.setItem('unistream-quiz', JSON.stringify(backupData.quiz));
            }
            
            if (backupData.images) {
                localStorage.setItem('unistream-images', JSON.stringify(backupData.images));
            }

            // עדכון התצוגה
            window.dispatchEvent(new CustomEvent('dataRestored'));

            return { success: true, filename: backupFilename };
        } catch (error) {
            console.error('שגיאה בשחזור מהענן:', error);
            throw error;
        }
    }

    // קבלת רשימת גיבויים בענן
    async getCloudBackups() {
        if (!this.isConnected) {
            return [];
        }

        try {
            const response = await fetch('/api/list-backups');
            return await response.json();
        } catch (error) {
            console.error('שגיאה בקבלת רשימת גיבויים:', error);
            return [];
        }
    }

    // ניתוק מהשרת
    disconnect() {
        this.isConnected = false;
        this.serverInfo = null;
        this.syncEnabled = false;
        console.log('התנתק מהשרת');
    }

    // איפוס חיבור
    async reconnect() {
        this.disconnect();
        await this.init();
        return this.isConnected;
    }

    // קבלת מידע על החיבור
    getConnectionInfo() {
        return {
            connected: this.isConnected,
            serverInfo: this.serverInfo,
            syncEnabled: this.syncEnabled
        };
    }
}

// יצירת instance גלובלי
window.mcpIntegration = new MCPIntegration();

// ייצוא המחלקה
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPIntegration;
}