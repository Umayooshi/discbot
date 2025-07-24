const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SharpGifSystem {
  constructor() {
    this.cache = new Map();
    this.initializeFonts();
  }

  async initializeFonts() {
    try {
      registerFont('./Bubblegum.ttf', { family: 'Bubblegum', weight: 'normal' });
      registerFont('./To Japan.ttf', { family: 'To Japan', weight: 'normal' });
      console.log('Sharp GIF System: Fonts loaded successfully');
    } catch (error) {
      console.log('Sharp GIF System: Using system fonts as fallback');
    }
  }

  // Generate GIF card with exact same formatting as static cards
  async generateGifCard(card, gifBuffer) {
    try {
      console.log(`Generating GIF card for ${card.name}...`);
      
      // Get GIF metadata
      const gifMetadata = await sharp(gifBuffer).metadata();
      const { width: originalWidth, height: originalHeight, pages } = gifMetadata;
      
      if (!pages || pages === 1) {
        throw new Error('Input is not an animated GIF');
      }

      console.log(`GIF has ${pages} frames, ${originalWidth}x${originalHeight}`);

      // Card dimensions - same as static cards
      const cardWidth = 400;
      const cardHeight = 600;
      
      // Process each frame
      const processedFrames = [];
      const delays = [];

      // Limit frames to keep file size under Discord's limit (8MB)
      const maxFrames = Math.min(pages, 60); // Cap at 60 frames max
      console.log(`Processing ${maxFrames} frames (of ${pages} total) for file size optimization`);
      
      for (let i = 0; i < maxFrames; i++) {
        console.log(`Processing frame ${i + 1}/${maxFrames}`);
        
        // Extract frame with slight zoom to hide white edges
        const frameBuffer = await sharp(gifBuffer, { page: i })
          .resize(Math.round(cardWidth * 1.02), Math.round(cardHeight * 1.02)) // Scale up 2% to crop white edges
          .extract({ 
            left: Math.round(cardWidth * 0.01), 
            top: Math.round(cardHeight * 0.01), 
            width: cardWidth, 
            height: cardHeight 
          }) // Crop back to original size, removing edges
          .png()
          .toBuffer();

        // Generate card with this frame
        const cardBuffer = await this.generateCardFrame(card, frameBuffer, cardWidth, cardHeight);
        processedFrames.push(cardBuffer);
        delays.push(80); // 80ms delay to reduce file size while maintaining smoothness
      }

      // Combine frames back into GIF
      const finalGifBuffer = await this.combineFramesToGif(processedFrames, delays);
      console.log(`GIF card generation complete for ${card.name}`);
      
      return finalGifBuffer;

    } catch (error) {
      console.error('Error generating GIF card:', error);
      throw error;
    }
  }

  // Generate single card frame with exact same styling as static cards
  async generateCardFrame(card, frameBuffer, cardWidth, cardHeight) {
    const canvas = createCanvas(cardWidth, cardHeight);
    const ctx = canvas.getContext('2d');
    
    // Set transparent background - same as static cards
    ctx.clearRect(0, 0, cardWidth, cardHeight);

    // Clean up text - exact same as static cards
    const cleanName = (card.name || 'Unknown')
      .replace(/[★☆※]/g, '')
      .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
      .trim();
    
    const cleanSeries = (card.series || 'Unknown')
      .replace(/[★☆※]/g, '')
      .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
      .trim();

    // Transparent background - no fill needed

    // Process animated frame to fit card perfectly (no gaps)
    const renderWidth = cardWidth * 0.8;
    const renderHeight = cardHeight * 0.8;
    const processedFrameBuffer = await sharp(frameBuffer)
      .resize(Math.round(renderWidth), Math.round(renderHeight), {
        fit: 'cover', // Cover entire area while maintaining aspect ratio
        position: 'center'
      })
      .png()
      .toBuffer();

    const frameImage = await loadImage(processedFrameBuffer);

    // Same positioning as static cards
    const borderWidth = 15;
    const x = (cardWidth - renderWidth) / 2;
    const y = (cardHeight - renderHeight) / 2;

    // Sample RGB from frame for border - same as static cards
    const sampleCanvas = createCanvas(100, 100);
    const sampleCtx = sampleCanvas.getContext('2d');
    sampleCtx.drawImage(frameImage, 0, 0, 100, 100);
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

    // Draw border gradient - exact same as static cards
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

    // Draw animated frame - same clipping as static cards
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, renderWidth, renderHeight);
    ctx.clip();
    ctx.drawImage(frameImage, x, y, renderWidth, renderHeight);
    ctx.restore();

    // Apply dye effects if present - exact same code as static cards
    if (card.dyeSettings && this.hasDyeCustomization(card.dyeSettings)) {
      this.applyDyeEffects(ctx, card.dyeSettings, cardWidth, cardHeight);
    }

    // Add text gradient - clipped to card frame boundaries
    const gradientY = cardHeight * 0.75;
    const cardFrameBottom = y + renderHeight; // Bottom of card frame, not canvas
    const gradientHeight = cardFrameBottom - gradientY;
    const textColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
    const seriesColor = `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`;
    const textGradient = ctx.createLinearGradient(x, gradientY, x, cardFrameBottom);
    textGradient.addColorStop(0, textColor);
    textGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    // Clip gradient to card frame only
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, gradientY, renderWidth, gradientHeight);
    ctx.clip();
    ctx.fillStyle = textGradient;
    ctx.fillRect(x, gradientY, renderWidth, gradientHeight);
    ctx.restore();

    // Text rendering - positioned from full canvas height like static cards
    ctx.textAlign = 'center';
    const textX = x + (renderWidth / 2);
    const fullCanvasGradientHeight = cardHeight - gradientY; // Use full canvas height for text positioning
    const baseTextY = gradientY + (fullCanvasGradientHeight * 0.25);

    let displayName = cleanName.length > 16 ? cleanName.substring(0, 13) + '...' : cleanName;
    let displaySeries = cleanSeries.length > 22 ? cleanSeries.substring(0, 19) + '...' : cleanSeries;

    // Render text with same fallback system
    this.renderTextWithFallback(ctx, displayName, textX, baseTextY, 32, '#FFFFFF');
    this.renderTextWithFallback(ctx, displaySeries, textX, baseTextY + 28, 20, seriesColor);

    // Print number - EXACT COPY from static card system
    ctx.textAlign = 'right';
    const printText = `#${card.printNumber}`;
    ctx.font = '24px "Bubblegum"';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#FFFFFF'; // WHITE as requested - NOT rainbow
    ctx.strokeText(printText, x + renderWidth - 15, y + renderHeight - 15);
    ctx.fillText(printText, x + renderWidth - 15, y + renderHeight - 15);

    return canvas.toBuffer('image/png');
  }

  // Combine processed frames back to GIF using GifEncoder
  async combineFramesToGif(frames, delays) {
    try {
      const GifEncoder = require('gifencoder');
      const { createCanvas } = require('canvas');
      
      // Get dimensions from first frame
      const firstFrameCanvas = createCanvas(400, 600);
      const firstFrameCtx = firstFrameCanvas.getContext('2d');
      const firstFrameImg = await loadImage(frames[0]);
      firstFrameCtx.drawImage(firstFrameImg, 0, 0);
      
      // Create GIF encoder with transparency support
      const encoder = new GifEncoder(400, 600);
      encoder.start();
      encoder.setRepeat(0); // Loop infinitely
      encoder.setDelay(50); // 50ms between frames for smoother playback
      encoder.setQuality(10); // Good quality
      encoder.setTransparent(0); // Enable transparency with color index 0
      
      // Add each frame with transparent background
      for (let i = 0; i < frames.length; i++) {
        const canvas = createCanvas(400, 600);
        const ctx = canvas.getContext('2d');
        
        // Ensure transparent background
        ctx.clearRect(0, 0, 400, 600);
        
        const img = await loadImage(frames[i]);
        ctx.drawImage(img, 0, 0);
        encoder.addFrame(ctx);
      }
      
      encoder.finish();
      const buffer = encoder.out.getData();
      
      console.log(`Created animated GIF with ${frames.length} frames`);
      return buffer;
      
    } catch (error) {
      console.error('Error combining frames to GIF:', error);
      return frames[0]; // Return first frame as fallback
    }
  }

  // Dye customization check - same as static cards
  hasDyeCustomization(dyeSettings) {
    return dyeSettings && (
      dyeSettings.hue !== 0 || 
      dyeSettings.saturation !== 100 || 
      dyeSettings.highlights !== 0
    );
  }

  // Apply dye effects - exact same code as static cards
  applyDyeEffects(ctx, dyeSettings, width, height) {
    const { hue = 0, saturation = 100, highlights = 0 } = dyeSettings;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply HSL adjustments - same algorithm as static cards
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a === 0) continue;
      
      r /= 255; g /= 255; b /= 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0;
      } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
      }
      
      h = (h + hue / 360) % 1;
      s = Math.min(2, Math.max(0, s * (saturation / 100)));
      l = Math.min(1, Math.max(0, l + (highlights / 100)));
      
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      let r_ = this.hueToRgb(p, q, h + 1/3);
      let g_ = this.hueToRgb(p, q, h);
      let b_ = this.hueToRgb(p, q, h - 1/3);
      
      data[i] = Math.min(255, Math.max(0, r_ * 255));
      data[i + 1] = Math.min(255, Math.max(0, g_ * 255));
      data[i + 2] = Math.min(255, Math.max(0, b_ * 255));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  // Text rendering with fallback - same as static cards
  renderTextWithFallback(ctx, text, x, y, size, fillColor) {
    ctx.font = `${size}px "Bubblegum"`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = fillColor;
    
    let hasSpecialChar = false;
    for (let char of text) {
      if (/[^\x00-\x7F]/.test(char)) { 
        hasSpecialChar = true; 
        break; 
      }
    }
    
    if (hasSpecialChar) {
      let parts = [], currentPart = '';
      for (let char of text) {
        if (/[^\x00-\x7F]/.test(char)) {
          if (currentPart) parts.push(currentPart);
          parts.push(char);
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      if (currentPart) parts.push(currentPart);
      
      let currentX = ctx.measureText(text).width / -2 + x;
      for (let part of parts) {
        if (/[^\x00-\x7F]/.test(part)) {
          ctx.font = `${size}px Arial`;
        } else {
          ctx.font = `${size}px "Bubblegum"`;
        }
        ctx.strokeText(part, currentX, y);
        ctx.fillText(part, currentX, y);
        currentX += ctx.measureText(part).width;
      }
    } else {
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
  }

  // HSL helper function - same as static cards
  hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
}

module.exports = SharpGifSystem;