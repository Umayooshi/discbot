const axios = require('axios');
require('dotenv').config();

// Freepik Frame System - Uses Freepik API for card frame elements
class FreepikFrameSystem {
  constructor() {
    this.apiKey = process.env.FREEPIK_API_KEY;
    this.baseURL = 'https://api.freepik.com/v1';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // Get frame border elements
  async getFrameBorders(style = 'fantasy') {
    if (!this.apiKey) {
      console.log('No Freepik API key found, using default frames');
      return this.getDefaultFrames();
    }

    const cacheKey = `frames_${style}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const searchTerms = {
        fantasy: ['fantasy border', 'magic frame', 'ornate border'],
        medieval: ['medieval border', 'shield frame', 'heraldic border'],
        modern: ['tech border', 'neon frame', 'digital border'],
        elegant: ['elegant frame', 'decorative border', 'luxury frame'],
        battle: ['battle frame', 'warrior border', 'combat frame']
      };

      const terms = searchTerms[style] || searchTerms.fantasy;
      const frames = [];

      for (const term of terms) {
        const response = await axios.get(`${this.baseURL}/icons`, {
          params: {
            term: term,
            limit: 5,
            page: 1,
            format: 'png'
          },
          headers: {
            'x-freepik-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.data) {
          frames.push(...response.data.data.slice(0, 3));
        }
      }

      const frameData = {
        style: style,
        frames: frames.map(frame => ({
          id: frame.id,
          tags: frame.tags?.map(tag => tag.name) || [],
          downloadUrl: frame.preview || null,
          name: `${style}_frame_${frame.id}`
        })),
        count: frames.length
      };

      this.cache.set(cacheKey, {
        data: frameData,
        timestamp: Date.now()
      });

      return frameData;
    } catch (error) {
      console.error('Error fetching Freepik frames:', error.message);
      return this.getDefaultFrames();
    }
  }

  // Get card background patterns
  async getBackgroundPatterns(rarity = 'common') {
    if (!this.apiKey) {
      return this.getDefaultBackgrounds();
    }

    const cacheKey = `backgrounds_${rarity}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const rarityTerms = {
        common: ['simple pattern', 'basic texture'],
        rare: ['ornate pattern', 'decorative texture'],
        epic: ['magical pattern', 'mystical texture'],
        legendary: ['divine pattern', 'celestial texture']
      };

      const terms = rarityTerms[rarity] || rarityTerms.common;
      const patterns = [];

      for (const term of terms) {
        const response = await axios.get(`${this.baseURL}/icons`, {
          params: {
            term: term,
            limit: 3,
            page: 1
          },
          headers: {
            'x-freepik-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.data) {
          patterns.push(...response.data.data);
        }
      }

      const backgroundData = {
        rarity: rarity,
        patterns: patterns.map(pattern => ({
          id: pattern.id,
          tags: pattern.tags?.map(tag => tag.name) || [],
          downloadUrl: pattern.preview || null,
          name: `${rarity}_bg_${pattern.id}`
        })),
        count: patterns.length
      };

      this.cache.set(cacheKey, {
        data: backgroundData,
        timestamp: Date.now()
      });

      return backgroundData;
    } catch (error) {
      console.error('Error fetching Freepik backgrounds:', error.message);
      return this.getDefaultBackgrounds();
    }
  }

  // Get decorative elements for cards
  async getCardDecorations(theme = 'anime') {
    if (!this.apiKey) {
      return this.getDefaultDecorations();
    }

    try {
      const themeTerms = {
        anime: ['anime decoration', 'manga ornament', 'kawaii element'],
        fantasy: ['fantasy ornament', 'magic decoration', 'mystical symbol'],
        sci_fi: ['tech decoration', 'futuristic ornament', 'cyber element'],
        nature: ['nature decoration', 'floral ornament', 'organic element']
      };

      const terms = themeTerms[theme] || themeTerms.anime;
      const decorations = [];

      for (const term of terms) {
        const response = await axios.get(`${this.baseURL}/icons`, {
          params: {
            term: term,
            limit: 4,
            page: 1
          },
          headers: {
            'x-freepik-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.data) {
          decorations.push(...response.data.data.slice(0, 2));
        }
      }

      return {
        theme: theme,
        decorations: decorations.map(dec => ({
          id: dec.id,
          tags: dec.tags?.map(tag => tag.name) || [],
          downloadUrl: dec.preview || null,
          name: `${theme}_dec_${dec.id}`
        })),
        count: decorations.length
      };
    } catch (error) {
      console.error('Error fetching Freepik decorations:', error.message);
      return this.getDefaultDecorations();
    }
  }

  // Default frames when API is unavailable
  getDefaultFrames() {
    return {
      style: 'default',
      frames: [
        { id: 'default_1', name: 'simple_border', tags: ['simple', 'border'] },
        { id: 'default_2', name: 'elegant_frame', tags: ['elegant', 'frame'] },
        { id: 'default_3', name: 'battle_border', tags: ['battle', 'border'] }
      ],
      count: 3
    };
  }

  // Default backgrounds when API is unavailable
  getDefaultBackgrounds() {
    return {
      rarity: 'default',
      patterns: [
        { id: 'bg_1', name: 'gradient_bg', tags: ['gradient', 'background'] },
        { id: 'bg_2', name: 'texture_bg', tags: ['texture', 'background'] },
        { id: 'bg_3', name: 'pattern_bg', tags: ['pattern', 'background'] }
      ],
      count: 3
    };
  }

  // Default decorations when API is unavailable
  getDefaultDecorations() {
    return {
      theme: 'default',
      decorations: [
        { id: 'dec_1', name: 'star_decoration', tags: ['star', 'decoration'] },
        { id: 'dec_2', name: 'heart_decoration', tags: ['heart', 'decoration'] },
        { id: 'dec_3', name: 'gem_decoration', tags: ['gem', 'decoration'] }
      ],
      count: 3
    };
  }

  // Get frame system statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      apiKey: this.apiKey ? 'Connected' : 'Missing',
      cacheExpiry: this.cacheExpiry / 1000 / 60 + ' minutes'
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = FreepikFrameSystem;