const axios = require('axios');

class NekosCharacterSystem {
  constructor() {
    this.baseURL = 'https://nekos.best/api/v2';
    this.availableEndpoints = [
      'neko', 'waifu', 'husbando', 'kitsune'
    ];
    this.gifEndpoints = [
      'lurk', 'shoot', 'sleep', 'shrug', 'stare', 'wave', 'poke', 'smile',
      'peck', 'wink', 'blush', 'smug', 'tickle', 'yeet', 'think', 'highfive',
      'feed', 'bite', 'bored', 'nom', 'yawn', 'facepalm', 'cuddle', 'kick',
      'happy', 'hug', 'baka', 'pat', 'angry', 'run', 'nod', 'nope', 'kiss',
      'dance', 'punch', 'handshake', 'slap', 'cry', 'pout', 'handhold',
      'thumbsup', 'laugh'
    ];
    this.cache = new Map();
    this.loadCharacters();
  }

  async loadCharacters() {
    console.log('Loading characters from nekos.best API...');
    
    // Pre-fetch some images to warm up the cache
    try {
      await this.warmupCache();
      console.log(`Nekos.best API connected successfully with ${this.availableEndpoints.length} character types`);
    } catch (error) {
      console.error('Error connecting to nekos.best API:', error);
    }
  }

  async warmupCache() {
    // Warm up cache with a few images from each endpoint
    const warmupPromises = this.availableEndpoints.map(async (endpoint) => {
      try {
        const response = await axios.get(`${this.baseURL}/${endpoint}?amount=3`);
        if (response.data && response.data.results) {
          this.cache.set(endpoint, response.data.results);
        }
      } catch (error) {
        console.error(`Error warming up ${endpoint}:`, error.message);
      }
    });

    await Promise.all(warmupPromises);
  }

  async getRandomCharacters(count = 1) {
    try {
      console.log(`Getting ${count} random characters from nekos.best...`);
      const characters = [];
      
      // Use Promise.all for parallel requests instead of sequential
      const requests = [];
      for (let i = 0; i < count; i++) {
        const endpoint = this.availableEndpoints[Math.floor(Math.random() * this.availableEndpoints.length)];
        requests.push(this.fetchSingleCharacter(endpoint));
      }
      
      const results = await Promise.all(requests);
      
      // Filter out null results
      const validCharacters = results.filter(char => char !== null);
      console.log(`Successfully fetched ${validCharacters.length} characters`);
      
      return validCharacters;
    } catch (error) {
      console.error('Error fetching characters from nekos.best:', error.message);
      // Return fallback character if API fails
      return this.getFallbackCharacters(count);
    }
  }

  async fetchSingleCharacter(endpoint) {
    try {
      console.log(`Fetching from endpoint: ${endpoint}`);
      
      const response = await axios.get(`${this.baseURL}/${endpoint}?amount=1`, {
        timeout: 3000
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const imageData = response.data.results[0];
        
        const character = {
          name: this.generateCharacterName(endpoint, imageData),
          series: this.getSeriesFromEndpoint(endpoint),
          image: imageData.url,
          artist: imageData.artist_name || 'Unknown Artist',
          source: imageData.source_url || '',
          type: endpoint,
          id: this.generateId(imageData.url)
        };
        
        console.log(`Character created: ${character.name}`);
        return character;
      } else {
        console.warn(`No results from ${endpoint}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error.message);
      return null;
    }
  }

  getFallbackCharacters(count) {
    console.log('Using fallback characters due to API issues');
    const fallbackCharacters = [];
    
    for (let i = 0; i < count; i++) {
      const endpoint = this.availableEndpoints[Math.floor(Math.random() * this.availableEndpoints.length)];
      fallbackCharacters.push({
        name: this.generateCharacterName(endpoint, {}),
        series: this.getSeriesFromEndpoint(endpoint),
        image: 'https://nekos.best/api/v2/neko/001.png', // Fallback image
        artist: 'Unknown Artist',
        source: '',
        type: endpoint,
        id: Math.random().toString(36).substring(2, 15)
      });
    }
    
    return fallbackCharacters;
  }

  generateCharacterName(endpoint, imageData) {
    // Generate unique character names based on endpoint and image
    const names = {
      neko: [
        'Akira', 'Yuki', 'Sora', 'Kira', 'Miko', 'Neko', 'Hana', 'Riku',
        'Taki', 'Yura', 'Kaia', 'Zara', 'Luna', 'Nova', 'Iris', 'Mira',
        'Nyx', 'Vera', 'Kira', 'Zena', 'Aria', 'Emi', 'Rei', 'Saki'
      ],
      waifu: [
        'Sakura', 'Miyuki', 'Ayame', 'Yui', 'Rin', 'Kana', 'Miku', 'Nami',
        'Tsubaki', 'Haruka', 'Akane', 'Kotone', 'Shiori', 'Yuka', 'Mei',
        'Rena', 'Seira', 'Misaki', 'Yukina', 'Asuka', 'Hinata', 'Kokoro'
      ],
      husbando: [
        'Takeshi', 'Hiroshi', 'Kenji', 'Ryuu', 'Kaito', 'Shiro', 'Akio',
        'Daisuke', 'Haru', 'Satoshi', 'Ryo', 'Kento', 'Yuto', 'Shin',
        'Kazuki', 'Makoto', 'Ren', 'Taro', 'Yuuma', 'Kei', 'Sho', 'Jin'
      ],
      kitsune: [
        'Kitsune', 'Inari', 'Tamamo', 'Yuki', 'Shirou', 'Akira', 'Rui',
        'Kage', 'Mizu', 'Tsuki', 'Hoshi', 'Kaze', 'Yama', 'Mori', 'Sora',
        'Tora', 'Riku', 'Kira', 'Nagi', 'Shion', 'Zen', 'Kai', 'Yoru'
      ]
    };

    const nameList = names[endpoint] || names.neko;
    const randomName = nameList[Math.floor(Math.random() * nameList.length)];
    
    // Add unique suffix based on image URL to prevent duplicates
    const urlHash = imageData.url.split('/').pop().split('.')[0].substring(0, 4);
    return `${randomName} ${urlHash.toUpperCase()}`;
  }

  getSeriesFromEndpoint(endpoint) {
    const series = {
      neko: 'Neko Chronicles',
      waifu: 'Waifu Collection',
      husbando: 'Husbando Academy',
      kitsune: 'Kitsune Legends'
    };
    
    return series[endpoint] || 'Anime Collection';
  }

  generateId(url) {
    // Extract unique ID from URL
    const matches = url.match(/([a-f0-9-]+)\.png$/);
    return matches ? matches[1] : Math.random().toString(36).substring(2, 15);
  }

  async getGifCharacter() {
    try {
      console.log('Getting GIF character from nekos.best...');
      // Get random GIF endpoint
      const endpoint = this.gifEndpoints[Math.floor(Math.random() * this.gifEndpoints.length)];
      console.log(`Fetching GIF from endpoint: ${endpoint}`);
      
      const response = await axios.get(`${this.baseURL}/${endpoint}?amount=1`, {
        timeout: 3000
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const imageData = response.data.results[0];
        
        const character = {
          name: this.generateGifCharacterName(endpoint),
          series: `${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} Chronicles`,
          image: imageData.url,
          artist: imageData.artist_name || 'Unknown Artist',
          source: imageData.source_url || '',
          type: endpoint,
          id: this.generateId(imageData.url),
          isGif: true
        };
        
        console.log(`GIF character created: ${character.name}`);
        return character;
      } else {
        console.warn(`No GIF results from ${endpoint}`);
        return this.getFallbackGifCharacter(endpoint);
      }
    } catch (error) {
      console.error('Error fetching GIF character:', error.message);
      return this.getFallbackGifCharacter();
    }
  }

  getFallbackGifCharacter(endpoint = 'happy') {
    console.log('Using fallback GIF character due to API issues');
    return {
      name: this.generateGifCharacterName(endpoint),
      series: `${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} Chronicles`,
      image: 'https://nekos.best/api/v2/happy/001.gif', // Fallback GIF
      artist: 'Unknown Artist',
      source: '',
      type: endpoint,
      id: Math.random().toString(36).substring(2, 15),
      isGif: true
    };
  }

  generateGifCharacterName(endpoint) {
    const actionNames = {
      lurk: 'Shadow Lurker',
      shoot: 'Marksman',
      sleep: 'Dreamer',
      shrug: 'Indifferent',
      stare: 'Observer',
      wave: 'Greeter',
      poke: 'Prankster',
      smile: 'Cheerful',
      peck: 'Affectionate',
      wink: 'Charmer',
      blush: 'Shy',
      smug: 'Confident',
      tickle: 'Playful',
      yeet: 'Thrower',
      think: 'Philosopher',
      highfive: 'Celebrator',
      feed: 'Caretaker',
      bite: 'Feisty',
      bored: 'Listless',
      nom: 'Hungry',
      yawn: 'Sleepy',
      facepalm: 'Exasperated',
      cuddle: 'Cuddly',
      kick: 'Fighter',
      happy: 'Joyful',
      hug: 'Hugger',
      baka: 'Silly',
      pat: 'Gentle',
      angry: 'Furious',
      run: 'Runner',
      nod: 'Agreeable',
      nope: 'Defiant',
      kiss: 'Romantic',
      dance: 'Dancer',
      punch: 'Brawler',
      handshake: 'Diplomat',
      slap: 'Fierce',
      cry: 'Emotional',
      pout: 'Sulky',
      handhold: 'Tender',
      thumbsup: 'Positive',
      laugh: 'Joker'
    };

    const baseName = actionNames[endpoint] || 'Mysterious';
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${baseName} ${suffix}`;
  }

  // Get statistics
  getStats() {
    return {
      totalEndpoints: this.availableEndpoints.length,
      gifEndpoints: this.gifEndpoints.length,
      totalTypes: this.availableEndpoints.length + this.gifEndpoints.length,
      cacheSize: this.cache.size
    };
  }
}

module.exports = NekosCharacterSystem;