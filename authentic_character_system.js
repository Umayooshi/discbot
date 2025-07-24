const axios = require('axios');
const curatedCharacters = require('./curated_character_data.js');

class AuthenticCharacterSystem {
  constructor() {
    this.baseURL = 'https://api.jikan.moe/v4';
    this.nekosURL = 'https://nekos.best/api/v2';
    this.availableEndpoints = ['neko', 'waifu', 'husbando', 'kitsune'];
    this.gifEndpoints = [
      'happy', 'dance', 'laugh', 'kiss', 'hug', 'pat', 'cuddle', 'poke',
      'slap', 'smug', 'blush', 'wave', 'highfive', 'handhold', 'nom',
      'bite', 'glomp', 'bonk', 'yeet', 'bully', 'cringe', 'cry', 'dab',
      'facepalm', 'feed', 'kick', 'punch', 'shoot', 'stare', 'think',
      'thumbsup', 'wink', 'yawn', 'shrug', 'sleep', 'tickle', 'wag'
    ];
    
    // Popular anime series for character generation
    this.popularAnime = [
      { id: 21, title: 'One Piece' },
      { id: 20, title: 'Naruto' },
      { id: 1735, title: 'Naruto: Shippuden' },
      { id: 11061, title: 'Hunter x Hunter (2011)' },
      { id: 5114, title: 'Fullmetal Alchemist: Brotherhood' },
      { id: 16498, title: 'Attack on Titan' },
      { id: 11757, title: 'Sword Art Online' },
      { id: 1, title: 'Cowboy Bebop' },
      { id: 30276, title: 'One Punch Man' },
      { id: 35790, title: 'Jujutsu Kaisen' },
      { id: 44511, title: 'Chainsaw Man' },
      { id: 40748, title: 'Jujutsu Kaisen' },
      { id: 40060, title: 'Spy x Family' },
      { id: 38524, title: 'Demon Slayer' }
    ];
    
    this.characterCache = new Map();
    this.loadCharacters();
  }

  async loadCharacters() {
    console.log('Loading authentic anime characters...');
    
    // Load curated characters first
    const curatedData = curatedCharacters; // It's already an array
    console.log(`Loaded ${curatedData.length} curated characters`);
    
    // Pre-populate cache with some popular characters
    await this.warmupCharacterCache();
    
    console.log('Authentic character system ready with real anime characters');
  }

  async warmupCharacterCache() {
    try {
      // Get characters from a few popular anime series
      const warmupPromises = this.popularAnime.slice(0, 5).map(async (anime) => {
        try {
          const response = await axios.get(`${this.baseURL}/anime/${anime.id}/characters`, {
            timeout: 3000
          });
          
          if (response.data && response.data.data) {
            const characters = response.data.data.slice(0, 10); // Top 10 characters
            this.characterCache.set(anime.id, characters);
            console.log(`Cached ${characters.length} characters from ${anime.title}`);
          }
        } catch (error) {
          console.error(`Error caching characters from ${anime.title}:`, error.message);
        }
      });
      
      await Promise.all(warmupPromises);
    } catch (error) {
      console.error('Error warming up character cache:', error);
    }
  }

  async getRandomCharacters(count = 1) {
    try {
      console.log(`Getting ${count} authentic anime characters...`);
      const characters = [];
      
      // Get authentic images from nekos.best
      const imagePromises = [];
      for (let i = 0; i < count; i++) {
        const endpoint = this.availableEndpoints[Math.floor(Math.random() * this.availableEndpoints.length)];
        imagePromises.push(this.fetchImageFromNekos(endpoint));
      }
      
      const images = await Promise.all(imagePromises);
      
      // Match with real character names
      for (let i = 0; i < images.length; i++) {
        const imageData = images[i];
        if (imageData) {
          const realCharacter = await this.getRandomRealCharacter();
          
          const character = {
            name: realCharacter.name,
            series: realCharacter.series,
            image: imageData.url,
            artist: imageData.artist_name || 'Unknown Artist',
            source: imageData.source_url || '',
            type: imageData.type,
            id: this.generateId(imageData.url),
            malId: realCharacter.mal_id || null
          };
          
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

  async fetchImageFromNekos(endpoint) {
    try {
      const response = await axios.get(`${this.nekosURL}/${endpoint}?amount=1`, {
        timeout: 3000
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        return {
          ...response.data.results[0],
          type: endpoint
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching image from ${endpoint}:`, error.message);
      return null;
    }
  }

  async getRandomRealCharacter() {
    try {
      // First try curated characters
      const curatedData = curatedCharacters; // It's already an array
      if (curatedData.length > 0) {
        const randomCurated = curatedData[Math.floor(Math.random() * curatedData.length)];
        return {
          name: randomCurated.character_name,
          series: randomCurated.series,
          mal_id: randomCurated.character_id
        };
      }
      
      // Fallback to cached characters from Jikan API
      const cacheKeys = Array.from(this.characterCache.keys());
      if (cacheKeys.length > 0) {
        const randomAnimeId = cacheKeys[Math.floor(Math.random() * cacheKeys.length)];
        const characters = this.characterCache.get(randomAnimeId);
        
        if (characters && characters.length > 0) {
          const randomChar = characters[Math.floor(Math.random() * characters.length)];
          const animeInfo = this.popularAnime.find(a => a.id === randomAnimeId);
          
          return {
            name: randomChar.character.name,
            series: animeInfo?.title || 'Unknown Series',
            mal_id: randomChar.character.mal_id
          };
        }
      }
      
      // Ultimate fallback
      return this.getBasicFallbackCharacter();
    } catch (error) {
      console.error('Error getting real character:', error);
      return this.getBasicFallbackCharacter();
    }
  }

  getBasicFallbackCharacter() {
    const basicCharacters = [
      { name: 'Luffy', series: 'One Piece' },
      { name: 'Naruto Uzumaki', series: 'Naruto' },
      { name: 'Goku', series: 'Dragon Ball' },
      { name: 'Edward Elric', series: 'Fullmetal Alchemist' },
      { name: 'Tanjiro Kamado', series: 'Demon Slayer' },
      { name: 'Eren Yeager', series: 'Attack on Titan' },
      { name: 'Senku Ishigami', series: 'Dr. Stone' },
      { name: 'Denji', series: 'Chainsaw Man' }
    ];
    
    return basicCharacters[Math.floor(Math.random() * basicCharacters.length)];
  }

  async getGifCharacter() {
    try {
      console.log('Getting authentic GIF character...');
      const endpoint = this.gifEndpoints[Math.floor(Math.random() * this.gifEndpoints.length)];
      
      const response = await axios.get(`${this.nekosURL}/${endpoint}?amount=1`, {
        timeout: 3000
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const imageData = response.data.results[0];
        const realCharacter = await this.getRandomRealCharacter();
        
        const character = {
          name: realCharacter.name,
          series: realCharacter.series,
          image: imageData.url,
          artist: imageData.artist_name || 'Unknown Artist',
          source: imageData.source_url || '',
          type: endpoint,
          id: this.generateId(imageData.url),
          isGif: true,
          malId: realCharacter.mal_id || null
        };
        
        console.log(`Created authentic GIF character: ${character.name} from ${character.series}`);
        return character;
      }
      
      return this.getFallbackGifCharacter();
    } catch (error) {
      console.error('Error fetching authentic GIF character:', error.message);
      return this.getFallbackGifCharacter();
    }
  }

  getFallbackCharacters(count) {
    console.log('Using fallback authentic characters');
    const characters = [];
    
    for (let i = 0; i < count; i++) {
      const realChar = this.getBasicFallbackCharacter();
      characters.push({
        name: realChar.name,
        series: realChar.series,
        image: 'https://nekos.best/api/v2/neko/001.png',
        artist: 'Unknown Artist',
        source: '',
        type: 'neko',
        id: Math.random().toString(36).substring(2, 15)
      });
    }
    
    return characters;
  }

  getFallbackGifCharacter() {
    const realChar = this.getBasicFallbackCharacter();
    return {
      name: realChar.name,
      series: realChar.series,
      image: 'https://nekos.best/api/v2/happy/001.gif',
      artist: 'Unknown Artist',
      source: '',
      type: 'happy',
      id: Math.random().toString(36).substring(2, 15),
      isGif: true
    };
  }

  generateId(url) {
    const matches = url.match(/([a-f0-9-]+)\.(png|gif)$/);
    return matches ? matches[1] : Math.random().toString(36).substring(2, 15);
  }
}

module.exports = AuthenticCharacterSystem;