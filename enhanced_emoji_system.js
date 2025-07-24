const emojiAPI = require('./emojiAPI');
const FreepikEmojiSystem = require('./freepik_emoji_system');

// Combined emoji system using both emoji.gg and Freepik
class EnhancedEmojiSystem {
  constructor() {
    this.emojiAPI = emojiAPI; // Already an instance
    this.freepikAPI = new FreepikEmojiSystem();
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
  }

  // Get enhanced game emojis combining both sources
  async getGameEmojis() {
    const cacheKey = 'enhanced_game_emojis';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Get emojis from emoji.gg
      const emojiGGEmojis = await this.emojiAPI.getGameEmojis();
      
      // Get Freepik icons and convert to emoji format
      const freepikIcons = await this.freepikAPI.getGameIcons();
      
      // Combine both sources with Freepik as backup
      const enhancedEmojis = {
        // Primary emojis from emoji.gg
        sparkle: emojiGGEmojis.sparkle || '✨',
        crown: emojiGGEmojis.crown || '👑',
        sword: emojiGGEmojis.sword || '⚔️',
        shield: emojiGGEmojis.shield || '🛡️',
        lightning: emojiGGEmojis.lightning || '⚡',
        heart: emojiGGEmojis.heart || '💚',
        star: emojiGGEmojis.star || '⭐',
        gem: emojiGGEmojis.gem || '💎',
        
        // Additional battle emojis
        fire: '🔥',
        magic: '🌟',
        potion: '🧪',
        scroll: '📜',
        bow: '🏹',
        hammer: '🔨',
        crystal: '🔮',
        trophy: '🏆'
      };

      this.cache.set(cacheKey, {
        data: enhancedEmojis,
        timestamp: Date.now()
      });

      return enhancedEmojis;
    } catch (error) {
      console.error('Error getting enhanced emojis:', error);
      // Return fallback emojis
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
  }

  // Get battle-specific emojis
  async getBattleEmojis() {
    const gameEmojis = await this.getGameEmojis();
    return {
      attack: gameEmojis.sword,
      defend: gameEmojis.shield,
      critical: gameEmojis.lightning,
      heal: gameEmojis.heart,
      boost: gameEmojis.star,
      victory: gameEmojis.trophy,
      defeat: '💀'
    };
  }

  // Get rarity emojis for cards
  async getRarityEmojis() {
    return {
      static: '⚪',      // Common/Static
      animated_3d: '🟡',   // Rare/3D  
      animated_gif: '🟠'   // Epic/Animated
    };
  }

  // Get class emojis for characters
  getClassEmojis() {
    return {
      'Tank': '🛡️',
      'Damage': '⚔️', 
      'Support': '💚',
      'Intel': '⚡'
    };
  }

  // Get level progression emojis
  getLevelEmojis(level) {
    if (level >= 100) return '💎';
    if (level >= 50) return '🔥';
    if (level >= 25) return '⭐';
    if (level >= 10) return '✨';
    return '🌟';
  }
}

module.exports = new EnhancedEmojiSystem();