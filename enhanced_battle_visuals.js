const { createCanvas, loadImage } = require('canvas');

// Enhanced Battle Visual System - Row-based Card Layout
class EnhancedBattleVisuals {
  constructor() {
    this.cardWidth = 180;
    this.cardHeight = 250;
    this.cardSpacing = 20;
    this.rowSpacing = 40;
  }

  async generateBattleImage(battleState) {
    try {
      const canvasWidth = 1400;
      const canvasHeight = 600;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      // Black background like drop command
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Calculate positions - 5 cards left, VS center, 5 cards right
      const cardWidth = 120;
      const cardHeight = 180;
      const cardSpacing = 15;
      const leftStartX = 50;
      const rightStartX = canvasWidth - 650;
      const cardY = (canvasHeight - cardHeight) / 2;

      // Draw player team (left side - 5 cards)
      for (let i = 0; i < battleState.playerTeam.length; i++) {
        const card = battleState.playerTeam[i];
        const x = leftStartX + (i * (cardWidth + cardSpacing));
        await this.drawSimpleCard(ctx, card, x, cardY, cardWidth, cardHeight, true);
      }

      // Draw AI team (right side - 5 cards)  
      for (let i = 0; i < battleState.aiTeam.length; i++) {
        const card = battleState.aiTeam[i];
        const x = rightStartX + (i * (cardWidth + cardSpacing));
        await this.drawSimpleCard(ctx, card, x, cardY, cardWidth, cardHeight, false);
      }

      // Big VS in center
      ctx.font = 'bold 80px Arial';
      ctx.fillStyle = '#ff6b35';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText('VS', canvasWidth / 2, canvasHeight / 2 + 20);
      ctx.fillText('VS', canvasWidth / 2, canvasHeight / 2 + 20);

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('Error generating battle image:', error);
      return null;
    }
  }

  async drawCardRow(ctx, team, startY, canvasWidth, teamColor) {
    const totalCardsWidth = (this.cardWidth * team.length) + (this.cardSpacing * (team.length - 1));
    const startX = (canvasWidth - totalCardsWidth) / 2;

    for (let i = 0; i < team.length; i++) {
      const card = team[i];
      const x = startX + (i * (this.cardWidth + this.cardSpacing));
      await this.drawCard(ctx, card, x, startY, teamColor);
    }
  }

  async drawSimpleCard(ctx, card, x, y, width, height, isPlayer) {
    const alive = card.isAlive;
    
    // Use the same card generation as drop command - call the main generateCardImage function
    try {
      // Get the main generateCardImage function from index.js context
      const cardImageBuffer = await this.generateCardImageFromIndex(card);
      if (cardImageBuffer) {
        const cardImage = await loadImage(cardImageBuffer);
        
        ctx.save();
        if (!alive) {
          ctx.filter = 'grayscale(100%) brightness(50%)';
        }
        
        // Draw the actual generated card
        ctx.drawImage(cardImage, x, y, width, height);
        ctx.restore();
        
        // Add skull emoji overlay for dead cards
        if (!alive) {
          ctx.font = 'bold 32px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeText('💀', x + width / 2, y + height / 2);
          ctx.fillText('💀', x + width / 2, y + height / 2);
        }
        
        return;
      }
    } catch (error) {
      console.log(`Error generating card for ${card.name}:`, error.message);
    }
    
    // Simple fallback - colored rectangle with name
    ctx.fillStyle = alive ? (isPlayer ? '#4ecdc4' : '#e74c3c') : '#333333';
    ctx.fillRect(x, y, width, height);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(card.name, x + width / 2, y + height / 2);
    
    if (!alive) {
      ctx.font = 'bold 24px Arial';
      ctx.fillText('💀', x + width / 2, y + height / 2 + 20);
    }
  }

  // Helper method to call the main generateCardImage function
  async generateCardImageFromIndex(card) {
    try {
      // Use the same generateCardImage function that works in drop command
      const { createCanvas, loadImage } = require('canvas');
      
      // Helper function to load image with fallback
      async function loadImageWithFallback(url, characterName) {
        try {
          if (!url) throw new Error('No image URL');
          return await loadImage(url);
        } catch (error) {
          console.log(`Loading image for ${characterName} from: ${url}`);
          console.log(`Failed to load image for ${characterName}, using placeholder`);
          
          // Generate placeholder
          const canvas = createCanvas(400, 600);
          const ctx = canvas.getContext('2d');
          const gradient = ctx.createLinearGradient(0, 0, 0, 600);
          gradient.addColorStop(0, '#4a90e2');
          gradient.addColorStop(1, '#7b68ee');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 600);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(characterName || 'Unknown', 200, 300);
          
          return canvas;
        }
      }
      
      // Full card generation like in drop command
      const width = 400;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Clean up text
      const cleanName = (card.name || 'Unknown').replace(/[★☆※]/g, '').trim();
      const cleanSeries = (card.series || 'Unknown').replace(/[★☆※]/g, '').trim();
      
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, width, height);
      
      // Draw border and character image
      const borderWidth = 15;
      const characterImage = await loadImageWithFallback(card.imageUrl, card.name);
      
      const renderWidth = width * 0.8;
      const renderHeight = height * 0.8;
      const x = (width - renderWidth) / 2;
      const y = (height - renderHeight) / 2;
      
      // Draw border
      const borderGradient = ctx.createLinearGradient(x - borderWidth, y - borderWidth, x + renderWidth + borderWidth, y + renderHeight + borderWidth);
      borderGradient.addColorStop(0, 'rgba(75, 144, 226, 0.3)');
      borderGradient.addColorStop(0.5, 'rgba(75, 144, 226, 0.6)');
      borderGradient.addColorStop(1, 'rgba(75, 144, 226, 0.3)');
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - borderWidth, y - borderWidth, renderWidth + 2 * borderWidth, renderHeight + 2 * borderWidth);
      ctx.clip();
      ctx.fillStyle = borderGradient;
      ctx.fillRect(x - borderWidth, y - borderWidth, renderWidth + 2 * borderWidth, renderHeight + 2 * borderWidth);
      ctx.restore();
      
      // Draw character image
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, renderWidth, renderHeight);
      ctx.clip();
      ctx.drawImage(characterImage, x, y, renderWidth, renderHeight);
      ctx.restore();
      
      // Add character name and info
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      
      // Character name
      ctx.font = 'bold 28px Arial';
      ctx.strokeText(cleanName, width / 2, height - 80);
      ctx.fillText(cleanName, width / 2, height - 80);
      
      // Series name
      ctx.font = '18px Arial';
      ctx.strokeText(cleanSeries, width / 2, height - 50);
      ctx.fillText(cleanSeries, width / 2, height - 50);
      
      // Print number (top right)
      if (card.printNumber) {
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.strokeText(`#${card.printNumber}`, width - 20, 40);
        ctx.fillText(`#${card.printNumber}`, width - 20, 40);
      }
      
      return canvas.toBuffer('image/png');
    } catch (error) {
      console.log('Card generation failed:', error);
      return null;
    }
  }

  drawHealthBar(ctx, card, x, y, width, height) {
    const hpPercent = Math.max(0, card.stats.hp / card.stats.maxHp);
    
    // Background
    ctx.fillStyle = '#34495e';
    ctx.fillRect(x, y, width, height);
    
    // Health fill
    const hpColor = hpPercent > 0.6 ? '#27ae60' : hpPercent > 0.3 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, width * hpPercent, height);
    
    // Border
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // HP text
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${card.stats.hp}/${card.stats.maxHp}`, x + width / 2, y + height / 2 + 4);
  }

  async drawBattleInfo(ctx, battleState, canvasWidth, canvasHeight) {
    // Semi-transparent overlay for battle info
    const infoHeight = 120;
    const infoY = (canvasHeight - infoHeight) / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, infoY, canvasWidth, infoHeight);
    
    // Current turn info
    const currentCard = battleState.turnOrder[(battleState.turn - 1) % battleState.turnOrder.length];
    const lastAction = battleState.battleLog.length > 0 ? 
      battleState.battleLog[battleState.battleLog.length - 1] : null;
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`Turn ${battleState.turn}`, canvasWidth / 2, infoY + 35);
    
    if (currentCard) {
      ctx.font = '20px Arial';
      ctx.fillStyle = currentCard.team === 'player' ? '#4ecdc4' : '#e74c3c';
      ctx.fillText(`${currentCard.name}'s Turn`, canvasWidth / 2, infoY + 65);
    }
    
    if (lastAction && lastAction.message) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ecf0f1';
      const actionText = lastAction.message.length > 60 ? 
        lastAction.message.substring(0, 60) + '...' : lastAction.message;
      ctx.fillText(actionText, canvasWidth / 2, infoY + 90);
    }
  }
}

module.exports = new EnhancedBattleVisuals();