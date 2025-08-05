/**
 * תסריט בנייה של האתר
 * מבצע עדכון אוטומטי של כל הקבצים על בסיס הנתונים המעודכנים
 */

const fs = require('fs').promises;
const path = require('path');

class SiteBuilder {
    constructor() {
        this.projectRoot = process.cwd();
        this.publicDir = path.join(this.projectRoot, 'public');
        this.dataDir = path.join(this.publicDir, 'data');
        this.templatesDir = path.join(this.projectRoot, 'templates');
    }

    async build() {
        console.log('🔨 מתחיל בניית האתר...\n');

        try {
            // טעינת נתונים
            const contentData = await this.loadData('content.json', []);
            const quizData = await this.loadData('quiz.json', []);
            const imagesData = await this.loadData('images-index.json', []);

            console.log(`📊 נטענו: ${contentData.length} פריטי תוכן, ${quizData.length} שאלות, ${imagesData.length} תמונות\n`);

            // בניית הקבצים
            await this.buildIndexHTML(contentData, imagesData);
            await this.buildQuizHTML(quizData);
            await this.buildSitemap(contentData);
            await this.buildRobotsTxt();
            await this.buildManifest();
            await this.generateSearchIndex(contentData);

            // יצירת קבצי העזר
            await this.createHtaccess();
            await this.updateServiceWorker();

            console.log('\n✅ בניית האתר הושלמה בהצלחה!');
            console.log('📁 קבצים שנוצרו:');
            console.log('  - index.html');
            console.log('  - quiz.html');
            console.log('  - sitemap.xml');
            console.log('  - robots.txt');
            console.log('  - manifest.json');
            console.log('  - search-index.json');

        } catch (error) {
            console.error('❌ שגיאה בבניית האתר:', error.message);
            process.exit(1);
        }
    }

    // טעינת נתונים מקובץ JSON
    async loadData(filename, defaultValue) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log(`⚠️  לא נמצא קובץ ${filename}, משתמש בערכי ברירת מחדל`);
            return defaultValue;
        }
    }

    // בניית index.html
    async buildIndexHTML(contentData, imagesData) {
        console.log('📄 בונה index.html...');

        const templatePath = path.join(this.templatesDir, 'index-template.html');
        let template;

        try {
            template = await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            // אם אין תבנית, ננסה לטעון מהקובץ הקיים
            template = await this.loadExistingIndex();
        }

        // יצירת תוכן HTML
        const dictionaryContent = this.generateDictionaryHTML(contentData);
        const navigationHTML = this.generateNavigationHTML(contentData);
        
        // החלפת placeholder-ים
        let finalHTML = template
            .replace('{{DICTIONARY_CONTENT}}', dictionaryContent)
            .replace('{{NAVIGATION_CONTENT}}', navigationHTML)
            .replace('{{LAST_UPDATED}}', new Date().toLocaleDateString('he-IL'))
            .replace('{{CONTENT_COUNT}}', contentData.length.toString());

        // כתיבת הקובץ
        await fs.writeFile(path.join(this.publicDir, 'index.html'), finalHTML, 'utf8');
        console.log('  ✓ index.html נוצר בהצלחה');
    }

    // טעינת index קיים
    async loadExistingIndex() {
        try {
            return await fs.readFile('index.html', 'utf8');
        } catch (error) {
            throw new Error('לא נמצאה תבנית index ולא קובץ index קיים');
        }
    }

    // יצירת HTML למילון
    generateDictionaryHTML(contentData) {
        if (!contentData || contentData.length === 0) {
            return '<p>אין תוכן זמין כרגע.</p>';
        }

        // קיבוץ לפי קטגוריות
        const categories = this.groupByCategory(contentData);
        let html = '';

        Object.keys(categories).forEach(categoryKey => {
            const categoryName = this.getCategoryName(categoryKey);
            html += `<h2 id="${categoryKey}" style="color: #007bff; margin: 40px 0 20px;">${categoryName}</h2>\n`;
            
            categories[categoryKey].forEach(item => {
                html += this.generateContentItemHTML(item);
            });
        });

        return html;
    }

    // יצירת HTML לניווט
    generateNavigationHTML(contentData) {
        const categories = this.groupByCategory(contentData);
        let html = '<ul>';

        Object.keys(categories).forEach(categoryKey => {
            const categoryName = this.getCategoryName(categoryKey);
            const count = categories[categoryKey].length;
            
            html += `<li><a href="#${categoryKey}">${categoryName} (${count})</a></li>`;
        });

        html += '</ul>';
        return html;
    }

    // יצירת HTML לפריט תוכן
    generateContentItemHTML(item) {
        const slug = this.generateSlug(item.term);
        let linksHTML = '';

        if (item.links && item.links.length > 0) {
            linksHTML = '<div class="content-links">';
            item.links.forEach(link => {
                const [url, title] = link.split('|');
                linksHTML += `<a href="${url}" class="system-link" target="_blank">${title || url}</a>`;
            });
            linksHTML += '</div>';
        }

        return `
        <div id="${slug}" class="dictionary-item">
            <div class="term">${item.term}</div>
            <div class="definition">
                ${item.definition}
                ${linksHTML}
            </div>
        </div>
        `;
    }

    // בניית quiz.html
    async buildQuizHTML(quizData) {
        console.log('📄 בונה quiz.html...');

        const templatePath = path.join(this.templatesDir, 'quiz-template.html');
        let template;

        try {
            template = await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            template = await this.loadExistingQuiz();
        }

        // החלפת השאלות
        const questionsJS = JSON.stringify(quizData, null, 8);
        const finalHTML = template
            .replace('{{QUIZ_QUESTIONS}}', questionsJS)
            .replace('{{QUESTIONS_COUNT}}', quizData.length.toString());

        await fs.writeFile(path.join(this.publicDir, 'quiz.html'), finalHTML, 'utf8');
        console.log('  ✓ quiz.html נוצר בהצלחה');
    }

    // טעינת quiz קיים
    async loadExistingQuiz() {
        try {
            return await fs.readFile('quiz.html', 'utf8');
        } catch (error) {
            throw new Error('לא נמצאה תבנית quiz ולא קובץ quiz קיים');
        }
    }

    // בניית sitemap.xml
    async buildSitemap(contentData) {
        console.log('📄 בונה sitemap.xml...');
        
        const baseUrl = process.env.URL || 'https://uniguide.netlify.app';
        let urls = [];

        // דפים ראשיים
        urls.push({
            loc: baseUrl + '/',
            changefreq: 'weekly',
            priority: '1.0'
        });

        urls.push({
            loc: baseUrl + '/quiz.html',
            changefreq: 'monthly',
            priority: '0.8'
        });

        urls.push({
            loc: baseUrl + '/admin.html',
            changefreq: 'monthly',
            priority: '0.3'
        });

        // פריטי תוכן
        contentData.forEach(item => {
            const slug = this.generateSlug(item.term);
            urls.push({
                loc: `${baseUrl}/#${slug}`,
                changefreq: 'monthly',
                priority: '0.6'
            });
        });

        // יצירת XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        urls.forEach(url => {
            xml += '  <url>\n';
            xml += `    <loc>${url.loc}</loc>\n`;
            xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
            xml += `    <priority>${url.priority}</priority>\n`;
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';

        await fs.writeFile(path.join(this.publicDir, 'sitemap.xml'), xml, 'utf8');
        console.log('  ✓ sitemap.xml נוצר בהצלחה');
    }

    // בניית robots.txt
    async buildRobotsTxt() {
        console.log('📄 בונה robots.txt...');
        
        const baseUrl = process.env.URL || 'https://uniguide.netlify.app';
        const robots = `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /data/
Disallow: /backups/

Sitemap: ${baseUrl}/sitemap.xml`;

        await fs.writeFile(path.join(this.publicDir, 'robots.txt'), robots, 'utf8');
        console.log('  ✓ robots.txt נוצר בהצלחה');
    }

    // בניית manifest.json
    async buildManifest() {
        console.log('📄 בונה manifest.json...');
        
        const manifest = {
            name: "המדריך המלא למובילי ומנהלי מרכזי יזמות - יוניסטרים",
            short_name: "מדריך יוניסטרים",
            description: "מדריך מקיף לניהול מרכזי יזמות ובחינה אינטראקטיבית",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#007bff",
            icons: [
                {
                    src: "/images/icon-192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "/images/icon-512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ],
            lang: "he",
            dir: "rtl"
        };

        await fs.writeFile(
            path.join(this.publicDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2),
            'utf8'
        );
        console.log('  ✓ manifest.json נוצר בהצלחה');
    }

    // יצירת אינדקס חיפוש
    async generateSearchIndex(contentData) {
        console.log('📄 בונה search-index.json...');
        
        const searchIndex = contentData.map(item => ({
            id: item.id,
            term: item.term,
            definition: item.definition.substring(0, 200),
            category: item.category,
            slug: this.generateSlug(item.term)
        }));

        await fs.writeFile(
            path.join(this.publicDir, 'search-index.json'),
            JSON.stringify(searchIndex, null, 2),
            'utf8'
        );
        console.log('  ✓ search-index.json נוצר בהצלחה');
    }

    // יצירת .htaccess
    async createHtaccess() {
        const htaccess = `# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
</IfModule>

# Compress files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy strict-origin-when-cross-origin
</IfModule>`;

        await fs.writeFile(path.join(this.publicDir, '.htaccess'), htaccess, 'utf8');
        console.log('  ✓ .htaccess נוצר בהצלחה');
    }

    // עדכון Service Worker
    async updateServiceWorker() {
        const sw = `const CACHE_NAME = 'uniguide-v1';
const urlsToCache = [
    '/',
    '/quiz.html',
    '/admin.html',
    '/content-manager.js',
    '/mcp-integration.js',
    '/search-index.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});`;

        await fs.writeFile(path.join(this.publicDir, 'sw.js'), sw, 'utf8');
        console.log('  ✓ sw.js נוצר בהצלחה');
    }

    // עזרים
    groupByCategory(contentData) {
        const categories = {};
        contentData.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });
        return categories;
    }

    getCategoryName(category) {
        const categories = {
            'programs': 'תכניות',
            'events': 'אירועים',
            'systems': 'מערכות',
            'documents': 'טפסים ומסמכים חשובים',
            'training': 'הכשרות והדרכה',
            'mentoring': 'ליווי ומנטורינג',
            'budget': 'תקציב ותפעול',
            'general': 'כללי'
        };
        return categories[category] || category;
    }

    generateSlug(text) {
        return text.toLowerCase()
            .replace(/[^א-ת\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }
}

// הפעלה
if (require.main === module) {
    const builder = new SiteBuilder();
    builder.build();
}

module.exports = SiteBuilder;