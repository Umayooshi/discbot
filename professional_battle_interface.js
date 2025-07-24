const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

class ProfessionalBattleInterface {
  constructor() {
    this.cache = new Map();
    this.activeBattles = new Map();
  }

  // MAIN BATTLE IMAGE GENERATION - Industry Standard Quality
  async createBattleInterface(battleState) {
    const width = 900;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Discord-style dark background
    ctx.fillStyle = '#36393f';
    ctx.fillRect(0, 0, width, height);

    // Professional team section headers
    await this.drawTeamHeader(ctx, 'Your Team', '#43b581', 20, 20, width - 40);
    await this.drawTeamHeader(ctx, 'Enemy Team', '#f04747', 20, 380, width - 40);

    // Draw actual card images for each team member
    await this.drawTeamCards(ctx, battleState.playerTeam, 30, 70, true);
    await this.drawTeamCards(ctx, battleState.aiTeam, 30, 430, false);

    // Battle information panel
    await this.drawBattleInfo(ctx, battleState, 20, 600, width - 40);

    return canvas.toBuffer('image/png');
  }

  // TEAM HEADER - Professional styling
  async drawTeamHeader(ctx, title, color, x, y, width) {
    // Gradient background
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, this.lightenColor(color));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, 40);
    
    // Text with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Bubblegum, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 15, y + 28);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // TEAM CARDS - Actual card images in battle
  async drawTeamCards(ctx, team, startX, startY, isPlayerTeam) {
    const cardWidth = 150;
    const cardHeight = 225;
    const cardSpacing = 160;

    for (let i = 0; i < Math.min(team.length, 5); i++) {
      const card = team[i];
      const x = startX + (i * cardSpacing);
      const y = startY;

      await this.drawBattleCard(ctx, card, x, y, cardWidth, cardHeight, isPlayerTeam);
    }
  }

  // INDIVIDUAL BATTLE CARD - Mini version of full cards
  async drawBattleCard(ctx, card, x, y, width, height, isPlayerTeam) {
    // Card background with team coloring
    const bgColor = isPlayerTeam ? '#2c5234' : '#5c2c2c';
    const borderColor = card.isAlive ? (isPlayerTeam ? '#43b581' : '#f04747') : '#666666';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);
    
    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = card.isAlive ? 3 : 1;
    ctx.strokeRect(x, y, width, height);

    // Character portrait area
    const portraitHeight = height * 0.6;
    await this.drawCardPortrait(ctx, card, x + 5, y + 5, width - 10, portraitHeight);

    // Card info section
    const infoY = y + portraitHeight + 10;
    const infoHeight = height - portraitHeight - 15;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x + 5, infoY, width - 10, infoHeight);

    // Character name
    ctx.fillStyle = card.isAlive ? '#ffffff' : '#999999';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const cardName = this.truncateText(ctx, card.name, width - 15);
    ctx.fillText(cardName, x + width / 2, infoY + 20);

    // HP bar
    await this.drawMiniHealthBar(ctx, card, x + 10, infoY + 30, width - 20);

    // Death overlay
    if (!card.isAlive) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      ctx.fillRect(x, y, width, height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('💀', x + width / 2, y + height / 2);
    }
  }

  // CARD PORTRAIT - Enhanced character display
  async drawCardPortrait(ctx, card, x, y, width, height) {
    try {
      // Class-colored background
      const classColor = this.getClassColor(card.class);
      ctx.fillStyle = classColor;
      ctx.fillRect(x, y, width, height);

      // Try to load character image
      if (card.imageUrl || card.image) {
        const imageUrl = card.imageUrl || card.image;
        const characterImage = await this.loadImageWithCache(imageUrl);
        
        if (characterImage) {
          // Draw character image with proper scaling
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.clip();
          
          // Calculate scaling to maintain aspect ratio
          const scale = Math.max(width / characterImage.width, height / characterImage.height);
          const scaledWidth = characterImage.width * scale;
          const scaledHeight = characterImage.height * scale;
          const offsetX = x + (width - scaledWidth) / 2;
          const offsetY = y + (height - scaledHeight) / 2;
          
          ctx.drawImage(characterImage, offsetX, offsetY, scaledWidth, scaledHeight);
          ctx.restore();
        } else {
          // Fallback to class icon
          this.drawClassIcon(ctx, card.class, x + width / 2, y + height / 2);
        }
      } else {
        // Class icon fallback
        this.drawClassIcon(ctx, card.class, x + width / 2, y + height / 2);
      }
      
    } catch (error) {
      console.error('Error drawing card portrait:', error);
      this.drawClassIcon(ctx, card.class, x + width / 2, y + height / 2);
    }
  }

  // MINI HEALTH BAR - Professional HP display
  async drawMiniHealthBar(ctx, card, x, y, width) {
    const barHeight = 8;
    const hpPercent = Math.max(0, card.stats.hp / card.stats.maxHp);

    // Background
    ctx.fillStyle = '#2f3136';
    ctx.fillRect(x, y, width, barHeight);

    // HP fill with color coding
    let hpColor = '#43b581'; // Green
    if (hpPercent < 0.6) hpColor = '#faa61a'; // Yellow
    if (hpPercent < 0.3) hpColor = '#f04747'; // Red

    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, width * hpPercent, barHeight);

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${card.stats.hp}/${card.stats.maxHp}`, x + width / 2, y + barHeight + 12);
  }

  // BATTLE INFO PANEL - Turn info and logs
  async drawBattleInfo(ctx, battleState, x, y, width) {
    const panelHeight = 80;
    
    // Panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, width, panelHeight);

    // Turn information
    ctx.fillStyle = '#faa61a';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Turn ${battleState.turn}`, x + 20, y + 25);

    // Battle status
    let statusText = 'Battle in Progress';
    let statusColor = '#43b581';
    
    if (battleState.phase === 'ended') {
      if (battleState.winner === 'player') {
        statusText = 'Victory!';
        statusColor = '#43b581';
      } else if (battleState.winner === 'ai') {
        statusText = 'Defeat';
        statusColor = '#f04747';
      } else {
        statusText = 'Draw';
        statusColor = '#faa61a';
      }
    }

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(statusText, x + width / 2, y + 25);

    // Recent battle log
    if (battleState.battleLog && battleState.battleLog.length > 0) {
      const recentLog = battleState.battleLog[battleState.battleLog.length - 1];
      ctx.fillStyle = '#dcddde';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const logText = this.truncateText(ctx, recentLog.message, width - 40);
      ctx.fillText(logText, x + width / 2, y + 50);
    }
  }

  // UTILITY METHODS
  async loadImageWithCache(imageUrl) {
    try {
      if (this.cache.has(imageUrl)) {
        return this.cache.get(imageUrl);
      }

      const image = await loadImage(imageUrl);
      this.cache.set(imageUrl, image);
      return image;
    } catch (error) {
      console.error('Failed to load image:', imageUrl, error.message);
      return null;
    }
  }

  drawClassIcon(ctx, cardClass, centerX, centerY) {
    const icons = {
      'Tank': '🛡️',
      'Damage': '⚔️',
      'Support': '💚',
      'Intel': '🧠'
    };
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[cardClass] || '⚡', centerX, centerY);
  }

  getClassColor(cardClass) {
    const colors = {
      'Tank': '#5865f2',
      'Damage': '#ed4245',
      'Support': '#3ba55d',
      'Intel': '#9966cc'
    };
    return colors[cardClass] || '#99aab5';
  }

  lightenColor(color) {
    // Simple color lightening
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const amt = 40;
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 +
        (G < 255 ? G : 255) * 0x100 + (B < 255 ? B : 255)).toString(16).slice(1);
    }
    return color;
  }

  truncateText(ctx, text, maxWidth) {
    let width = ctx.measureText(text).width;
    if (width <= maxWidth) return text;
    
    while (width > maxWidth && text.length > 1) {
      text = text.slice(0, -1);
      width = ctx.measureText(text + '...').width;
    }
    return text + '...';
  }

  // DISCORD EMBED CREATION
  async createBattleEmbed(battleState) {
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Professional 3v3 Battle Arena')
      .setColor(battleState.phase === 'ended' ? 
        (battleState.winner === 'player' ? '#43b581' : '#f04747') : '#5865f2')
      .setDescription(this.getBattleDescription(battleState))
      .setFooter({ 
        text: `Turn ${battleState.turn} • Professional Battle System powered by Sharp + Canvas`
      });

    // Generate battle interface image
    const battleImage = await this.createBattleInterface(battleState);
    const attachment = new AttachmentBuilder(battleImage, { name: 'professional_battle.png' });
    
    return { embed, attachment };
  }

  getBattleDescription(battleState) {
    if (battleState.phase === 'ended') {
      if (battleState.winner === 'player') {
        return '🎉 **Victory!** Your team has emerged triumphant in this epic battle!';
      } else if (battleState.winner === 'ai') {
        return '💀 **Defeat** The enemy has proven stronger this time. Train and return for revenge!';
      } else {
        return '⚖️ **Draw** Both teams fought valiantly to a standstill!';
      }
    }
    
    return '⚔️ **Battle in Progress** Watch as your carefully selected team battles against formidable opponents!';
  }
}

module.exports = ProfessionalBattleInterface;