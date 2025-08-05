/**
 * GitHub Sync Tool - כלי סנכרון עם GitHub
 * חלופה לעריכה ישירה מהדפדפן במקרה של בעיות CORS
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
    githubToken: process.env.GITHUB_TOKEN || '',
    githubRepo: process.env.GITHUB_REPO || '',
    localFiles: ['index.html', 'quiz.html', 'secure-editor.html'],
    encoding: 'utf8'
};

class GitHubSync {
    constructor() {
        this.validateConfig();
    }

    validateConfig() {
        if (!CONFIG.githubToken) {
            console.error('❌ GitHub Token חסר!');
            console.log('הגדר את הטוקן: export GITHUB_TOKEN="your_token_here"');
            process.exit(1);
        }

        if (!CONFIG.githubRepo) {
            console.error('❌ GitHub Repository חסר!');
            console.log('הגדר את הרפו: export GITHUB_REPO="username/repository"');
            process.exit(1);
        }

        console.log('✅ הגדרות GitHub תקינות');
    }

    /**
     * Upload a file to GitHub
     */
    async uploadFile(filename) {
        try {
            console.log(`📤 מעלה ${filename} לגיטהאב...`);

            // Read local file
            const filePath = path.join(__dirname, filename);
            if (!fs.existsSync(filePath)) {
                throw new Error(`קובץ ${filename} לא נמצא`);
            }

            const content = fs.readFileSync(filePath, CONFIG.encoding);
            const encodedContent = Buffer.from(content).toString('base64');

            // Get current file SHA if exists
            let sha = null;
            try {
                const currentFile = await this.githubRequest(`/repos/${CONFIG.githubRepo}/contents/${filename}`, 'GET');
                sha = currentFile.sha;
                console.log(`📝 קובץ קיים נמצא, SHA: ${sha.substring(0, 7)}`);
            } catch (e) {
                console.log(`📄 קובץ חדש: ${filename}`);
            }

            // Upload/Update file
            const payload = {
                message: `עדכון ${filename} - ${new Date().toLocaleString('he-IL')}`,
                content: encodedContent,
                ...(sha && { sha })
            };

            const result = await this.githubRequest(`/repos/${CONFIG.githubRepo}/contents/${filename}`, 'PUT', payload);
            
            console.log(`✅ ${filename} הועלה בהצלחה!`);
            console.log(`🔗 ${result.content.html_url}`);

            return result;
        } catch (error) {
            console.error(`❌ שגיאה בהעלאת ${filename}:`, error.message);
            throw error;
        }
    }

    /**
     * Download a file from GitHub
     */
    async downloadFile(filename) {
        try {
            console.log(`📥 מוריד ${filename} מגיטהאב...`);

            const fileData = await this.githubRequest(`/repos/${CONFIG.githubRepo}/contents/${filename}`, 'GET');
            const content = Buffer.from(fileData.content, 'base64').toString(CONFIG.encoding);

            // Save to local file
            const filePath = path.join(__dirname, filename);
            fs.writeFileSync(filePath, content, CONFIG.encoding);

            console.log(`✅ ${filename} הורד בהצלחה!`);
            return content;
        } catch (error) {
            console.error(`❌ שגיאה בהורדת ${filename}:`, error.message);
            throw error;
        }
    }

    /**
     * Sync all configured files
     */
    async syncAll(direction = 'upload') {
        console.log(`🔄 מסנכרן כל הקבצים (${direction})...`);
        
        const results = [];
        for (const filename of CONFIG.localFiles) {
            try {
                if (direction === 'upload') {
                    await this.uploadFile(filename);
                } else {
                    await this.downloadFile(filename);
                }
                results.push({ filename, status: 'success' });
            } catch (error) {
                results.push({ filename, status: 'error', error: error.message });
            }
        }

        // Summary
        const successful = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'error').length;

        console.log('\n📊 סיכום סנכרון:');
        console.log(`✅ הצליח: ${successful}`);
        console.log(`❌ נכשל: ${failed}`);

        if (failed > 0) {
            console.log('\n❌ שגיאות:');
            results.filter(r => r.status === 'error').forEach(r => {
                console.log(`  ${r.filename}: ${r.error}`);
            });
        }

        return results;
    }

    /**
     * Watch for file changes and auto-sync
     */
    watchFiles() {
        console.log('👁️ מתחיל לעקוב אחר שינויים בקבצים...');
        console.log('לחץ Ctrl+C להפסקה\n');

        CONFIG.localFiles.forEach(filename => {
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                fs.watchFile(filePath, { interval: 1000 }, async (curr, prev) => {
                    if (curr.mtime > prev.mtime) {
                        console.log(`🔄 ${filename} השתנה, מסנכרן...`);
                        try {
                            await this.uploadFile(filename);
                        } catch (error) {
                            console.error(`❌ שגיאה בסנכרון ${filename}:`, error.message);
                        }
                    }
                });
                console.log(`👀 עוקב אחר: ${filename}`);
            }
        });
    }

    /**
     * Make GitHub API request
     */
    async githubRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                port: 443,
                path: endpoint,
                method: method,
                headers: {
                    'Authorization': `token ${CONFIG.githubToken}`,
                    'User-Agent': 'UNIGuide-Editor/1.0',
                    'Accept': 'application/vnd.github.v3+json',
                    ...(data && { 'Content-Type': 'application/json' })
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(responseData);
                        
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsedData);
                        } else {
                            reject(new Error(parsedData.message || `HTTP ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Interactive setup
     */
    static async setup() {
        console.log('🔧 הגדרת GitHub Sync');
        console.log('===================\n');

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

        try {
            console.log('צריך GitHub Personal Access Token עם הרשאות repo');
            console.log('👉 https://github.com/settings/tokens\n');

            const token = await question('GitHub Token: ');
            const repo = await question('Repository (username/repo): ');

            // Create .env file
            const envContent = `GITHUB_TOKEN=${token}\nGITHUB_REPO=${repo}\n`;
            fs.writeFileSync('.env', envContent);

            console.log('\n✅ הגדרות נשמרו ב-.env');
            console.log('🚀 עכשיו תוכל להריץ: node github-sync.js');

        } catch (error) {
            console.error('❌ שגיאה בהגדרה:', error.message);
        } finally {
            rl.close();
        }
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    // Load .env if exists
    if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key] = value;
            }
        });
    }

    try {
        switch (command) {
            case 'setup':
                await GitHubSync.setup();
                break;

            case 'upload':
                const uploader = new GitHubSync();
                const filename = args[1];
                if (filename) {
                    await uploader.uploadFile(filename);
                } else {
                    await uploader.syncAll('upload');
                }
                break;

            case 'download':
                const downloader = new GitHubSync();
                const downloadFile = args[1];
                if (downloadFile) {
                    await downloader.downloadFile(downloadFile);
                } else {
                    await downloader.syncAll('download');
                }
                break;

            case 'watch':
                const watcher = new GitHubSync();
                watcher.watchFiles();
                break;

            case 'sync':
                const syncer = new GitHubSync();
                await syncer.syncAll('upload');
                break;

            default:
                console.log('🚀 GitHub Sync Tool - כלי סנכרון עם GitHub');
                console.log('===============================================\n');
                console.log('פקודות זמינות:');
                console.log('  setup              - הגדרה ראשונית');
                console.log('  upload [file]      - העלאת קובץ או כל הקבצים');
                console.log('  download [file]    - הורדת קובץ או כל הקבצים');
                console.log('  sync               - סנכרון כל הקבצים (העלאה)');
                console.log('  watch              - עקיבה אחר שינויים וסנכרון אוטומטי');
                console.log('\nדוגמאות:');
                console.log('  node github-sync.js setup');
                console.log('  node github-sync.js upload index.html');
                console.log('  node github-sync.js sync');
                console.log('  node github-sync.js watch');
                break;
        }
    } catch (error) {
        console.error('❌ שגיאה:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 סיום העבודה...');
    process.exit(0);
});

if (require.main === module) {
    main();
}

module.exports = GitHubSync;