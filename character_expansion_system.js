const axios = require('axios');
const fs = require('fs');
const path = require('path');

class CharacterExpansionSystem {
  constructor() {
    this.baseURL = 'https://graphql.anilist.co';
    this.targetCount = 5000;
    this.batchSize = 50;
    this.rateLimitDelay = 300; // ms between requests
  }

  async expandDatabase() {
    try {
      console.log('Starting character database expansion to 5000+ characters...');
      
      // Load current cache
      const cacheFile = path.join(__dirname, 'anilist_characters_cache.json');
      let currentData = { characters: [], loadedPages: 0 };
      
      if (fs.existsSync(cacheFile)) {
        currentData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      }

      const currentCount = currentData.characters.length;
      console.log(`Current character count: ${currentCount}`);

      if (currentCount >= this.targetCount) {
        console.log('Database already has sufficient characters');
        return currentData.characters;
      }

      const needed = this.targetCount - currentCount;
      console.log(`Expanding database by ${needed} characters...`);

      // Calculate proper starting page (30 pages of 50 characters = 1500 existing)
      const startPage = Math.ceil(currentCount / this.batchSize) + 1;
      
      // Fetch additional characters
      const newCharacters = await this.fetchCharacterBatch(startPage, needed);
      
      if (newCharacters.length > 0) {
        // Apply name normalization to new characters
        const normalizedCharacters = newCharacters.map(char => this.normalizeCharacterName(char));
        
        currentData.characters = currentData.characters.concat(normalizedCharacters);
        currentData.loadedPages = Math.ceil(currentData.characters.length / this.batchSize);
        currentData.lastUpdated = new Date().toISOString();

        // Save updated cache with proper formatting
        fs.writeFileSync(cacheFile, JSON.stringify(currentData, null, 2));
        console.log(`Database expanded to ${currentData.characters.length} characters`);
        console.log(`Total pages loaded: ${currentData.loadedPages}`);
      }

      return currentData.characters;

    } catch (error) {
      console.error('Error expanding character database:', error);
      throw error;
    }
  }

  async fetchCharacterBatch(startPage, targetCount) {
    const characters = [];
    let currentPage = startPage || 31; // Start from page 31 since we have 1500 characters (30 pages of 50)
    const maxPages = Math.ceil(targetCount / this.batchSize);

    for (let i = 0; i < maxPages && characters.length < targetCount; i++) {
      const pageNumber = currentPage + i;
      
      try {
        console.log(`Fetching page ${pageNumber} (${characters.length}/${targetCount} characters)...`);
        
        const pageCharacters = await this.fetchCharacterPage(pageNumber);
        
        if (pageCharacters.length === 0) {
          console.log('No more characters found, stopping expansion');
          break;
        }

        characters.push(...pageCharacters);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      } catch (error) {
        console.error(`Error fetching page ${pageNumber}:`, error.message);
        
        // If rate limited, wait longer and retry
        if (error.message.includes('rate') || error.message.includes('429')) {
          console.log('Rate limited, waiting 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          i--; // Retry this page
          continue;
        }
        
        break;
      }
    }

    return characters.slice(0, targetCount);
  }

  async fetchCharacterPage(page) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          characters(sort: FAVOURITES_DESC) {
            id
            name {
              full
              native
            }
            image {
              large
              medium
            }
            media(type: ANIME, sort: POPULARITY_DESC) {
              nodes {
                title {
                  romaji
                  english
                  native
                }
                type
                format
                status
                popularity
              }
            }
          }
        }
      }
    `;

    const response = await axios.post(this.baseURL, {
      query: query,
      variables: {
        page: page,
        perPage: this.batchSize
      }
    }, {
      timeout: 10000
    });

    if (!response.data.data?.Page?.characters) {
      return [];
    }

    return response.data.data.Page.characters
      .filter(char => 
        char.name.full && 
        char.image.large && 
        char.media.nodes.length > 0 &&
        char.media.nodes[0].popularity > 100 // Filter for more popular series
      )
      .map(char => {
        let name = this.normalizeName(char.name.full);
        let series = char.media.nodes[0].title.english || 
                    char.media.nodes[0].title.romaji || 
                    'Unknown Series';
        
        return {
          name,
          series,
          image: char.image.large,
          type: 'anime',
          popularity: char.media.nodes[0].popularity || 0
        };
      });
  }

  normalizeName(name) {
    if (!name) return name;
    
    // Apply same normalization rules as main system
    let normalizedName = name
      .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
      .replace(/[★☆※]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Common romanization fixes
    normalizedName = normalizedName
      .replace(/ou/g, 'o')
      .replace(/uu/g, 'u');

    // Specific character name fixes
    const nameFixMap = {
      'Luffy Monkey': 'Monkey D. Luffy',
      'Zoro Roronoa': 'Roronoa Zoro',
      'Sanji Vinsmoke': 'Vinsmoke Sanji',
      'Robin Nico': 'Nico Robin',
      'Goku Son': 'Son Goku',
      'Gohan Son': 'Son Gohan',
      'L Lawliet': 'L'
    };

    return nameFixMap[normalizedName] || normalizedName;
  }

  async getCharacterStats() {
    const cacheFile = path.join(__dirname, 'anilist_characters_cache.json');
    
    if (!fs.existsSync(cacheFile)) {
      return { count: 0, lastUpdated: 'Never' };
    }

    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    
    return {
      count: data.characters?.length || 0,
      loadedPages: data.loadedPages || 0,
      lastUpdated: data.lastUpdated || 'Unknown',
      needsExpansion: (data.characters?.length || 0) < this.targetCount
    };
  }
}

module.exports = new CharacterExpansionSystem();