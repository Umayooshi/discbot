const { createCanvas, loadImage } = require('canvas');

class AuraSystem {
  constructor() {
    this.auraTypes = {
      'snowflake': {
        name: 'Snowflake',
        file: './attached_assets/snowflake_1752974702827.png',
        description: 'Gentle snowflakes falling around your card',
        rarity: 'common',
        cost: 200,
        currency: 'lumens',
        emoji: '❄️'
      },
      'firework': {
        name: 'Fireworks',
        file: './attached_assets/firework_1752974708819.png',
        description: 'Colorful firework bursts celebrating your card',
        rarity: 'rare',
        cost: 500,
        currency: 'mythicShards',
        emoji: '🎆'
      }
    };
  }

  async applyAura(cardBuffer, auraType) {
    try {
      if (!this.auraTypes[auraType]) {
        throw new Error(`Unknown aura type: ${auraType}`);
      }

      const canvas = createCanvas(400, 600);
      const ctx = canvas.getContext('2d');

      // Draw base card
      const cardImage = await loadImage(cardBuffer);
      ctx.drawImage(cardImage, 0, 0, 400, 600);

      // Apply aura overlay with proper blending to preserve card elements
      const auraPath = this.auraTypes[auraType].file;
      const auraOverlay = await loadImage(auraPath);
      
      // Use overlay blend mode to preserve text and frames while adding effects
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.4; // Reduced transparency to preserve readability
      ctx.drawImage(auraOverlay, 0, 0, 400, 600);
      
      // Add a second layer with multiply for depth
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
      ctx.drawImage(auraOverlay, 0, 0, 400, 600);
      
      // Reset blend mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error applying aura:', error);
      return cardBuffer; // Return original card if aura fails
    }
  }

  getAuraInfo(auraType) {
    return this.auraTypes[auraType] || null;
  }

  getAllAuras() {
    return Object.keys(this.auraTypes).map(key => ({
      id: key,
      ...this.auraTypes[key]
    }));
  }

  async createAuraPreview(auraType) {
    try {
      if (!this.auraTypes[auraType]) {
        return null;
      }

      const canvas = createCanvas(400, 600);
      const ctx = canvas.getContext('2d');

      // Create a simple preview card background
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 600);

      // Add preview text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PREVIEW', 200, 300);
      ctx.font = '18px Arial';
      ctx.fillText(this.auraTypes[auraType].name, 200, 330);

      // Apply aura effect
      const auraPath = this.auraTypes[auraType].file;
      const auraOverlay = await loadImage(auraPath);
      
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.4;
      ctx.drawImage(auraOverlay, 0, 0, 400, 600);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error creating aura preview:', error);
      return null;
    }
  }

  canAfford(player, auraType) {
    const aura = this.auraTypes[auraType];
    if (!aura) return false;

    const currency = aura.currency;
    const cost = aura.cost;

    switch (currency) {
      case 'lumens':
        return player.lumens >= cost;
      case 'mythicShards':
        return player.mythicShards >= cost;
      case 'novaGems':
        return player.novaGems >= cost;
      default:
        return false;
    }
  }

  async purchaseAura(player, auraType) {
    const aura = this.auraTypes[auraType];
    if (!aura || !this.canAfford(player, auraType)) {
      return false;
    }

    const currency = aura.currency;
    const cost = aura.cost;

    // Deduct currency
    switch (currency) {
      case 'lumens':
        player.lumens -= cost;
        break;
      case 'mythicShards':
        player.mythicShards -= cost;
        break;
      case 'novaGems':
        player.novaGems -= cost;
        break;
    }

    // Add aura to player's collection
    if (!player.unlockedAuras) {
      player.unlockedAuras = [];
    }
    
    if (!player.unlockedAuras.includes(auraType)) {
      player.unlockedAuras.push(auraType);
    }

    await player.save();
    return true;
  }

  hasAura(player, auraType) {
    return player.unlockedAuras && player.unlockedAuras.includes(auraType);
  }

  canAfford(player, auraType) {
    const aura = this.auraTypes[auraType];
    if (!aura) return false;

    const currency = aura.currency;
    const cost = aura.cost;

    switch (currency) {
      case 'lumens':
        return player.lumens >= cost;
      case 'mythicShards':
        return player.mythicShards >= cost;
      case 'novaGems':
        return player.novaGems >= cost;
      default:
        return false;
    }
  }

  async purchaseAura(player, auraType) {
    const aura = this.auraTypes[auraType];
    if (!aura || !this.canAfford(player, auraType)) {
      return false;
    }

    const currency = aura.currency;
    const cost = aura.cost;

    // Deduct currency
    switch (currency) {
      case 'lumens':
        player.lumens -= cost;
        break;
      case 'mythicShards':
        player.mythicShards -= cost;
        break;
      case 'novaGems':
        player.novaGems -= cost;
        break;
    }

    // Add aura to player's collection
    if (!player.unlockedAuras) {
      player.unlockedAuras = [];
    }
    
    if (!player.unlockedAuras.includes(auraType)) {
      player.unlockedAuras.push(auraType);
    }

    await player.save();
    return true;
  }
}

module.exports = AuraSystem;