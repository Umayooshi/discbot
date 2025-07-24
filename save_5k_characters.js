const CharacterExpansionSystem = require('./character_expansion_system');
const fs = require('fs');

async function expandAndSave() {
  console.log('🚀 Starting comprehensive database expansion to 5000 characters...');
  
  try {
    // Load current cache
    const cacheFile = './anilist_characters_cache.json';
    let currentData = { characters: [], loadedPages: 0 };
    
    if (fs.existsSync(cacheFile)) {
      currentData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }

    console.log(`Current count: ${currentData.characters.length} characters`);
    
    if (currentData.characters.length >= 5000) {
      console.log('✅ Database already has 5000+ characters!');
      return;
    }

    // Force expansion from current count to 5000
    const expansionSystem = new (require('./character_expansion_system'))();
    await expansionSystem.expandDatabase();
    
    // Verify final count
    const finalData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    console.log(`✅ Final database size: ${finalData.characters.length} characters`);
    console.log(`✅ All characters saved to: ${cacheFile}`);
    
  } catch (error) {
    console.error('❌ Error during expansion:', error);
  }
}

// Run the expansion
expandAndSave().then(() => {
  console.log('🎉 Database expansion complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});