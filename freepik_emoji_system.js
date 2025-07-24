const axios = require('axios');

// Freepik API integration for icons and emojis
class FreepikEmojiSystem {
  constructor() {
    this.apiKey = process.env.FREEPIK_API_KEY;
    this.baseURL = 'https://api.freepik.com/v1';
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
  }

  // Get icons from Freepik API
  async searchIcons(query, limit = 20) {
    const cacheKey = `icons_${query}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseURL}/icons`, {
        params: {
          term: query,
          limit: limit,
          page: 1
        },
        headers: {
          'x-freepik-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      const icons = response.data.data || [];
      
      this.cache.set(cacheKey, {
        data: icons,
        timestamp: Date.now()
      });
      
      return icons;
    } catch (error) {
      console.error('Error fetching Freepik icons:', error.response?.data || error.message);
      return [];
    }
  }

  // Get game-related icons for the bot
  async getGameIcons() {
    const gameTerms = ['sword', 'shield', 'fire', 'lightning', 'star', 'heart', 'gem', 'crown'];
    const allIcons = [];
    
    for (const term of gameTerms) {
      const icons = await this.searchIcons(term, 5);
      allIcons.push(...icons);
    }
    
    return allIcons;
  }

  // Get battle-related icons
  async getBattleIcons() {
    const battleTerms = ['fight', 'battle', 'combat', 'attack', 'defense'];
    const allIcons = [];
    
    for (const term of battleTerms) {
      const icons = await this.searchIcons(term, 3);
      allIcons.push(...icons);
    }
    
    return allIcons;
  }

  // Get card rarity icons
  async getRarityIcons() {
    const rarityTerms = ['diamond', 'gold', 'silver', 'bronze', 'platinum'];
    const allIcons = [];
    
    for (const term of rarityTerms) {
      const icons = await this.searchIcons(term, 2);
      allIcons.push(...icons);
    }
    
    return allIcons;
  }

  // Convert icon to emoji-like format for Discord
  formatIconAsEmoji(icon) {
    if (!icon || !icon.preview) return '⭐';
    
    // For now, return a fallback emoji based on the icon type
    // In the future, we could upload these as custom Discord emojis
    const iconKeywords = icon.tags?.join(' ').toLowerCase() || '';
    
    if (iconKeywords.includes('fire')) return '🔥';
    if (iconKeywords.includes('lightning')) return '⚡';
    if (iconKeywords.includes('sword')) return '⚔️';
    if (iconKeywords.includes('shield')) return '🛡️';
    if (iconKeywords.includes('star')) return '⭐';
    if (iconKeywords.includes('heart')) return '❤️';
    if (iconKeywords.includes('gem')) return '💎';
    if (iconKeywords.includes('crown')) return '👑';
    
    return '✨';
  }
}

module.exports = FreepikEmojiSystem;