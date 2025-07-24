const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

class AdvancedImageSystem {
  constructor() {
    this.cache = new Map();
    this.templateCache = new Map();
  }

  // Create battle interface like professional Discord bots
  async createBattleInterface(battleState) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Discord dark theme
    ctx.fillStyle = '#36393f';
    ctx.fillRect(0, 0, width, height);

    // Create team sections
    await this.drawTeamSection(ctx, 'Your Team', battleState.playerTeam, 20, 20, '#43b581');
    await this.drawTeamSection(ctx, 'Enemy Team', battleState.aiTeam, 20, 320, '#f04747');

    // Battle logs
    if (battleState.battleLog.length > 0) {
      await this.drawBattleLogs(ctx, battleState.battleLog, 20, 520);
    }

    return canvas.toBuffer('image/png');
  }

  async drawTeamSection(ctx, title, team, x, y, color) {
    // Section header
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 760, 35);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(title, x + 15, y + 24);

    // Draw each card
    for (let i = 0; i < team.length; i++) {
      const card = team[i];
      const cardY = y + 45 + (i * 80);
      await this.drawCard(ctx, card, x + 10, cardY);
    }
  }

  async drawCard(ctx, card, x, y) {
    // Card background
    const cardBg = card.isAlive ? '#40444b' : '#2f3136';
    ctx.fillStyle = cardBg;
    ctx.fillRect(x, y, 740, 70);

    // Card portrait area
    ctx.fillStyle = this.getClassColor(card.class);
    ctx.fillRect(x + 5, y + 5, 60, 60);

    // Class icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(this.getClassIcon(card.class), x + 27, y + 40);

    // Card info
    ctx.fillStyle = card.isAlive ? '#ffffff' : '#72767d';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(card.name, x + 75, y + 25);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = this.getClassColor(card.class);
    ctx.fillText(card.class, x + 75, y + 45);

    // HP bar
    const hpBarWidth = 200;
    const hpBarHeight = 8;
    const hpBarX = x + 75;
    const hpBarY = y + 55;

    // HP background
    ctx.fillStyle = '#2f3136';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    // HP fill
    const hpPercent = card.stats.hp / card.stats.maxHp;
    let hpColor = '#3ba55d';
    if (hpPercent < 0.5) hpColor = '#faa61a';
    if (hpPercent < 0.25) hpColor = '#ed4245';

    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`${card.stats.hp}/${card.stats.maxHp}`, hpBarX + hpBarWidth + 10, hpBarY + 6);

    // Status effects
    if (!card.isAlive) {
      ctx.fillStyle = 'rgba(237, 66, 69, 0.3)';
      ctx.fillRect(x, y, 740, 70);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('💀 DEFEATED', x + 300, y + 40);
    }
  }

  async drawBattleLogs(ctx, logs, x, y) {
    // Log background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, 760, 60);

    // Log title
    ctx.fillStyle = '#faa61a';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('⚔️ Battle Log', x + 10, y + 20);

    // Recent logs
    const recentLogs = logs.slice(-4);
    let logText = recentLogs.map(log => log.message).join(' • ');
    
    // Truncate if too long
    if (logText.length > 80) {
      logText = logText.substring(0, 77) + '...';
    }

    ctx.fillStyle = '#dcddde';
    ctx.font = '12px Arial';
    ctx.fillText(logText, x + 10, y + 40);
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

  getClassIcon(cardClass) {
    const icons = {
      'Tank': '🛡',
      'Damage': '⚔',
      'Support': '💚',
      'Intel': '🧠'
    };
    return icons[cardClass] || '⚡';
  }

  // Generate card images for collection display
  async generateCardImage(card, options = {}) {
    const width = options.width || 300;
    const height = options.height || 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Card background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.getClassColor(card.class));
    gradient.addColorStop(1, this.darkenColor(this.getClassColor(card.class)));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Card border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    // Character portrait area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(20, 20, width - 40, 200);

    // Card info section
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, height - 120, width, 120);

    // Character name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    const nameText = this.truncateText(ctx, card.name, width - 40);
    ctx.fillText(nameText, 20, height - 85);

    // Series
    ctx.font = '14px Arial';
    ctx.fillStyle = '#b9bbbe';
    const seriesText = this.truncateText(ctx, card.series || 'Unknown', width - 40);
    ctx.fillText(seriesText, 20, height - 65);

    // Class and level
    ctx.fillStyle = this.getClassColor(card.class);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${card.class} • Level ${card.level || 1}`, 20, height - 40);

    // Print number
    if (card.printNumber) {
      ctx.fillStyle = this.getPrintColor(card.printNumber);
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`#${card.printNumber}`, width - 60, height - 20);
    }

    return canvas.toBuffer('image/png');
  }

  // Helper methods
  truncateText(ctx, text, maxWidth) {
    let width = ctx.measureText(text).width;
    if (width <= maxWidth) return text;
    
    while (width > maxWidth && text.length > 1) {
      text = text.slice(0, -1);
      width = ctx.measureText(text + '...').width;
    }
    return text + '...';
  }

  darkenColor(color) {
    // Simple color darkening
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const amt = -40;
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    return color;
  }

  getPrintColor(printNumber) {
    if (printNumber === 1) return '#ffd700'; // Gold
    if (printNumber <= 10) return '#c0c0c0'; // Silver
    return '#ffffff'; // White
  }

  // Cache management
  clearCache() {
    this.cache.clear();
    this.templateCache.clear();
  }
}

module.exports = new AdvancedImageSystem();