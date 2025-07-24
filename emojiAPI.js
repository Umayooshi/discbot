const axios = require('axios');

// Emoji.gg API integration
class EmojiAPI {
  constructor() {
    this.baseURL = 'https://emoji.gg/api';
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Get all emojis from emoji.gg
  async getAllEmojis() {
    const cacheKey = 'all_emojis';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await axios.get(this.baseURL);
      const emojis = response.data;
      
      this.cache.set(cacheKey, {
        data: emojis,
        timestamp: Date.now()
      });
      
      return emojis;
    } catch (error) {
      console.error('Error fetching emojis:', error);
      return [];
    }
  }

  // Get emoji by name or partial match
  async findEmoji(searchTerm) {
    const allEmojis = await this.getAllEmojis();
    
    return allEmojis.filter(emoji => 
      emoji.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emoji.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Get emoji by ID
  async getEmojiById(id) {
    const allEmojis = await this.getAllEmojis();
    return allEmojis.find(emoji => emoji.id === id);
  }

  // Get emojis by category
  async getEmojisByCategory(category) {
    const allEmojis = await this.getAllEmojis();
    return allEmojis.filter(emoji => emoji.category === category);
  }

  // Get random emoji
  async getRandomEmoji() {
    const allEmojis = await this.getAllEmojis();
    if (allEmojis.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * allEmojis.length);
    return allEmojis[randomIndex];
  }

  // Get emoji categories
  async getCategories() {
    const cacheKey = 'categories';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseURL}?request=categories`);
      const categories = response.data;
      
      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now()
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get emoji statistics
  async getStats() {
    try {
      const response = await axios.get(`${this.baseURL}?request=stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }

  // Format emoji for Discord embed
  formatEmojiForDiscord(emoji) {
    return {
      name: emoji.title,
      value: `[Download](${emoji.image}) • Category: ${emoji.category}`,
      inline: true
    };
  }

  // Get themed emojis for game elements
  async getGameEmojis() {
    // Return Unicode emojis that work universally in Discord
    // Custom server emojis from emoji.gg won't work unless bot has access to those servers
    return {
      sparkle: '✨',
      crown: '👑', 
      sword: '⚔️',
      shield: '🛡️',
      lightning: '⚡',
      heart: '💚',
      star: '⭐',
      gem: '💎',
      fire: '🔥',
      magic: '🌟',
      potion: '🧪',
      scroll: '📜',
      bow: '🏹',
      hammer: '🔨',
      crystal: '🔮',
      trophy: '🏆'
    };
  }

  // Get battle-themed emojis
  async getBattleEmojis() {
    const battleTerms = ['sword', 'shield', 'fire', 'lightning', 'star', 'crown'];
    const battleEmojis = [];
    
    for (const term of battleTerms) {
      const emojis = await this.findEmoji(term);
      if (emojis.length > 0) {
        battleEmojis.push(emojis[0]); // Take first match
      }
    }
    
    return battleEmojis;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new EmojiAPI();