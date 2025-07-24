const axios = require('axios');
const curatedCharacters = require('./curated_character_data.js');

class JikanCharacterSystem {
  constructor() {
    this.baseURL = 'https://api.jikan.moe/v4';
    this.characterCache = new Map();
    this.imageCache = new Map();
    
    // Popular anime series with their MAL IDs
    this.popularAnime = [
      { id: 21, title: 'One Piece', characters: [] },
      { id: 20, title: 'Naruto', characters: [] },
      { id: 1735, title: 'Naruto: Shippuden', characters: [] },
      { id: 11061, title: 'Hunter x Hunter (2011)', characters: [] },
      { id: 5114, title: 'Fullmetal Alchemist: Brotherhood', characters: [] },
      { id: 16498, title: 'Attack on Titan', characters: [] },
      { id: 11757, title: 'Sword Art Online', characters: [] },
      { id: 1, title: 'Cowboy Bebop', characters: [] },
      { id: 30276, title: 'One Punch Man', characters: [] },
      { id: 35790, title: 'Jujutsu Kaisen', characters: [] },
      { id: 44511, title: 'Chainsaw Man', characters: [] },
      { id: 40060, title: 'Spy x Family', characters: [] },
      { id: 38524, title: 'Demon Slayer', characters: [] },
      { id: 269, title: 'Bleach', characters: [] },
      { id: 813, title: 'Fate/stay night', characters: [] }
    ];
    
    this.loadCharacters();
  }

  async loadCharacters() {
    console.log('Loading characters from Jikan API...');
    
    // Load curated characters first
    const curatedData = curatedCharacters;
    console.log(`Loaded ${curatedData.length} curated characters`);
    
    // Pre-populate cache with some popular characters
    await this.warmupCharacterCache();
    
    console.log('Jikan character system ready with authentic anime characters');
  }

  async warmupCharacterCache() {
    try {
      // Cache a few popular anime series
      const warmupPromises = this.popularAnime.slice(0, 5).map(async (anime) => {
        try {
          await this.delay(200); // Rate limiting
          const response = await axios.get(`${this.baseURL}/anime/${anime.id}/characters`, {
            timeout: 5000
          });
          
          if (response.data && response.data.data) {
            const characters = response.data.data.slice(0, 15); // Top 15 characters
            this.characterCache.set(anime.id, characters);
            console.log(`Cached ${characters.length} characters from ${anime.title}`);
          }
        } catch (error) {
          if (error.response && error.response.status === 429) {
            console.log(`Rate limited for ${anime.title}, will retry later`);
          } else {
            console.error(`Error caching characters from ${anime.title}:`, error.message);
          }
        }
      });
      
      await Promise.all(warmupPromises);
    } catch (error) {
      console.error('Error warming up character cache:', error);
    }
  }

  async getRandomCharacters(count = 1) {
    try {
      console.log(`Getting ${count} authentic anime characters with real images...`);
      const characters = [];
      
      for (let i = 0; i < count; i++) {
        const character = await this.getRandomRealCharacterWithImage();
        if (character) {
          characters.push(character);
          console.log(`Created authentic character: ${character.name} from ${character.series}`);
        }
      }
      
      return characters.length > 0 ? characters : this.getFallbackCharacters(count);
    } catch (error) {
      console.error('Error fetching authentic characters:', error.message);
      return this.getFallbackCharacters(count);
    }
  }

  async getRandomRealCharacterWithImage() {
    try {
      // Always prioritize curated characters first (they have reliable images)
      const curatedData = curatedCharacters;
      if (curatedData.length > 0) {
        const randomCurated = curatedData[Math.floor(Math.random() * curatedData.length)];
        
        // Test if the first image is accessible
        const testImage = randomCurated.images[0];
        const isImageAccessible = await this.testImageAccess(testImage);
        
        if (isImageAccessible) {
          const randomImage = randomCurated.images[Math.floor(Math.random() * randomCurated.images.length)];
          
          return {
            name: randomCurated.character_name,
            series: randomCurated.series,
            image: randomImage,
            type: 'curated',
            id: randomCurated.character_id.toString(),
            malId: randomCurated.character_id
          };
        }
      }
      
      // Try cached characters from Jikan API with name-only approach
      const cacheKeys = Array.from(this.characterCache.keys());
      if (cacheKeys.length > 0) {
        const randomAnimeId = cacheKeys[Math.floor(Math.random() * cacheKeys.length)];
        const characters = this.characterCache.get(randomAnimeId);
        
        if (characters && characters.length > 0) {
          const randomChar = characters[Math.floor(Math.random() * characters.length)];
          const animeInfo = this.popularAnime.find(a => a.id === randomAnimeId);
          
          // Use character name but with a guaranteed working image from curated data
          const curatedMatch = curatedData.find(c => 
            c.character_name.toLowerCase().includes(randomChar.character.name.toLowerCase().split(' ')[0]) ||
            randomChar.character.name.toLowerCase().includes(c.character_name.toLowerCase().split(' ')[0])
          );
          
          if (curatedMatch) {
            return {
              name: randomChar.character.name,
              series: animeInfo?.title || 'Unknown Series',
              image: curatedMatch.images[0], // Use curated image
              type: 'hybrid',
              id: randomChar.character.mal_id.toString(),
              malId: randomChar.character.mal_id
            };
          }
        }
      }
      
      // Fallback to curated characters
      return this.getBasicFallbackCharacter();
    } catch (error) {
      console.error('Error getting real character with image:', error);
      return this.getBasicFallbackCharacter();
    }
  }

  async getCharacterImages(characterId) {
    try {
      // Check cache first
      if (this.imageCache.has(characterId)) {
        return this.imageCache.get(characterId);
      }
      
      await this.delay(100); // Rate limiting
      const response = await axios.get(`${this.baseURL}/characters/${characterId}/pictures`, {
        timeout: 5000
      });
      
      if (response.data && response.data.data) {
        const images = response.data.data.slice(0, 10); // Max 10 images
        this.imageCache.set(characterId, images);
        return images;
      }
      
      return null;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`Rate limited for character ${characterId}`);
      } else {
        console.error(`Error fetching images for character ${characterId}:`, error.message);
      }
      return null;
    }
  }

  async getGifCharacter() {
    try {
      console.log('Getting authentic GIF character...');
      
      // For GIF characters, use curated data with a special indicator
      const character = await this.getRandomRealCharacterWithImage();
      
      if (character) {
        return {
          ...character,
          isGif: true,
          type: 'gif_character'
        };
      }
      
      return this.getFallbackGifCharacter();
    } catch (error) {
      console.error('Error fetching authentic GIF character:', error.message);
      return this.getFallbackGifCharacter();
    }
  }

  getBasicFallbackCharacter() {
    const basicCharacters = [
      { name: 'Luffy', series: 'One Piece', malId: 40 },
      { name: 'Naruto Uzumaki', series: 'Naruto', malId: 17 },
      { name: 'Goku', series: 'Dragon Ball', malId: 246 },
      { name: 'Edward Elric', series: 'Fullmetal Alchemist', malId: 11 },
      { name: 'Tanjiro Kamado', series: 'Demon Slayer', malId: 146156 },
      { name: 'Eren Yeager', series: 'Attack on Titan', malId: 40882 },
      { name: 'Senku Ishigami', series: 'Dr. Stone', malId: 140810 },
      { name: 'Denji', series: 'Chainsaw Man', malId: 132879 }
    ];
    
    const selected = basicCharacters[Math.floor(Math.random() * basicCharacters.length)];
    
    // Try to get a curated image for this character
    const curatedChar = curatedCharacters.find(c => c.character_name === selected.name);
    const image = curatedChar ? curatedChar.images[0] : 'https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png';
    
    return {
      name: selected.name,
      series: selected.series,
      image: image,
      type: 'fallback',
      id: selected.malId.toString(),
      malId: selected.malId
    };
  }

  getFallbackCharacters(count) {
    console.log('Using fallback authentic characters');
    const characters = [];
    
    for (let i = 0; i < count; i++) {
      characters.push(this.getBasicFallbackCharacter());
    }
    
    return characters;
  }

  getFallbackGifCharacter() {
    const character = this.getBasicFallbackCharacter();
    return {
      ...character,
      isGif: true,
      type: 'fallback_gif'
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testImageAccess(imageUrl) {
    try {
      const response = await axios.head(imageUrl, {
        timeout: 2000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  generateId(malId) {
    return malId ? malId.toString() : Math.random().toString(36).substring(2, 15);
  }
}

module.exports = JikanCharacterSystem;