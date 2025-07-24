const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

class GifBorderOverlay {
  constructor() {
    this.borderWidth = 20;
    this.borderColor = '#2C3E50';
    this.cornerRadius = 15;
  }

  async createBorderedGif(gifPath, cardData) {
    try {
      // For now, we'll create a static border overlay
      // In the future, this could be expanded to handle frame-by-frame processing
      
      // Load the GIF as a static image (first frame)
      const gif = await loadImage(gifPath);
      
      // Create canvas with border space
      const canvas = createCanvas(gif.width + (this.borderWidth * 2), gif.height + (this.borderWidth * 2));
      const ctx = canvas.getContext('2d');
      
      // Draw border background
      ctx.fillStyle = this.borderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw inner rounded rectangle for image area
      const imageX = this.borderWidth;
      const imageY = this.borderWidth;
      const imageWidth = gif.width;
      const imageHeight = gif.height;
      
      ctx.save();
      ctx.beginPath();
      this.roundRect(ctx, imageX, imageY, imageWidth, imageHeight, this.cornerRadius);
      ctx.clip();
      
      // Draw the GIF frame
      ctx.drawImage(gif, imageX, imageY, imageWidth, imageHeight);
      ctx.restore();
      
      // Add card info overlay
      this.addCardInfoOverlay(ctx, cardData, canvas.width, canvas.height);
      
      // Return as buffer
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      console.error('Error creating bordered GIF:', error);
      return null;
    }
  }

  addCardInfoOverlay(ctx, cardData, width, height) {
    // Add version number (bottom right)
    ctx.textAlign = 'right';
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    
    const versionText = `#${cardData.printNumber}`;
    ctx.strokeText(versionText, width - 20, height - 20);
    ctx.fillText(versionText, width - 20, height - 20);
    
    // Add character name (bottom center)
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Arial';
    const nameText = cardData.name.length > 20 ? cardData.name.substring(0, 20) + '...' : cardData.name;
    const nameY = height - 60;
    ctx.strokeText(nameText, width / 2, nameY);
    ctx.fillText(nameText, width / 2, nameY);
    
    // Add series (bottom center, smaller)
    ctx.font = '18px Arial';
    const seriesText = cardData.series.length > 25 ? cardData.series.substring(0, 25) + '...' : cardData.series;
    const seriesY = height - 35;
    ctx.fillStyle = '#CCCCCC';
    ctx.strokeText(seriesText, width / 2, seriesY);
    ctx.fillText(seriesText, width / 2, seriesY);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Alternative: Create a border frame that can be overlaid on the GIF
  async createBorderFrame(width, height, cardData) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Create transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border frame
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(this.borderWidth/2, this.borderWidth/2, width - this.borderWidth, height - this.borderWidth);
    
    // Add card info overlay
    this.addCardInfoOverlay(ctx, cardData, width, height);
    
    return canvas.toBuffer('image/png');
  }
}

module.exports = GifBorderOverlay;