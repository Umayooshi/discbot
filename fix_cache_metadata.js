const fs = require('fs');

// Fix the cache file metadata
const cacheFile = './anilist_characters_cache.json';
const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

// Update metadata to prevent future expansion attempts
data.loadedPages = Math.ceil(data.characters.length / 50); // 100 pages for 5000 characters
data.lastUpdated = new Date().toISOString();

// Add IDs to characters that might be missing them
data.characters = data.characters.map((char, index) => ({
  id: char.id || index + 1,
  ...char
}));

console.log(`Fixed cache metadata:`);
console.log(`- Total characters: ${data.characters.length}`);
console.log(`- Loaded pages: ${data.loadedPages}`);
console.log(`- Last updated: ${data.lastUpdated}`);

// Save the corrected cache
fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
console.log('✅ Cache metadata fixed and saved!');