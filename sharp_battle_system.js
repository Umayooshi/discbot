const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

class SharpBattleSystem {
  constructor() {
    this.battleWidth = 800;
    this.battleHeight = 600;
    this.cardWidth = 120;
    this.cardHeight = 180;
    this.cardSpacing = 25;
  }

  // Generate clean embedded battle image like the reference
  async generateBattleImage(battleState) {
    try {
      console.log('Generating clean embedded battle image...');
      
      const canvas = createCanvas(this.battleWidth, this.battleHeight);
      const ctx = canvas.getContext('2d');
      
      // Clean dark background
      ctx.fillStyle = '#2c2f33';
      ctx.fillRect(0, 0, this.battleWidth, this.battleHeight);
      
      // Draw player team (top row)
      await this.drawTeamRow(ctx, battleState.playerTeam, 'YOUR TEAM', 50, '#5865f2');
      
      // Draw VS divider
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('VS', this.battleWidth / 2, this.battleHeight / 2);
      
      // Draw AI team (bottom row)
      await this.drawTeamRow(ctx, battleState.aiTeam, 'AI TEAM', 350, '#ed4245');
      
      console.log('Clean embedded battle image generated');
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      console.error('Error generating battle image:', error);
      throw error;
    }
  }

  // Create professional battle background with gradients and effects
  async createBattleBackground() {
    const canvas = createCanvas(this.battleWidth, this.battleHeight);
    const ctx = canvas.getContext('2d');
    
    // Battle arena gradient background
    const gradient = ctx.createRadialGradient(
      this.battleWidth / 2, this.battleHeight / 2, 0,
      this.battleWidth / 2, this.battleHeight / 2, Math.max(this.battleWidth, this.battleHeight) / 2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.battleWidth, this.battleHeight);
    
    // Add battle arena effects
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    // Center dividing line
    ctx.beginPath();
    ctx.moveTo(50, this.battleHeight / 2);
    ctx.lineTo(this.battleWidth - 50, this.battleHeight / 2);
    ctx.stroke();
    
    // Team sections
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.strokeRect(75, 25, this.battleWidth - 150, 350); // Player section
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.strokeRect(75, 425, this.battleWidth - 150, 350); // AI section
    
    return canvas.toBuffer('image/png');
  }

  // Draw clean team row directly on canvas
  async drawTeamRow(ctx, team, headerText, yPosition, headerColor) {
    // Team header
    ctx.fillStyle = headerColor;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(headerText, this.battleWidth / 2, yPosition - 10);
    
    // Calculate card positioning for center alignment
    const totalWidth = (team.length * this.cardWidth) + ((team.length - 1) * this.cardSpacing);
    const startX = (this.battleWidth - totalWidth) / 2;
    
    // Draw each card
    for (let i = 0; i < Math.min(team.length, 5); i++) {
      const card = team[i];
      const cardX = startX + (i * (this.cardWidth + this.cardSpacing));
      const cardY = yPosition;
      
      // Draw card background
      ctx.fillStyle = '#23272a';
      ctx.fillRect(cardX, cardY, this.cardWidth, this.cardHeight);
      
      // Load and draw character image
      try {
        const characterImage = await loadImage(card.imageUrl || card.image);
        ctx.save();
        ctx.beginPath();
        ctx.rect(cardX + 5, cardY + 5, this.cardWidth - 10, this.cardHeight - 40);
        ctx.clip();
        ctx.drawImage(characterImage, cardX + 5, cardY + 5, this.cardWidth - 10, this.cardHeight - 40);
        ctx.restore();
      } catch (error) {
        // Fallback colored rectangle
        ctx.fillStyle = '#5865f2';
        ctx.fillRect(cardX + 5, cardY + 5, this.cardWidth - 10, this.cardHeight - 40);
      }
      
      // Character name at bottom of card
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const displayName = card.name.length > 12 ? card.name.substring(0, 9) + '...' : card.name;
      ctx.fillText(displayName, cardX + this.cardWidth / 2, cardY + this.cardHeight - 20);
      
      // Health bar below card
      this.drawCleanHealthBar(ctx, cardX, cardY + this.cardHeight + 5, this.cardWidth, card);
    }
  }

  // Generate individual battle card (preserves animations if GIF)
  async generateBattleCard(card) {
    try {
      // Check if card has animated GIF
      if (this.isAnimatedCard(card)) {
        // Use Sharp GIF system for animated cards
        const SharpGifSystem = require('./sharp_gif_system');
        const gifSystem = new SharpGifSystem();
        return await gifSystem.generateAnimatedCard(card);
      } else {
        // Use standard card generation for static cards
        return await this.generateStaticBattleCard(card);
      }
    } catch (error) {
      console.error('Error generating battle card:', error);
      // Return fallback card
      return await this.generateFallbackCard(card);
    }
  }

  // Check if card should be animated
  isAnimatedCard(card) {
    // Cards that should use GIF animation in battles
    const animatedCharacters = ['Makima', 'Megumin'];
    return animatedCharacters.includes(card.name);
  }

  // Generate static battle card with proper scaling
  async generateStaticBattleCard(card) {
    const canvas = createCanvas(this.cardWidth, this.cardHeight);
    const ctx = canvas.getContext('2d');
    
    // Load character image
    let characterImage;
    try {
      characterImage = await loadImage(card.imageUrl || card.image);
    } catch (error) {
      console.log('Failed to load character image, using fallback');
      return await this.generateFallbackCard(card);
    }
    
    // Draw character image to fit card
    ctx.drawImage(characterImage, 0, 0, this.cardWidth, this.cardHeight);
    
    // Add card overlay with character info
    const overlayGradient = ctx.createLinearGradient(0, this.cardHeight * 0.7, 0, this.cardHeight);
    overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, this.cardHeight * 0.7, this.cardWidth, this.cardHeight * 0.3);
    
    // Character name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const displayName = card.name.length > 12 ? card.name.substring(0, 9) + '...' : card.name;
    ctx.fillText(displayName, this.cardWidth / 2, this.cardHeight - 15);
    
    return canvas.toBuffer('image/png');
  }

  // Generate fallback card for errors
  async generateFallbackCard(card) {
    const canvas = createCanvas(this.cardWidth, this.cardHeight);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.cardHeight);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);
    
    // Character name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.name || 'Unknown', this.cardWidth / 2, this.cardHeight / 2);
    
    return canvas.toBuffer('image/png');
  }

  // Draw clean health bar like the reference image
  drawCleanHealthBar(ctx, x, y, width, card) {
    const barHeight = 6;
    const currentHP = card.currentHP || card.stats?.hp || 100;
    const maxHP = card.stats?.maxHp || card.stats?.hp || 100;
    const healthPercent = Math.max(0, currentHP / maxHP);
    
    // Background bar (dark)
    ctx.fillStyle = '#40444b';
    ctx.fillRect(x, y, width, barHeight);
    
    // Health bar color based on percentage
    let healthColor;
    if (healthPercent > 0.6) healthColor = '#43b581'; // Green
    else if (healthPercent > 0.3) healthColor = '#faa61a'; // Orange
    else healthColor = '#f04747'; // Red
    
    // Health bar fill
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, width * healthPercent, barHeight);
    
    // HP text below bar
    ctx.fillStyle = '#dcddde';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentHP}/${maxHP}`, x + width / 2, y + barHeight + 12);
  }
}

module.exports = SharpBattleSystem;