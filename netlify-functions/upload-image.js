/**
 * Netlify Function להעלאת תמונות
 * מטפל בהעלאה, אופטימיזציה ושמירה של תמונות
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { filename, content, type, options = {} } = JSON.parse(event.body);

        // בדיקת תקינות
        if (!filename || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing filename or content' })
            };
        }

        // בדיקת סוג קובץ
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(type)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid image type' })
            };
        }

        // המרה מ-Base64
        const base64Data = content.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // יצירת שם קובץ ייחודי
        const timestamp = Date.now();
        const ext = path.extname(filename) || '.jpg';
        const uniqueFilename = `${timestamp}-${path.basename(filename, ext)}${ext}`;
        
        // נתיבי שמירה
        const originalPath = path.join(process.cwd(), 'public', 'images', 'originals', uniqueFilename);
        const optimizedPath = path.join(process.cwd(), 'public', 'images', 'optimized', uniqueFilename);
        const thumbnailPath = path.join(process.cwd(), 'public', 'images', 'thumbnails', uniqueFilename);

        // יצירת תיקיות
        await fs.mkdir(path.dirname(originalPath), { recursive: true });
        await fs.mkdir(path.dirname(optimizedPath), { recursive: true });
        await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });

        // שמירת המקור
        await fs.writeFile(originalPath, imageBuffer);

        let optimizedBuffer, thumbnailBuffer;
        
        try {
            // אופטימיזציה של התמונה
            optimizedBuffer = await sharp(imageBuffer)
                .resize(1200, 800, { 
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            // יצירת תמונה ממוזערת
            thumbnailBuffer = await sharp(imageBuffer)
                .resize(300, 200, { 
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            // שמירת הגרסאות האופטימיות
            await fs.writeFile(optimizedPath, optimizedBuffer);
            await fs.writeFile(thumbnailPath, thumbnailBuffer);

        } catch (sharpError) {
            console.log('Sharp processing failed, saving original only:', sharpError.message);
            // אם האופטימיזציה נכשלה, נשמור רק את המקור
            optimizedBuffer = imageBuffer;
            thumbnailBuffer = imageBuffer;
            await fs.writeFile(optimizedPath, imageBuffer);
            await fs.writeFile(thumbnailPath, imageBuffer);
        }

        // יצירת URLs
        const baseUrl = process.env.URL || 'http://localhost:8888';
        const imageUrls = {
            original: `${baseUrl}/images/originals/${uniqueFilename}`,
            optimized: `${baseUrl}/images/optimized/${uniqueFilename}`,
            thumbnail: `${baseUrl}/images/thumbnails/${uniqueFilename}`
        };

        // מידע על התמונה
        const imageInfo = {
            id: timestamp.toString(),
            filename: uniqueFilename,
            originalName: filename,
            type: type,
            urls: imageUrls,
            sizes: {
                original: imageBuffer.length,
                optimized: optimizedBuffer.length,
                thumbnail: thumbnailBuffer.length
            },
            uploadedAt: new Date().toISOString()
        };

        // שמירת מידע התמונות ב-JSON
        const imagesIndexPath = path.join(process.cwd(), 'public', 'data', 'images-index.json');
        await fs.mkdir(path.dirname(imagesIndexPath), { recursive: true });
        
        let imagesIndex = [];
        try {
            const existingIndex = await fs.readFile(imagesIndexPath, 'utf8');
            imagesIndex = JSON.parse(existingIndex);
        } catch (error) {
            // אם הקובץ לא קיים, נתחיל עם מערך ריק
        }

        imagesIndex.push(imageInfo);
        await fs.writeFile(imagesIndexPath, JSON.stringify(imagesIndex, null, 2), 'utf8');

        console.log(`Image uploaded: ${uniqueFilename} at ${new Date().toISOString()}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                image: imageInfo
            })
        };

    } catch (error) {
        console.error('Error uploading image:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};