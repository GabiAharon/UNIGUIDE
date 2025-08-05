/**
 * בדיקות אוטומטיות למערכת ניהול התוכן
 * וידוא שכל הפונקציות עובדות כמו שצריך
 */

const fs = require('fs').promises;
const path = require('path');

class SystemTester {
    constructor() {
        this.testResults = [];
        this.passed = 0;
        this.failed = 0;
    }

    async runAllTests() {
        console.log('🧪 מתחיל בדיקות מערכת...\n');

        // בדיקות קבצים
        await this.testFileStructure();
        await this.testConfigFiles();
        
        // בדיקות פונקציונליות
        await this.testContentManager();
        await this.testMCPIntegration();
        await this.testBuildProcess();
        
        // דוח סיכום
        this.printResults();
        
        return this.failed === 0;
    }

    // בדיקת מבנה קבצים
    async testFileStructure() {
        console.log('📁 בודק מבנה קבצים...');

        const requiredFiles = [
            'admin.html',
            'content-manager.js',
            'mcp-integration.js',
            'setup.js',
            'build-site.js',
            'package.json',
            'netlify.toml',
            'README.md'
        ];

        const requiredDirs = [
            'netlify-functions',
            'public',
            'templates'
        ];

        // בדיקת קבצים
        for (const file of requiredFiles) {
            try {
                await fs.access(file);
                this.addTest(`קובץ ${file} קיים`, true);
            } catch (error) {
                this.addTest(`קובץ ${file} קיים`, false, `קובץ לא נמצא: ${file}`);
            }
        }

        // בדיקת תיקיות
        for (const dir of requiredDirs) {
            try {
                const stat = await fs.stat(dir);
                if (stat.isDirectory()) {
                    this.addTest(`תיקיה ${dir} קיימת`, true);
                } else {
                    this.addTest(`תיקיה ${dir} קיימת`, false, `${dir} אינו תיקיה`);
                }
            } catch (error) {
                this.addTest(`תיקיה ${dir} קיימת`, false, `תיקיה לא נמצאה: ${dir}`);
            }
        }
    }

    // בדיקת קבצי הגדרות
    async testConfigFiles() {
        console.log('⚙️ בודק קבצי הגדרות...');

        // בדיקת package.json
        try {
            const packageContent = await fs.readFile('package.json', 'utf8');
            const packageData = JSON.parse(packageContent);
            
            this.addTest('package.json תקין', true);
            
            // בדיקת סקריפטים נדרשים
            const requiredScripts = ['dev', 'build', 'setup'];
            for (const script of requiredScripts) {
                if (packageData.scripts[script]) {
                    this.addTest(`סקריפט ${script} קיים`, true);
                } else {
                    this.addTest(`סקריפט ${script} קיים`, false, `חסר סקריפט: ${script}`);
                }
            }

        } catch (error) {
            this.addTest('package.json תקין', false, error.message);
        }

        // בדיקת netlify.toml
        try {
            const netlifyContent = await fs.readFile('netlify.toml', 'utf8');
            if (netlifyContent.includes('[build]') && netlifyContent.includes('functions')) {
                this.addTest('netlify.toml תקין', true);
            } else {
                this.addTest('netlify.toml תקין', false, 'חסרים הגדרות בסיסיות');
            }
        } catch (error) {
            this.addTest('netlify.toml תקין', false, error.message);
        }
    }

    // בדיקת מנהל התוכן
    async testContentManager() {
        console.log('📝 בודק מנהל תוכן...');

        try {
            const managerContent = await fs.readFile('content-manager.js', 'utf8');
            
            // בדיקת מחלקות ופונקציות עיקריות
            const requiredElements = [
                'class ContentManager',
                'addContent',
                'updateContent',
                'deleteContent',
                'addQuizQuestion',
                'uploadImage',
                'generateIndexHTML'
            ];

            for (const element of requiredElements) {
                if (managerContent.includes(element)) {
                    this.addTest(`פונקציה ${element} קיימת`, true);
                } else {
                    this.addTest(`פונקציה ${element} קיימת`, false, `חסרה פונקציה: ${element}`);
                }
            }

        } catch (error) {
            this.addTest('קובץ content-manager.js נגיש', false, error.message);
        }
    }

    // בדיקת אינטגרציית MCP
    async testMCPIntegration() {
        console.log('🔗 בודק אינטגרציית MCP...');

        try {
            const mcpContent = await fs.readFile('mcp-integration.js', 'utf8');
            
            const requiredElements = [
                'class MCPIntegration',
                'detectAvailableServers',
                'saveFile',
                'uploadImage',
                'publishSite',
                'syncData'
            ];

            for (const element of requiredElements) {
                if (mcpContent.includes(element)) {
                    this.addTest(`פונקציית MCP ${element} קיימת`, true);
                } else {
                    this.addTest(`פונקציית MCP ${element} קיימת`, false, `חסרה פונקציה: ${element}`);
                }
            }

        } catch (error) {
            this.addTest('קובץ mcp-integration.js נגיש', false, error.message);
        }
    }

    // בדיקת תהליך הבנייה
    async testBuildProcess() {
        console.log('🔨 בודק תהליך בנייה...');

        try {
            const buildContent = await fs.readFile('build-site.js', 'utf8');
            
            const requiredElements = [
                'class SiteBuilder',
                'buildIndexHTML',
                'buildQuizHTML',
                'buildSitemap',
                'generateDictionaryHTML'
            ];

            for (const element of requiredElements) {
                if (buildContent.includes(element)) {
                    this.addTest(`פונקציית בנייה ${element} קיימת`, true);
                } else {
                    this.addTest(`פונקציית בנייה ${element} קיימת`, false, `חסרה פונקציה: ${element}`);
                }
            }

        } catch (error) {
            this.addTest('קובץ build-site.js נגיש', false, error.message);
        }

        // בדיקת פונקציות Netlify
        const netlifyFunctions = [
            'netlify-functions/save-file.js',
            'netlify-functions/upload-image.js',
            'netlify-functions/deploy-site.js'
        ];

        for (const funcFile of netlifyFunctions) {
            try {
                const funcContent = await fs.readFile(funcFile, 'utf8');
                if (funcContent.includes('exports.handler')) {
                    this.addTest(`פונקציית Netlify ${path.basename(funcFile)} תקינה`, true);
                } else {
                    this.addTest(`פונקציית Netlify ${path.basename(funcFile)} תקינה`, false, 'חסר exports.handler');
                }
            } catch (error) {
                this.addTest(`פונקציית Netlify ${path.basename(funcFile)} נגישה`, false, error.message);
            }
        }
    }

    // בדיקת ממשק המשתמש
    async testUserInterface() {
        console.log('🖥️ בודק ממשק משתמש...');

        try {
            const adminContent = await fs.readFile('admin.html', 'utf8');
            
            const requiredElements = [
                'מערכת ניהול תוכן',
                'ניהול תוכן',
                'ניהול בחינות',
                'ניהול תמונות',
                'גיבוי ושחזור',
                'onclick="addNewContent()"',
                'onclick="addNewQuestion()"'
            ];

            for (const element of requiredElements) {
                if (adminContent.includes(element)) {
                    this.addTest(`רכיב UI "${element}" קיים`, true);
                } else {
                    this.addTest(`רכיב UI "${element}" קיים`, false, `חסר רכיב: ${element}`);
                }
            }

        } catch (error) {
            this.addTest('קובץ admin.html נגיש', false, error.message);
        }
    }

    // בדיקת תבניות
    async testTemplates() {
        console.log('📄 בודק תבניות...');

        const templateDir = 'templates';
        try {
            const files = await fs.readdir(templateDir);
            
            if (files.length > 0) {
                this.addTest('תיקיית תבניות מכילה קבצים', true);
                
                for (const file of files) {
                    if (file.endsWith('.html')) {
                        this.addTest(`תבנית ${file} נמצאה`, true);
                    }
                }
            } else {
                this.addTest('תיקיית תבניות מכילה קבצים', false, 'תיקיית תבניות ריקה');
            }

        } catch (error) {
            this.addTest('תיקיית תבניות נגישה', false, 'תיקיית templates לא נמצאה');
        }
    }

    // בדיקות אבטחה בסיסיות
    async testSecurity() {
        console.log('🔒 בודק אבטחה בסיסית...');

        // בדיקה שאין סיסמאות בקוד
        const filesToCheck = ['admin.html', 'content-manager.js', 'mcp-integration.js'];
        
        for (const file of filesToCheck) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const insecurePatterns = [
                    /password\s*[:=]\s*["'][^"']+["']/i,
                    /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
                    /secret\s*[:=]\s*["'][^"']+["']/i
                ];

                let hasIssues = false;
                for (const pattern of insecurePatterns) {
                    if (pattern.test(content)) {
                        hasIssues = true;
                        break;
                    }
                }

                this.addTest(`קובץ ${file} ללא סודות חשופים`, !hasIssues, 
                    hasIssues ? 'נמצאו פרטים רגישים בקוד' : '');

            } catch (error) {
                this.addTest(`בדיקת אבטחה ${file}`, false, error.message);
            }
        }
    }

    // הוספת תוצאת בדיקה
    addTest(name, passed, error = '') {
        this.testResults.push({ name, passed, error });
        if (passed) {
            this.passed++;
            console.log(`  ✅ ${name}`);
        } else {
            this.failed++;
            console.log(`  ❌ ${name}${error ? ': ' + error : ''}`);
        }
    }

    // הדפסת תוצאות
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 תוצאות הבדיקות');
        console.log('='.repeat(60));
        
        console.log(`✅ עברו: ${this.passed}`);
        console.log(`❌ נכשלו: ${this.failed}`);
        console.log(`📈 סה"כ: ${this.testResults.length}`);
        
        const successRate = Math.round((this.passed / this.testResults.length) * 100);
        console.log(`🎯 אחוז הצלחה: ${successRate}%`);

        if (this.failed > 0) {
            console.log('\n❌ בדיקות שנכשלו:');
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.name}${test.error ? ': ' + test.error : ''}`);
                });
        }

        console.log('\n' + (this.failed === 0 ? '🎉 כל הבדיקות עברו בהצלחה!' : '⚠️  יש בעיות שדורשות תיקון'));
    }

    // בדיקה מהירה
    async quickCheck() {
        console.log('⚡ בדיקה מהירה...\n');
        
        const essentialFiles = [
            'admin.html',
            'content-manager.js',
            'package.json'
        ];

        let allGood = true;
        
        for (const file of essentialFiles) {
            try {
                await fs.access(file);
                console.log(`✅ ${file}`);
            } catch (error) {
                console.log(`❌ ${file} - לא נמצא`);
                allGood = false;
            }
        }

        if (allGood) {
            console.log('\n🎉 הקבצים העיקריים קיימים!');
            console.log('הרץ "npm test" לבדיקה מלאה');
        } else {
            console.log('\n⚠️  חסרים קבצים עיקריים - הרץ "npm run setup"');
        }

        return allGood;
    }
}

// הרצת הבדיקות
if (require.main === module) {
    const tester = new SystemTester();
    
    // בדיקה אם התבקשה בדיקה מהירה
    if (process.argv.includes('--quick')) {
        tester.quickCheck();
    } else {
        tester.runAllTests().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = SystemTester;