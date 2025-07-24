const { createCanvas, loadImage } = require('canvas');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

class CleanBattleSystem {
  constructor() {
    this.battleWidth = 800;
    this.battleHeight = 400;
    this.cardWidth = 100;
    this.cardHeight = 140;
    this.cardSpacing = 20;
  }

  // Generate clean battle embed with image attachment
  async generateBattleDisplay(battleState, interaction) {
    try {
      // Generate battle image
      const battleImage = await this.generateBattleImage(battleState);
      const attachment = new AttachmentBuilder(battleImage, { name: 'battle.png' });

      // Create clean battle embed
      const embed = new EmbedBuilder()
        .setTitle('⚔️ Strategic Battle')
        .setDescription(`**Turn ${battleState.turn || 1}** | ${battleState.battleLog?.slice(-1)[0]?.message || 'Battle begins!'}`)
        .setImage('attachment://battle.png')
        .setColor('#5865f2')
        .addFields(
          {
            name: '🔹 Your Team',
            value: battleState.playerTeam.map((card, i) => {
              const hp = card.currentHP || card.stats?.hp || 100;
              const maxHp = card.stats?.maxHp || card.stats?.hp || 100;
              const hpBar = this.generateTextHealthBar(hp, maxHp);
              return `**${card.name}** ${hpBar} ${hp}/${maxHp}`;
            }).join('\n'),
            inline: true
          },
          {
            name: '🔸 AI Team',
            value: battleState.aiTeam.map((card, i) => {
              const hp = card.currentHP || card.stats?.hp || 100;
              const maxHp = card.stats?.maxHp || card.stats?.hp || 100;
              const hpBar = this.generateTextHealthBar(hp, maxHp);
              return `**${card.name}** ${hpBar} ${hp}/${maxHp}`;
            }).join('\n'),
            inline: true
          }
        )
        .setFooter({ text: 'Battle updates every 3 seconds' });

      return { embeds: [embed], files: [attachment] };

    } catch (error) {
      console.error('Error generating battle display:', error);
      throw error;
    }
  }

  // Generate text-based health bar for embed
  generateTextHealthBar(current, max) {
    const segments = 10;
    const filled = Math.floor((current / max) * segments);
    const empty = segments - filled;
    
    if (current <= 0) return '💀💀💀💀💀';
    
    const greenSquares = '🟩'.repeat(Math.max(0, filled));
    const whiteSquares = '⬜'.repeat(Math.max(0, empty));
    
    return greenSquares + whiteSquares;
  }

  // Generate clean battle image with just card images
  async generateBattleImage(battleState) {
    try {
      const canvas = createCanvas(this.battleWidth, this.battleHeight);
      const ctx = canvas.getContext('2d');

      // Clean dark background
      ctx.fillStyle = '#36393f';
      ctx.fillRect(0, 0, this.battleWidth, this.battleHeight);

      // Draw Your Team cards (top row)
      await this.drawCardRow(ctx, battleState.playerTeam, 'YOUR TEAM', 50, '#5865f2');

      // Draw center VS
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('VS', this.battleWidth / 2, this.battleHeight / 2 + 7);

      // Draw AI Team cards (bottom row)
      await this.drawCardRow(ctx, battleState.aiTeam, 'AI TEAM', 250, '#ed4245');

      return canvas.toBuffer('image/png');

    } catch (error) {
      console.error('Error generating battle image:', error);
      throw error;
    }
  }

  // Draw row of card images only - no boxes or health bars
  async drawCardRow(ctx, team, title, yPos, color) {
    // Section title
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, this.battleWidth / 2, yPos - 20);

    // Calculate positioning for centered cards
    const teamSize = Math.min(team.length, 3);
    const totalWidth = (teamSize * this.cardWidth) + ((teamSize - 1) * this.cardSpacing);
    const startX = (this.battleWidth - totalWidth) / 2;

    // Draw each card image
    for (let i = 0; i < teamSize; i++) {
      const card = team[i];
      const cardX = startX + (i * (this.cardWidth + this.cardSpacing));
      const cardY = yPos;

      await this.drawCardImage(ctx, card, cardX, cardY);
    }
  }

  // Generate card using EXACT same logic as /drop command
  async drawCardImage(ctx, card, x, y) {
    try {
      // Use the EXACT same card generation logic as /drop command
      const professionalImageSystem = require('./professional_image_system');
      const cardImageBuffer = await professionalImageSystem.generateProfessionalCard(card);
      const cardImage = await loadImage(cardImageBuffer);
      
      // Draw the actual card
      ctx.drawImage(cardImage, x, y, this.cardWidth, this.cardHeight);
      
    } catch (error) {
      throw new Error(`Failed to generate card for ${card.name}: ${error.message}`);
    }
  }

  // Draw clean health bar on card
  drawHealthBar(ctx, card, x, y, width) {
    const barHeight = 4;
    const currentHP = card.currentHP || card.stats?.hp || 100;
    const maxHP = card.stats?.maxHp || card.stats?.hp || 100;
    const healthPercent = Math.max(0, currentHP / maxHP);

    // Background
    ctx.fillStyle = '#40444b';
    ctx.fillRect(x, y, width, barHeight);

    // Health fill
    let healthColor;
    if (healthPercent > 0.6) healthColor = '#43b581'; // Green
    else if (healthPercent > 0.3) healthColor = '#faa61a'; // Orange  
    else if (healthPercent > 0) healthColor = '#f04747'; // Red
    else healthColor = '#747f8d'; // Gray for dead

    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, width * healthPercent, barHeight);

    // HP numbers
    ctx.fillStyle = '#dcddde';
    ctx.font = '7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentHP}/${maxHP}`, x + width / 2, y + barHeight + 8);
  }
}

module.exports = CleanBattleSystem;