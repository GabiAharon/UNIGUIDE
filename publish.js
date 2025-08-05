/**
 * Node.js script for automatic publishing to GitHub
 * Allows publishing with custom or automatic messages
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
            console.log('🚀 Starting GitHub publish...\n');

            // Check if there are changes
            this.checkForChanges();

            // Add files
            console.log('📁 Adding files...');
            execSync('git add .', { stdio: 'inherit' });

            // Create commit message
            const commitMessage = customMessage || await this.getCommitMessage();
            
            console.log(`💾 Creating commit with message: "${commitMessage}"`);
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

            // Push to GitHub
            console.log('☁️ Pushing to GitHub...');
            execSync('git push', { stdio: 'inherit' });

            console.log('\n✅ Completed successfully! 🎉');
            console.log('Website will update in a few minutes on Netlify\n');

            this.rl.close();

        } catch (error) {
            console.error('❌ Publishing error:', error.message);
            
            if (error.message.includes('nothing to commit')) {
                console.log('ℹ️  No changes to publish');
            } else if (error.message.includes('fatal: not a git repository')) {
                console.log('❌ This directory is not initialized as Git repository');
                console.log('Run: git init && git remote add origin <YOUR_REPOSITORY_URL>');
            } else if (error.message.includes('failed to push')) {
                console.log('❌ Problem connecting to GitHub - check permissions');
            }
            
            this.rl.close();
            process.exit(1);
        }
    }

    checkForChanges() {
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (!status.trim()) {
                console.log('ℹ️  No changes to publish');
                this.rl.close();
                process.exit(0);
            }
        } catch (error) {
            throw new Error('Problem checking Git status');
        }
    }

    async getCommitMessage() {
        const args = process.argv.slice(2);
        
        // If message was sent as parameter
        if (args.length > 0) {
            return args.join(' ');
        }

        // If running in quiet mode (--auto)
        if (process.argv.includes('--auto')) {
            return this.generateAutoMessage();
        }

        // Ask user for message
        return new Promise((resolve) => {
            this.rl.question('Enter commit message (or press Enter for automatic message): ', (answer) => {
                resolve(answer.trim() || this.generateAutoMessage());
            });
        });
    }

    generateAutoMessage() {
        const now = new Date();
        const date = now.toLocaleDateString('en-US');
        const time = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `Content update - ${date} ${time}`;
    }

    // Quick publish without questions
    async quickPublish() {
        await this.publish(this.generateAutoMessage());
    }

    // Show help
    showHelp() {
        console.log(`
🚀 GitHub Publishing Script

Usage:
  node publish.js                    - Publish with option for custom message
  node publish.js "My message"       - Publish with specific message
  node publish.js --auto            - Auto publish with automatic message
  node publish.js --quick           - Quick publish (same as --auto)
  node publish.js --help            - Show this help

Examples:
  node publish.js "Added new Salesforce topic"
  node publish.js --auto
        `);
    }
}

// Run the script
const publisher = new GitPublisher();

if (process.argv.includes('--help')) {
    publisher.showHelp();
} else if (process.argv.includes('--quick') || process.argv.includes('--auto')) {
    publisher.quickPublish();
} else {
    publisher.publish();
}