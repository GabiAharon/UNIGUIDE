/**
 * סקריפט Node.js לפרסום אוטומטי לגיטהאב
 * מאפשר פרסום עם הודעות מותאמות אישית או אוטומטיות
 */

const { execSync } = require('child_process');
const readline = require('readline');

class GitPublisher {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async publish(customMessage = null) {
        try {
            console.log('🚀 מתחיל פרסום לגיטהאב...\n');

            // בדיקה אם יש שינויים
            this.checkForChanges();

            // הוספת קבצים
            console.log('📁 מוסיף קבצים...');
            execSync('git add .', { stdio: 'inherit' });

            // יצירת הודעת commit
            const commitMessage = customMessage || await this.getCommitMessage();
            
            console.log(`💾 יוצר commit עם ההודעה: "${commitMessage}"`);
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

            // דחיפה לגיטהאב
            console.log('☁️ דוחף לגיטהאב...');
            execSync('git push', { stdio: 'inherit' });

            console.log('\n✅ הושלם בהצלחה! 🎉');
            console.log('האתר יתעדכן בעוד כמה דקות ב-Netlify\n');

            this.rl.close();

        } catch (error) {
            console.error('❌ שגיאה בפרסום:', error.message);
            
            if (error.message.includes('nothing to commit')) {
                console.log('ℹ️  אין שינויים לפרסום');
            } else if (error.message.includes('fatal: not a git repository')) {
                console.log('❌ התיקייה הזו לא מאותחלת כ-Git repository');
                console.log('הרץ: git init && git remote add origin <URL של הרפוזיטורי שלך>');
            } else if (error.message.includes('failed to push')) {
                console.log('❌ בעיה בחיבור לגיטהאב - בדוק את ההרשאות');
            }
            
            this.rl.close();
            process.exit(1);
        }
    }

    checkForChanges() {
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (!status.trim()) {
                console.log('ℹ️  אין שינויים לפרסום');
                this.rl.close();
                process.exit(0);
            }
        } catch (error) {
            throw new Error('בעיה בבדיקת סטטוס Git');
        }
    }

    async getCommitMessage() {
        const args = process.argv.slice(2);
        
        // אם נשלחה הודעה כפרמטר
        if (args.length > 0) {
            return args.join(' ');
        }

        // אם רצים במצב שקט (--auto)
        if (process.argv.includes('--auto')) {
            return this.generateAutoMessage();
        }

        // שאל את המשתמש על הודעה
        return new Promise((resolve) => {
            this.rl.question('הכנס הודעת commit (או לחץ Enter להודעה אוטומטית): ', (answer) => {
                resolve(answer.trim() || this.generateAutoMessage());
            });
        });
    }

    generateAutoMessage() {
        const now = new Date();
        const date = now.toLocaleDateString('he-IL');
        const time = now.toLocaleTimeString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `עדכון תוכן - ${date} ${time}`;
    }

    // פרסום מהיר ללא שאלות
    async quickPublish() {
        await this.publish(this.generateAutoMessage());
    }

    // הצגת עזרה
    showHelp() {
        console.log(`
🚀 סקריפט פרסום לגיטהאב

שימוש:
  node publish.js                    - פרסום עם אפשרות להודעה מותאמת
  node publish.js "הודעה שלי"       - פרסום עם הודעה ספציפית
  node publish.js --auto            - פרסום אוטומטי עם הודעה אוטומטית
  node publish.js --quick           - פרסום מהיר (זהה ל--auto)
  node publish.js --help            - הצגת עזרה זו

דוגמאות:
  node publish.js "הוספתי נושא חדש על Salesforce"
  node publish.js --auto
        `);
    }
}

// הפעלת הסקריפט
const publisher = new GitPublisher();

if (process.argv.includes('--help')) {
    publisher.showHelp();
} else if (process.argv.includes('--quick') || process.argv.includes('--auto')) {
    publisher.quickPublish();
} else {
    publisher.publish();
}