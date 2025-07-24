const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const FrameOverlaySystem = require('./frame_overlay_system');

class FramePreview {
  constructor() {
    this.frameSystem = new FrameOverlaySystem();
  }

  async createPreviewGrid() {
    const frames = this.frameSystem.getAvailableFrames();
    const cardWidth = 300;
    const cardHeight = 450;
    const margin = 20;
    const cols = 3;
    const rows = Math.ceil(frames.length / cols);
    
    const canvasWidth = (cardWidth + margin) * cols + margin;
    const canvasHeight = (cardHeight + margin) * rows + margin + 80; // Extra space for titles
    
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Professional Anime Frame Collection', canvasWidth / 2, 50);
    
    // Create preview cards for each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = margin + col * (cardWidth + margin);
      const y = 80 + margin + row * (cardHeight + margin);
      
      // Create sample card
      const sampleCard = await this.createSampleCard(cardWidth, cardHeight, frame.name);
      
      // Apply frame
      const framedCard = await this.applyFrameToSample(sampleCard, frame.id);
      
      // Draw to main canvas
      ctx.drawImage(framedCard, x, y);
      
      // Add frame name
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(frame.name, x + cardWidth / 2, y + cardHeight + 20);
    }
    
    // Save preview
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'frame_preview.png'), buffer);
    
    console.log('Frame preview created: frame_preview.png');
    return 'frame_preview.png';
  }
  
  async createSampleCard(width, height, frameName) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Card background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Character placeholder
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(30, 30, width - 60, height - 120);
    
    // Character name area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30, height - 80, width - 60, 50);
    
    // Sample text
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sample Character', width / 2, height - 60);
    
    ctx.font = '14px Arial';
    ctx.fillText(`with ${frameName}`, width / 2, height - 40);
    
    // Stats area
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Level: 42', 40, height - 20);
    ctx.fillText('Power: 8547', width - 100, height - 20);
    
    return canvas;
  }
  
  async applyFrameToSample(sampleCanvas, frameId) {
    // Save sample as temporary file
    const tempPath = path.join(__dirname, 'temp_sample.png');
    const sampleBuffer = sampleCanvas.toBuffer('image/png');
    fs.writeFileSync(tempPath, sampleBuffer);
    
    // Apply frame
    const outputPath = path.join(__dirname, 'temp_framed.png');
    await this.frameSystem.applyFrameToCard(tempPath, frameId, outputPath);
    
    // Load result
    const framedImage = await loadImage(outputPath);
    
    // Clean up temp files
    fs.unlinkSync(tempPath);
    fs.unlinkSync(outputPath);
    
    return framedImage;
  }
}

// Create the preview
const preview = new FramePreview();
preview.createPreviewGrid();