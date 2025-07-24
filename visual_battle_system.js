const { createCanvas, loadImage } = require('canvas');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');

class VisualBattleSystem {
  constructor() {
    // Import universe battlefield configurations
    const { universeBattlefields } = require('./universe_battlefields');
    this.universeBattlefields = universeBattlefields;
    
    this.battleBackgrounds = {
      naruto: '#ff8c00',
      'one piece': '#4169e1', 
      'attack on titan': '#8b4513',
      'dragon ball': '#ffd700',
      'my hero academia': '#32cd32',
      'jujutsu kaisen': '#8b0000',
      'bleach': '#4b0082',
      default: '#483d8b'
    };
  }

  async generateBattleImage(playerCard, enemyCard, battleInfo = {}) {
    try {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');

      // Load and draw the universe-specific battlefield background
      try {
        const universe = battleInfo.universe || 'default';
        const battlefieldUrl = this.universeBattlefields[universe]?.backgroundUrl || 'https://i.imgur.com/2sVTGry.jpeg';
        
        const arenaImage = await loadImage(battlefieldUrl);
        ctx.drawImage(arenaImage, 0, 0, 800, 400);
        
        // Apply blur effect by drawing semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, 800, 400);
        
        // Add subtle color tint based on universe
        const universeLower = (battleInfo.universe || 'default').toLowerCase();
        const bgColor = this.battleBackgrounds[universeLower] || this.battleBackgrounds.default;
        ctx.fillStyle = bgColor + '20'; // 20 = low opacity
        ctx.fillRect(0, 0, 800, 400);
        
      } catch (error) {
        console.error('Failed to load arena background:', error);
        // Fallback to gradient background
        const universeLower = (battleInfo.universe || 'default').toLowerCase();
        const bgColor = this.battleBackgrounds[universeLower] || this.battleBackgrounds.default;
        
        const gradient = ctx.createLinearGradient(0, 0, 800, 400);
        gradient.addColorStop(0, bgColor);
        gradient.addColorStop(0.5, '#2c2c54');
        gradient.addColorStop(1, bgColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 400);
      }

      // Add battle arena border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 760, 360);

      // Overlay actual card images directly on the background
      await this.overlayActualCardImage(ctx, playerCard, 50, 80, 200);
      await this.overlayActualCardImage(ctx, enemyCard, 550, 80, 200);

      // Draw VS in center
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('VS', 400, 220);

      // Remove health bars from image as requested by user

      return canvas.toBuffer();

    } catch (error) {
      console.error('Error generating battle image:', error);
      return null;
    }
  }

  async drawActualCard(ctx, card, x, y, width, borderColor) {
    try {
      // Generate the actual card image using the same system as collection
      const cardImageBuffer = await this.generateCardImageForBattle(card);
      const cardImage = await loadImage(cardImageBuffer);
      
      // Draw the actual card
      ctx.drawImage(cardImage, x, y, width, width * 1.5); // Maintain card aspect ratio
      
      // Add battle border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, width * 1.5);
      
    } catch (error) {
      console.error('Error drawing actual card:', error);
      // Fallback to simple card representation
      await this.drawCardImage(ctx, card, x, y, width, borderColor, true);
    }
  }

  async drawCardImage(ctx, card, x, y, size, borderColor, showPrintNumber = true) {
    try {
      // Load character image
      const image = await loadImage(card.imageUrl || card.image);
      
      // Draw rounded card background
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 10);
      ctx.clip();
      ctx.drawImage(image, x, y, size, size);
      ctx.restore();

      // Draw card border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);

      // Add character name at bottom
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name || 'Unknown', x + size/2, y + size + 20);

      // Add print number only for player cards (collectible cards)
      if (showPrintNumber && card.printNumber) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x + size - 40, y + 5, 35, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${card.printNumber}`, x + size - 22, y + 17);
      }

    } catch (error) {
      console.error('Error drawing card image:', error);
      this.drawPlaceholder(ctx, x, y, size, card.name, borderColor, showPrintNumber);
    }
  }

  drawPlaceholder(ctx, x, y, size, name, borderColor, showPrintNumber = true) {
    // Gradient background
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#4a4a4a');
    gradient.addColorStop(1, '#2a2a2a');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);

    // Character initial
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size/3}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(name ? name.charAt(0).toUpperCase() : '?', x + size/2, y + size/2 + size/8);

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, size, size);

    // Name
    ctx.font = 'bold 16px Arial';
    ctx.fillText(name || 'Unknown', x + size/2, y + size + 20);
  }

  drawEnhancedHPBar(ctx, x, y, width, currentHP, maxHP, color, name) {
    const barHeight = 25;
    const cornerRadius = 12;
    
    // Draw character name above HP bar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + width/2, y - 5);
    
    // Background bar with rounded corners
    ctx.fillStyle = '#2c2c2c';
    ctx.beginPath();
    ctx.roundRect(x, y, width, barHeight, cornerRadius);
    ctx.fill();
    
    // HP fill with rounded corners
    const hpPercentage = Math.max(0, currentHP / maxHP);
    const fillWidth = width * hpPercentage;
    
    if (fillWidth > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, fillWidth, barHeight, cornerRadius);
      ctx.fill();
    }
    
    // Stylish border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, barHeight, cornerRadius);
    ctx.stroke();
    
    // HP text with better styling
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(`${currentHP}/${maxHP}`, x + width/2, y + 17);
    ctx.fillText(`${currentHP}/${maxHP}`, x + width/2, y + 17);
  }

  drawHPBar(ctx, x, y, width, currentHP, maxHP, color) {
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, width, 20);

    // HP fill
    const hpPercentage = Math.max(0, currentHP / maxHP);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * hpPercentage, 20);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, 20);

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentHP}/${maxHP}`, x + width/2, y + 14);
  }

  async overlayActualCardImage(ctx, card, x, y, width) {
    try {
      // Check if card has existing image generation capability
      if (typeof global.generateCardImage === 'function') {
        try {
          const actualCardBuffer = await global.generateCardImage(card);
          if (actualCardBuffer) {
            const actualCardImage = await loadImage(actualCardBuffer);
            const cardHeight = width * 1.5;
            ctx.drawImage(actualCardImage, x, y, width, cardHeight);
            return;
          }
        } catch (error) {
          console.error('Error using global generateCardImage:', error);
        }
      }
      
      // Fallback: Create styled card representation with character image
      const image = await loadImage(card.imageUrl || card.image);
      const cardHeight = width * 1.5;
      
      // Card background with gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
      gradient.addColorStop(0, '#2c3e50');
      gradient.addColorStop(0.7, '#34495e');
      gradient.addColorStop(1, '#2c3e50');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, width, cardHeight);
      
      // Character image area
      const imageHeight = cardHeight - 80;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 10, y + 10, width - 20, imageHeight - 10, 8);
      ctx.clip();
      ctx.drawImage(image, x + 10, y + 10, width - 20, imageHeight - 10);
      ctx.restore();
      
      // Card border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, cardHeight);
      
      // Character name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name || 'Unknown', x + width/2, y + cardHeight - 60);
      
      // Print number for player cards only
      if (card.printNumber && !card.isMissionEnemy) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`#${card.printNumber}`, x + width - 10, y + cardHeight - 10);
      }

      // Fallback for missing images
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, width, width * 1.5);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name || 'Unknown', x + width/2, y + (width * 1.5)/2);
      
    } catch (error) {
      console.error('Error overlaying card image:', error);
      // Fallback rectangle
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, width, width * 1.5);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name || 'Unknown', x + width/2, y + (width * 1.5)/2);
    }
  }

  async generateActualCardImage(card) {
    try {
      const { createCanvas, loadImage } = require('canvas');
      
      const width = 400;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Clean up text for rendering
      const cleanName = (card.name || 'Unknown')
        .replace(/[★☆※]/g, '')
        .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
        .trim();
      
      const cleanSeries = (card.series || 'Unknown')
        .replace(/[★☆※]/g, '')
        .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
        .trim();

      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, width, height);

      // Draw border and character image
      const borderWidth = 15;
      let characterImage;
      
      try {
        characterImage = await loadImage(card.imageUrl || card.image);
      } catch (error) {
        // Generate placeholder if image fails
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(1, '#7b68ee');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cleanName, width/2, height/2);
        return canvas.toBuffer();
      }

      if (characterImage) {
        const renderWidth = width * 0.8;
        const renderHeight = height * 0.8;
        const x = (width - renderWidth) / 2;
        const y = (height - renderHeight) / 2;

        // Draw character image
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, renderWidth, renderHeight);
        ctx.clip();
        ctx.drawImage(characterImage, x, y, renderWidth, renderHeight);
        ctx.restore();
      }

      // Add card text and details
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(cleanName, width/2, height - 80);
      ctx.fillText(cleanName, width/2, height - 80);

      ctx.font = '18px Arial';
      ctx.strokeText(cleanSeries, width/2, height - 50);
      ctx.fillText(cleanSeries, width/2, height - 50);

      // Add print number for player cards
      if (card.printNumber && !card.isMissionEnemy) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'right';
        ctx.strokeText(`#${card.printNumber}`, width - 20, height - 20);
        ctx.fillText(`#${card.printNumber}`, width - 20, height - 20);
      }

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error in generateActualCardImage:', error);
      return null;
    }
  }

  createBattleEmbed(playerCard, enemyCard, battleInfo, battleImageBuffer) {
    const universe = battleInfo.universe || 'Unknown';
    const stage = battleInfo.stage || 1;
    const round = battleInfo.round || 1;
    
    // Create better health bar visualization with rectangle symbols
    const createHealthBar = (current, max) => {
      const percentage = Math.max(0, Math.min(100, (current / max) * 100));
      const filledBars = Math.floor(percentage / 10);
      const emptyBars = 10 - filledBars;
      
      // Use red rectangles for health and white for lost health
      const filled = '🟥'.repeat(filledBars);
      const empty = '⬜'.repeat(emptyBars);
      
      return filled + empty;
    };

    const playerHealthBar = createHealthBar(playerCard.stats.hp, playerCard.stats.maxHp || playerCard.stats.hp);
    const enemyHealthBar = createHealthBar(enemyCard.stats.hp, enemyCard.stats.maxHp || enemyCard.stats.hp);

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${universe} Battle - Stage ${stage}`)
      .setDescription(`**Round ${round}**\n\n` +
        `**${playerCard.name}** ⚔️ **${enemyCard.name}**\n\n` +
        `🔥 **${playerCard.name}**\n` +
        `❤️ \`${playerHealthBar}\` ${playerCard.stats.hp}/${playerCard.stats.maxHp || playerCard.stats.hp}\n` +
        `⚡ ATK: ${playerCard.stats.attack} | 🛡️ DEF: ${playerCard.stats.defense}\n\n` +
        `💀 **${enemyCard.name}**\n` +
        `❤️ \`${enemyHealthBar}\` ${enemyCard.stats.hp}/${enemyCard.stats.maxHp || enemyCard.stats.hp}\n` +
        `⚡ ATK: ${enemyCard.stats.attack} | 🛡️ DEF: ${enemyCard.stats.defense}\n\n` +
        `📋 **Choose your action:**`)
      .setColor('#ff6b35')
      .setFooter({ text: '👊 Punch: High damage • 🛡️ Block: Reduce damage • 💨 Dodge: Avoid + counter' });

    if (battleImageBuffer) {
      embed.setImage('attachment://battle.png');
    }

    return embed;
  }

  createBattleButtons(battleId) {
    const punch = new ButtonBuilder()
      .setCustomId(`mbattle_${battleId}_punch`)
      .setLabel('👊 Punch')
      .setStyle(ButtonStyle.Danger);

    const block = new ButtonBuilder()
      .setCustomId(`mbattle_${battleId}_block`)
      .setLabel('🛡️ Block')
      .setStyle(ButtonStyle.Primary);

    const dodge = new ButtonBuilder()
      .setCustomId(`mbattle_${battleId}_dodge`)
      .setLabel('💨 Dodge')
      .setStyle(ButtonStyle.Secondary);

    return [new ActionRowBuilder().addComponents(punch, block, dodge)];
  }
}

module.exports = new VisualBattleSystem();