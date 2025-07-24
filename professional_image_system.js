const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class ProfessionalImageSystem {
  constructor() {
    this.cache = new Map();
    this.templateCache = new Map();
    
    // Initialize fonts
    this.initializeFonts();
  }

  async initializeFonts() {
    try {
      registerFont('./Bubblegum.ttf', { family: 'Bubblegum', weight: 'normal' });
      registerFont('./To Japan.ttf', { family: 'To Japan', weight: 'normal' });
      console.log('Professional Image System: Fonts loaded successfully');
    } catch (error) {
      console.log('Professional Image System: Using system fonts as fallback');
    }
  }

  // CARD GENERATION - Enhanced version of existing system
  async generateProfessionalCard(card, options = {}) {
    const width = 400;
    const height = 600;
    
    try {
      // Use Sharp for character image preprocessing
      let characterImageBuffer = null;
      if (card.imageUrl || card.image) {
        characterImageBuffer = await this.preprocessCharacterImage(card.imageUrl || card.image, width, height);
      }
      
      // Use Canvas for final composition
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (characterImageBuffer) {
        // Draw preprocessed character image
        const characterImage = await loadImage(characterImageBuffer);
        this.drawCharacterWithBorder(ctx, characterImage, width, height);
      } else {
        // Fallback gradient background
        this.drawFallbackBackground(ctx, card, width, height);
      }
      
      // Apply dye effects if present
      if (card.dyeSettings && this.hasDyeCustomization(card.dyeSettings)) {
        this.applyDyeEffects(ctx, card.dyeSettings, width, height);
      }
      
      // Add card information overlay
      this.drawCardInfo(ctx, card, width, height);
      
      // Apply frame if present
      if (card.appliedFrame) {
        await this.applyFrame(ctx, card.appliedFrame, width, height);
      }
      
      // Apply aura if present  
      if (card.appliedAura) {
        return await this.applyAura(canvas.toBuffer('image/png'), card.appliedAura);
      }
      
      return canvas.toBuffer('image/png');
      
    } catch (error) {
      console.error('Error in generateProfessionalCard:', error);
      return this.generateFallbackCard(card);
    }
  }

  // CHARACTER IMAGE PREPROCESSING with Sharp
  async preprocessCharacterImage(imageUrl, targetWidth, targetHeight) {
    try {
      const cacheKey = `char_${imageUrl}_${targetWidth}x${targetHeight}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Download and process image with axios
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const originalBuffer = Buffer.from(response.data);
      
      // Use Sharp for optimal resizing and format conversion
      const processedBuffer = await sharp(originalBuffer)
        .resize(targetWidth * 0.8, targetHeight * 0.8, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();
      
      this.cache.set(cacheKey, processedBuffer);
      return processedBuffer;
      
    } catch (error) {
      console.error('Error preprocessing character image:', error);
      return null;
    }
  }

  // BORDER DRAWING - Enhanced version of existing system
  drawCharacterWithBorder(ctx, characterImage, width, height) {
    const borderWidth = 15;
    const renderWidth = width * 0.8;
    const renderHeight = height * 0.8;
    const x = (width - renderWidth) / 2;
    const y = (height - renderHeight) / 2;

    // Sample colors from character image for dynamic border
    const sampleCanvas = createCanvas(100, 100);
    const sampleCtx = sampleCanvas.getContext('2d');
    sampleCtx.drawImage(characterImage, 0, 0, 100, 100);
    const imageData = sampleCtx.getImageData(0, 0, 100, 100).data;
    
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      r += imageData[i];
      g += imageData[i + 1];  
      b += imageData[i + 2];
    }
    const pixelCount = imageData.length / 4;
    r = Math.floor(r / pixelCount);
    g = Math.floor(g / pixelCount);
    b = Math.floor(b / pixelCount);

    // Draw dynamic border gradient
    const borderGradient = ctx.createLinearGradient(x - borderWidth, y - borderWidth, x + renderWidth + borderWidth, y + renderHeight + borderWidth);
    borderGradient.addColorStop(0, `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.3)`);
    borderGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.6)`);
    borderGradient.addColorStop(1, `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.3)`);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x - borderWidth, y - borderWidth, renderWidth + 2 * borderWidth, renderHeight + 2 * borderWidth);
    ctx.clip();
    ctx.fillStyle = borderGradient;
    ctx.fillRect(x - borderWidth, y - borderWidth, renderWidth + 2 * borderWidth, renderHeight + 2 * borderWidth);
    ctx.restore();

    // Draw character image with clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, renderWidth, renderHeight);
    ctx.clip();
    ctx.drawImage(characterImage, x, y, renderWidth, renderHeight);
    ctx.restore();
  }

  // FALLBACK BACKGROUND - Matching existing system
  drawFallbackBackground(ctx, card, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add character name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Bubblegum, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.name || 'Unknown Character', width / 2, height / 2);
  }

  // CARD INFO OVERLAY - Enhanced text rendering
  drawCardInfo(ctx, card, width, height) {
    // Clean up text
    const cleanName = this.cleanText(card.name || 'Unknown');
    const cleanSeries = this.cleanText(card.series || 'Unknown');

    // Character name with shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, height - 120, width, 120);
    
    // Name with outline for better visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Bubblegum, Arial';
    ctx.textAlign = 'left';
    ctx.strokeText(cleanName, 15, height - 85);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cleanName, 15, height - 85);
    
    // Series
    ctx.font = '16px Arial';
    ctx.fillStyle = '#bbbbbb';
    ctx.fillText(cleanSeries, 15, height - 60);
    
    // Class and Level
    if (card.class) {
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = this.getClassColor(card.class);
      ctx.fillText(`${card.class} • Level ${card.level || 1}`, 15, height - 35);
    }
    
    // Print number with special coloring
    if (card.printNumber) {
      ctx.font = 'bold 18px To Japan, Arial';
      ctx.textAlign = 'right';
      
      if (card.printNumber === 1) {
        // Rainbow gradient for #1
        const gradient = ctx.createLinearGradient(width - 80, height - 25, width - 10, height - 25);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.17, '#ff8800');
        gradient.addColorStop(0.33, '#ffff00');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(0.67, '#0088ff');
        gradient.addColorStop(0.83, '#8800ff');
        gradient.addColorStop(1, '#ff0088');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      
      ctx.fillText(`#${card.printNumber}`, width - 15, height - 10);
    }
    
    ctx.restore();
  }

  // DYE EFFECTS - Preserve existing functionality
  hasDyeCustomization(dyeSettings) {
    return dyeSettings && (
      dyeSettings.hue !== 0 || 
      dyeSettings.saturation !== 100 || 
      dyeSettings.highlights !== 0
    );
  }

  applyDyeEffects(ctx, dyeSettings, width, height) {
    const { hue = 0, saturation = 100, highlights = 0 } = dyeSettings;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply HSL adjustments
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a === 0) continue;
      
      // Convert to HSL and apply adjustments
      const [h, s, l] = this.rgbToHsl(r, g, b);
      const newH = (h + hue / 360) % 1;
      const newS = Math.min(1, Math.max(0, s * (saturation / 100)));
      const newL = Math.min(1, Math.max(0, l + (highlights / 100)));
      
      const [newR, newG, newB] = this.hslToRgb(newH, newS, newL);
      
      data[i] = newR;
      data[i + 1] = newG;
      data[i + 2] = newB;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  // FRAME APPLICATION - Enhanced frame system
  async applyFrame(ctx, frameId, width, height) {
    try {
      const frameOverlaySystem = require('./frame_overlay_system.js');
      const frameData = frameOverlaySystem.availableFrames.find(frame => frame.id === frameId);
      
      if (frameData) {
        const frameImageBuffer = await frameOverlaySystem.svgToImage(frameData.svg, width, height, frameId);
        const frameImage = await loadImage(frameImageBuffer);
        ctx.drawImage(frameImage, 0, 0, width, height);
      }
    } catch (error) {
      console.error('Error applying frame:', error);
    }
  }

  // AURA APPLICATION - Enhanced aura system  
  async applyAura(cardBuffer, auraType) {
    try {
      const auraSystem = require('./aura_system.js');
      return await auraSystem.applyAura(cardBuffer, auraType);
    } catch (error) {
      console.error('Error applying aura:', error);
      return cardBuffer;
    }
  }

  // UTILITY METHODS
  cleanText(text) {
    return text
      .replace(/[★☆※]/g, '')
      .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
      .trim();
  }

  getClassColor(cardClass) {
    const colors = {
      'Tank': '#4A90E2',
      'Damage': '#E74C3C',
      'Support': '#2ECC71', 
      'Intel': '#9B59B6'
    };
    return colors[cardClass] || '#74c0fc';
  }

  // HSL color conversion utilities
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // FALLBACK CARD GENERATION
  async generateFallbackCard(card) {
    const canvas = createCanvas(400, 600);
    const ctx = canvas.getContext('2d');
    
    // Simple fallback
    ctx.fillStyle = '#36393f';
    ctx.fillRect(0, 0, 400, 600);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(card.name || 'Unknown', 200, 300);
    
    return canvas.toBuffer('image/png');
  }
}

module.exports = new ProfessionalImageSystem();