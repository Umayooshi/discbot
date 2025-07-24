const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const FrameGenerator = require('./frame_generator');

class FrameOverlaySystem {
  constructor() {
    this.frameGenerator = new FrameGenerator();
    this.availableFrames = this.frameGenerator.getFrameData();
  }

  async applyFrameToCard(cardImagePath, frameId, outputPath) {
    try {
      // Load the card image
      const cardImage = await loadImage(cardImagePath);
      
      // Get frame data
      const frameData = this.availableFrames.find(frame => frame.id === frameId);
      if (!frameData) {
        throw new Error(`Frame ${frameId} not found`);
      }

      // Create canvas with card dimensions
      const canvas = createCanvas(cardImage.width, cardImage.height);
      const ctx = canvas.getContext('2d');

      // Draw the original card image
      ctx.drawImage(cardImage, 0, 0);

      // Convert SVG to image and overlay
      const frameImageBuffer = await this.svgToImage(frameData.svg, cardImage.width, cardImage.height, frameId);
      const frameImage = await loadImage(frameImageBuffer);
      
      // Apply frame overlay
      ctx.drawImage(frameImage, 0, 0, cardImage.width, cardImage.height);

      // Save the result
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      
      return outputPath;
    } catch (error) {
      console.error('Error applying frame:', error);
      throw error;
    }
  }

  async svgToImage(svgString, width, height, frameId) {
    // For now, we'll use a simple approach - in production you'd want to use a proper SVG renderer
    // This is a basic implementation that creates a frame effect
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Parse the frame colors from SVG (simplified)
    const primaryColor = this.extractColorFromSVG(svgString, 'primary') || '#8B5CF6';
    const accentColor = this.extractColorFromSVG(svgString, 'accent') || '#C084FC';
    const highlightColor = this.extractColorFromSVG(svgString, 'highlight') || '#DDD6FE';
    
    // Create frame effect manually
    this.drawFrameEffect(ctx, width, height, primaryColor, accentColor, highlightColor, frameId);
    
    return canvas.toBuffer('image/png');
  }

  extractColorFromSVG(svg, type) {
    // Simple color extraction - in production you'd parse SVG properly
    const colorMap = {
      'primary': '#8B5CF6',
      'accent': '#C084FC', 
      'highlight': '#DDD6FE'
    };
    
    if (svg.includes('mystic_purple')) return colorMap.primary;
    if (svg.includes('sakura_bloom')) return '#F472B6';
    if (svg.includes('dragon_flame')) return '#DC2626';
    if (svg.includes('ice_crystal')) return '#0EA5E9';
    if (svg.includes('golden_royalty')) return '#D97706';
    if (svg.includes('shadow_ninja')) return '#1F2937';
    
    return colorMap[type];
  }

  drawFrameEffect(ctx, width, height, primaryColor, accentColor, highlightColor, frameId) {
    ctx.save();
    
    // Different frame styles based on ID
    if (frameId === 'neon_cyber') {
      this.drawNeonCyberFrame(ctx, width, height, primaryColor, accentColor, highlightColor);
    } else if (frameId === 'fire_dragon') {
      this.drawFireDragonFrame(ctx, width, height, primaryColor, accentColor, highlightColor);
    } else if (frameId === 'ice_fortress') {
      this.drawIceFortressFrame(ctx, width, height, primaryColor, accentColor, highlightColor);
    } else if (frameId === 'royal_gold') {
      this.drawRoyalGoldFrame(ctx, width, height, primaryColor, accentColor, highlightColor);
    } else if (frameId === 'shadow_void') {
      this.drawShadowVoidFrame(ctx, width, height, primaryColor, accentColor, highlightColor);
    } else if (frameId === 'nature_spirit') {
      this.drawNatureSpiritFrame(ctx, width, height, primaryColor, accentColor, highlightColor);
    }
    
    ctx.restore();
  }

  drawNeonCyberFrame(ctx, width, height, primary, accent, highlight) {
    // Neon glow effect
    ctx.shadowColor = primary;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = primary;
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, width - 10, height - 10);
    
    // Inner neon border
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, width - 30, height - 30);
    
    // Circuit pattern corners
    ctx.shadowBlur = 0;
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 2;
    
    // Tech corners
    for (let corner of [[20, 20], [width-60, 20], [20, height-60], [width-60, height-60]]) {
      ctx.strokeRect(corner[0], corner[1], 40, 40);
      ctx.strokeRect(corner[0]+10, corner[1]+10, 20, 20);
    }
  }

  drawFireDragonFrame(ctx, width, height, primary, accent, highlight) {
    // Jagged fire border
    ctx.fillStyle = primary;
    ctx.shadowColor = primary;
    ctx.shadowBlur = 25;
    
    // Create flame-like border
    ctx.beginPath();
    for (let i = 0; i < width; i += 20) {
      const flameHeight = Math.sin(i * 0.1) * 8 + 12;
      ctx.lineTo(i, flameHeight);
    }
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.lineTo(0, 0);
    ctx.fill();
    
    // Inner border
    ctx.fillStyle = accent;
    ctx.fillRect(15, 15, width - 30, height - 30);
    
    // Content area cutout
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';
    ctx.fillRect(25, 25, width - 50, height - 50);
    ctx.globalCompositeOperation = 'source-over';
    
    // Flame particles
    ctx.fillStyle = highlight;
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const y = Math.random() * 30;
      ctx.fillRect(x, y, 3, 8);
    }
  }

  drawIceFortressFrame(ctx, width, height, primary, accent, highlight) {
    // Crystal-like edges
    ctx.fillStyle = primary;
    ctx.shadowColor = primary;
    ctx.shadowBlur = 15;
    
    // Draw crystal border
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(20, 0);
    ctx.lineTo(width-20, 0);
    ctx.lineTo(width, 20);
    ctx.lineTo(width, height-20);
    ctx.lineTo(width-20, height);
    ctx.lineTo(20, height);
    ctx.lineTo(0, height-20);
    ctx.closePath();
    ctx.fill();
    
    // Inner crystal
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(15, 25);
    ctx.lineTo(25, 15);
    ctx.lineTo(width-25, 15);
    ctx.lineTo(width-15, 25);
    ctx.lineTo(width-15, height-25);
    ctx.lineTo(width-25, height-15);
    ctx.lineTo(25, height-15);
    ctx.lineTo(15, height-25);
    ctx.closePath();
    ctx.fill();
    
    // Content area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';
    ctx.fillRect(30, 30, width - 60, height - 60);
    ctx.globalCompositeOperation = 'source-over';
    
    // Ice sparkles
    ctx.fillStyle = highlight;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  drawRoyalGoldFrame(ctx, width, height, primary, accent, highlight) {
    // Ornate gold frame
    ctx.fillStyle = primary;
    ctx.shadowColor = primary;
    ctx.shadowBlur = 10;
    ctx.fillRect(0, 0, width, height);
    
    // Ornate pattern
    ctx.fillStyle = accent;
    ctx.fillRect(8, 8, width - 16, height - 16);
    
    // Inner border
    ctx.fillStyle = highlight;
    ctx.fillRect(16, 16, width - 32, height - 32);
    
    // Content area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';
    ctx.fillRect(24, 24, width - 48, height - 48);
    ctx.globalCompositeOperation = 'source-over';
    
    // Royal emblems in corners
    ctx.fillStyle = primary;
    for (let corner of [[12, 12], [width-32, 12], [12, height-32], [width-32, height-32]]) {
      ctx.fillRect(corner[0], corner[1], 20, 20);
      ctx.fillRect(corner[0]+6, corner[1]+6, 8, 8);
    }
  }

  drawShadowVoidFrame(ctx, width, height, primary, accent, highlight) {
    // Dark void effect
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, width, height);
    
    // Purple energy veins
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.shadowColor = highlight;
    ctx.shadowBlur = 20;
    
    // Draw energy veins
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, 0);
      ctx.quadraticCurveTo(Math.random() * width, height/2, Math.random() * width, height);
      ctx.stroke();
    }
    
    // Content area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';
    ctx.fillRect(20, 20, width - 40, height - 40);
    ctx.globalCompositeOperation = 'source-over';
  }

  drawNatureSpiritFrame(ctx, width, height, primary, accent, highlight) {
    // Organic leaf border
    ctx.fillStyle = primary;
    ctx.shadowColor = primary;
    ctx.shadowBlur = 8;
    
    // Draw leaf-like border
    ctx.beginPath();
    for (let i = 0; i < 360; i += 30) {
      const x = width/2 + Math.cos(i * Math.PI/180) * width/2;
      const y = height/2 + Math.sin(i * Math.PI/180) * height/2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Inner natural border
    ctx.fillStyle = accent;
    ctx.fillRect(12, 12, width - 24, height - 24);
    
    // Content area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';
    ctx.fillRect(25, 25, width - 50, height - 50);
    ctx.globalCompositeOperation = 'source-over';
    
    // Leaf particles
    ctx.fillStyle = highlight;
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 4, 2);
    }
  }

  roundedRect(ctx, x, y, width, height, radius) {
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

  drawCornerOrnaments(ctx, width, height, accentColor, highlightColor) {
    const ornamentSize = 25;
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.7;
    
    // Top-left
    ctx.beginPath();
    ctx.arc(20, 20, ornamentSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Top-right
    ctx.beginPath();
    ctx.arc(width - 20, 20, ornamentSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bottom-left
    ctx.beginPath();
    ctx.arc(20, height - 20, ornamentSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bottom-right
    ctx.beginPath();
    ctx.arc(width - 20, height - 20, ornamentSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add highlight centers
    ctx.fillStyle = highlightColor;
    ctx.globalAlpha = 0.9;
    const centerSize = 8;
    
    ctx.beginPath();
    ctx.arc(20, 20, centerSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width - 20, 20, centerSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(20, height - 20, centerSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width - 20, height - 20, centerSize/2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPatternOverlay(ctx, width, height, accentColor) {
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.1;
    
    // Create subtle pattern
    const patternSize = 30;
    for (let x = 30; x < width - 30; x += patternSize) {
      for (let y = 30; y < height - 30; y += patternSize) {
        if ((x + y) % (patternSize * 2) === 0) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Test the frame system with a sample card
  async testFrameSystem() {
    console.log('Testing frame overlay system...');
    console.log(`Available frames: ${this.availableFrames.map(f => f.name).join(', ')}`);
    
    // Create a test card image
    const testCanvas = createCanvas(400, 600);
    const testCtx = testCanvas.getContext('2d');
    
    // Draw test card background
    testCtx.fillStyle = '#f0f0f0';
    testCtx.fillRect(0, 0, 400, 600);
    
    // Add test text
    testCtx.fillStyle = '#333';
    testCtx.font = '20px Arial';
    testCtx.textAlign = 'center';
    testCtx.fillText('Test Card', 200, 300);
    
    // Save test card
    const testCardPath = path.join(__dirname, 'test_card.png');
    const testBuffer = testCanvas.toBuffer('image/png');
    fs.writeFileSync(testCardPath, testBuffer);
    
    // Apply different frames
    for (const frame of this.availableFrames.slice(0, 3)) {
      const outputPath = path.join(__dirname, `test_card_${frame.id}.png`);
      await this.applyFrameToCard(testCardPath, frame.id, outputPath);
      console.log(`Generated: test_card_${frame.id}.png`);
    }
    
    console.log('Frame system test completed!');
  }

  // Get available frames for Discord command
  getAvailableFrames() {
    return this.availableFrames.map(frame => ({
      id: frame.id,
      name: frame.name
    }));
  }

  async generateCardImage(card) {
    // This method generates a card image with applied frame (if any)
    try {
      const { createCanvas, loadImage } = require('canvas');
      
      // Create a basic card canvas (400x600 is standard size)
      const canvas = createCanvas(400, 600);
      const ctx = canvas.getContext('2d');
      
      // Load the character image if available
      const imageUrl = card.image || card.imageUrl;
      if (imageUrl) {
        try {
          const characterImage = await loadImage(imageUrl);
          // Ensure the image fills the entire canvas properly
          ctx.drawImage(characterImage, 0, 0, 400, 600);
        } catch (imageError) {
          console.log('Could not load character image:', imageError.message);
          // Create a colorful fallback background instead of grey
          const gradient = ctx.createLinearGradient(0, 0, 400, 600);
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 600);
          
          // Add character name as text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(card.name || 'Unknown Character', 200, 300);
        }
      } else {
        // Create a colorful fallback background instead of grey
        const gradient = ctx.createLinearGradient(0, 0, 400, 600);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 600);
        
        // Add character name as text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.name || 'Unknown Character', 200, 300);
      }
      
      // Apply frame if the card has one
      if (card.appliedFrame) {
        const frameData = this.availableFrames.find(frame => frame.id === card.appliedFrame);
        if (frameData) {
          try {
            const frameImageBuffer = await this.svgToImage(frameData.svg, 400, 600, card.appliedFrame);
            const frameImage = await loadImage(frameImageBuffer);
            ctx.drawImage(frameImage, 0, 0, 400, 600);
          } catch (frameError) {
            console.log('Could not apply frame:', frameError.message);
          }
        }
      }
      
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      console.error('Error in generateCardImage:', error);
      return null;
    }
  }
}

module.exports = FrameOverlaySystem;