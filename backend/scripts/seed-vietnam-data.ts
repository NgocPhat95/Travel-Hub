import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    const filePath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\dc0216ba-90bf-49a0-84c4-04290281e4b4\\.system_generated\\steps\\6272\\content.md';
    console.log('Reading content file:', filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // Regex to match Booking.com image URLs with keys
    const regex = /https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/max1024x768\/[a-zA-Z0-9.\-_?&=]+/g;
    const matches = content.match(regex) || [];
    
    console.log(`Found ${matches.length} matches!`);
    const unique = [...new Set(matches)].map(url => {
      // Clean HTML entities
      return url.replace(/&amp;/g, '&');
    });

    console.log(`Found ${unique.length} unique Booking.com image URLs.`);
    
    // Save to a temp json file in the workspace
    const outputPath = path.join(__dirname, 'extracted_images.json');
    fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2), 'utf8');
    console.log('Saved unique URLs to:', outputPath);
  } catch (error: any) {
    console.error('Extraction failed:', error.message);
  }
}

main();
