const fs = require('fs');
const path = require('path');

class FrameGenerator {
  constructor() {
    this.frameTemplates = {};
    this.initializeTemplates();
  }

  initializeTemplates() {
    // High-quality anime-style frame templates
    this.frameTemplates = {
      neon_cyber: {
        name: "Neon Cyber",
        colors: {
          primary: "#00FF41",
          secondary: "#00D4FF",
          accent: "#FF0080",
          highlight: "#FFFFFF"
        },
        pattern: "circuit",
        effects: ["neon_glow", "digital_particles"],
        borderStyle: "tech"
      },
      
      fire_dragon: {
        name: "Fire Dragon",
        colors: {
          primary: "#FF4500",
          secondary: "#FFD700",
          accent: "#FF6347",
          highlight: "#FFFFE0"
        },
        pattern: "flames",
        effects: ["fire_particles", "ember_glow"],
        borderStyle: "jagged"
      },
      
      ice_fortress: {
        name: "Ice Fortress",
        colors: {
          primary: "#00BFFF",
          secondary: "#87CEEB",
          accent: "#E0FFFF",
          highlight: "#F0F8FF"
        },
        pattern: "crystals",
        effects: ["ice_sparkles", "frost_mist"],
        borderStyle: "crystal"
      },
      
      royal_gold: {
        name: "Royal Gold",
        colors: {
          primary: "#FFD700",
          secondary: "#FFA500",
          accent: "#FFFF00",
          highlight: "#FFFACD"
        },
        pattern: "ornate",
        effects: ["gold_shine", "royal_emblems"],
        borderStyle: "ornate"
      },
      
      shadow_void: {
        name: "Shadow Void",
        colors: {
          primary: "#000000",
          secondary: "#2F2F2F",
          accent: "#8B008B",
          highlight: "#FF00FF"
        },
        pattern: "void",
        effects: ["shadow_wisps", "dark_energy"],
        borderStyle: "dark"
      },
      
      nature_spirit: {
        name: "Nature Spirit",
        colors: {
          primary: "#228B22",
          secondary: "#32CD32",
          accent: "#90EE90",
          highlight: "#F0FFF0"
        },
        pattern: "leaves",
        effects: ["nature_sparkles", "leaf_particles"],
        borderStyle: "organic"
      }
    };
  }

  generateSVGFrame(templateName, width = 400, height = 600) {
    const template = this.frameTemplates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const { colors, pattern, effects } = template;
    
    // Create SVG with professional anime-style frame
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${this.createGradients(colors)}
        ${this.createPatterns(pattern, colors)}
        ${this.createFilters(effects)}
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#backgroundGradient)"/>
      
      <!-- Main frame border -->
      <rect x="10" y="10" width="${width-20}" height="${height-20}" 
            fill="none" stroke="url(#borderGradient)" stroke-width="8" 
            filter="url(#glow)" rx="15"/>
      
      <!-- Inner decorative border -->
      <rect x="20" y="20" width="${width-40}" height="${height-40}" 
            fill="none" stroke="url(#innerBorder)" stroke-width="3" 
            rx="10"/>
      
      <!-- Corner ornaments -->
      ${this.createCornerOrnaments(width, height, colors, pattern)}
      
      <!-- Pattern overlay -->
      <rect x="25" y="25" width="${width-50}" height="${height-50}" 
            fill="url(#patternOverlay)" opacity="0.3" rx="8"/>
      
      <!-- Effect particles -->
      ${this.createEffectParticles(width, height, effects, colors)}
      
      <!-- Card content area (transparent) -->
      <rect x="30" y="30" width="${width-60}" height="${height-60}" 
            fill="transparent" rx="5"/>
    </svg>`;
    
    return svg;
  }

  createGradients(colors) {
    return `
      <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:0.1"/>
        <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:0.2"/>
      </linearGradient>
      
      <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.accent}"/>
        <stop offset="50%" style="stop-color:${colors.primary}"/>
        <stop offset="100%" style="stop-color:${colors.secondary}"/>
      </linearGradient>
      
      <linearGradient id="innerBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.highlight}"/>
        <stop offset="100%" style="stop-color:${colors.accent}"/>
      </linearGradient>
    `;
  }

  createPatterns(patternType, colors) {
    switch(patternType) {
      case 'ornate':
        return `
          <pattern id="patternOverlay" patternUnits="userSpaceOnUse" width="50" height="50">
            <circle cx="25" cy="25" r="2" fill="${colors.accent}" opacity="0.3"/>
            <path d="M15,25 Q25,15 35,25 Q25,35 15,25" fill="none" stroke="${colors.highlight}" stroke-width="1"/>
          </pattern>
        `;
      case 'floral':
        return `
          <pattern id="patternOverlay" patternUnits="userSpaceOnUse" width="40" height="40">
            <path d="M20,15 Q25,10 30,15 Q25,20 20,15" fill="${colors.accent}" opacity="0.4"/>
            <path d="M15,20 Q20,15 25,20 Q20,25 15,20" fill="${colors.highlight}" opacity="0.3"/>
          </pattern>
        `;
      case 'geometric':
        return `
          <pattern id="patternOverlay" patternUnits="userSpaceOnUse" width="30" height="30">
            <polygon points="15,5 25,15 15,25 5,15" fill="${colors.accent}" opacity="0.2"/>
          </pattern>
        `;
      case 'crystalline':
        return `
          <pattern id="patternOverlay" patternUnits="userSpaceOnUse" width="35" height="35">
            <polygon points="17.5,5 27.5,15 17.5,25 7.5,15" fill="none" stroke="${colors.highlight}" stroke-width="1" opacity="0.4"/>
            <circle cx="17.5" cy="17.5" r="1.5" fill="${colors.accent}" opacity="0.6"/>
          </pattern>
        `;
      case 'angular':
        return `
          <pattern id="patternOverlay" patternUnits="userSpaceOnUse" width="25" height="25">
            <path d="M5,5 L20,5 L15,12.5 L20,20 L5,20 Z" fill="${colors.accent}" opacity="0.2"/>
          </pattern>
        `;
      default:
        return '';
    }
  }

  createFilters(effects) {
    return `
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  }

  createCornerOrnaments(width, height, colors, pattern) {
    const ornamentSize = 30;
    
    switch(pattern) {
      case 'ornate':
        return `
          <!-- Top-left ornament -->
          <g transform="translate(15, 15)">
            <path d="M0,0 Q15,0 15,15 Q0,15 0,0" fill="${colors.accent}" opacity="0.8"/>
            <circle cx="7.5" cy="7.5" r="3" fill="${colors.highlight}"/>
          </g>
          
          <!-- Top-right ornament -->
          <g transform="translate(${width-45}, 15)">
            <path d="M30,0 Q15,0 15,15 Q30,15 30,0" fill="${colors.accent}" opacity="0.8"/>
            <circle cx="22.5" cy="7.5" r="3" fill="${colors.highlight}"/>
          </g>
          
          <!-- Bottom-left ornament -->
          <g transform="translate(15, ${height-45})">
            <path d="M0,30 Q15,30 15,15 Q0,15 0,30" fill="${colors.accent}" opacity="0.8"/>
            <circle cx="7.5" cy="22.5" r="3" fill="${colors.highlight}"/>
          </g>
          
          <!-- Bottom-right ornament -->
          <g transform="translate(${width-45}, ${height-45})">
            <path d="M30,30 Q15,30 15,15 Q30,15 30,30" fill="${colors.accent}" opacity="0.8"/>
            <circle cx="22.5" cy="22.5" r="3" fill="${colors.highlight}"/>
          </g>
        `;
      
      case 'floral':
        return `
          <!-- Cherry blossom corners -->
          <g transform="translate(20, 20)">
            <path d="M0,10 Q5,0 10,10 Q5,20 0,10" fill="${colors.accent}" opacity="0.6"/>
            <path d="M10,0 Q20,5 10,10 Q0,5 10,0" fill="${colors.highlight}" opacity="0.5"/>
          </g>
          
          <g transform="translate(${width-40}, 20) rotate(90)">
            <path d="M0,10 Q5,0 10,10 Q5,20 0,10" fill="${colors.accent}" opacity="0.6"/>
            <path d="M10,0 Q20,5 10,10 Q0,5 10,0" fill="${colors.highlight}" opacity="0.5"/>
          </g>
          
          <g transform="translate(${width-20}, ${height-20}) rotate(180)">
            <path d="M0,10 Q5,0 10,10 Q5,20 0,10" fill="${colors.accent}" opacity="0.6"/>
            <path d="M10,0 Q20,5 10,10 Q0,5 10,0" fill="${colors.highlight}" opacity="0.5"/>
          </g>
          
          <g transform="translate(20, ${height-20}) rotate(270)">
            <path d="M0,10 Q5,0 10,10 Q5,20 0,10" fill="${colors.accent}" opacity="0.6"/>
            <path d="M10,0 Q20,5 10,10 Q0,5 10,0" fill="${colors.highlight}" opacity="0.5"/>
          </g>
        `;
      
      default:
        return '';
    }
  }

  createEffectParticles(width, height, effects, colors) {
    let particles = '';
    
    if (effects.includes('sparkles')) {
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * (width - 60) + 30;
        const y = Math.random() * (height - 60) + 30;
        const size = Math.random() * 3 + 1;
        
        particles += `
          <g transform="translate(${x}, ${y})">
            <animateTransform attributeName="transform" type="rotate" 
                            values="0 0 0;360 0 0" dur="3s" repeatCount="indefinite"/>
            <polygon points="0,-${size} ${size*0.3},${size*0.3} -${size*0.3},${size*0.3}" 
                     fill="${colors.highlight}" opacity="0.8"/>
          </g>
        `;
      }
    }
    
    if (effects.includes('particles')) {
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * (width - 60) + 30;
        const y = Math.random() * (height - 60) + 30;
        const size = Math.random() * 2 + 0.5;
        
        particles += `
          <circle cx="${x}" cy="${y}" r="${size}" fill="${colors.accent}" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite"/>
          </circle>
        `;
      }
    }
    
    return particles;
  }

  // Generate all frame variations
  generateAllFrames() {
    const frameDir = path.join(__dirname, 'generated_frames');
    if (!fs.existsSync(frameDir)) {
      fs.mkdirSync(frameDir);
    }

    Object.keys(this.frameTemplates).forEach(templateName => {
      const svg = this.generateSVGFrame(templateName);
      const filename = `${templateName}_frame.svg`;
      fs.writeFileSync(path.join(frameDir, filename), svg);
      console.log(`Generated: ${filename}`);
    });

    console.log(`Generated ${Object.keys(this.frameTemplates).length} professional anime-style frames`);
  }

  // Get frame data for use in Discord bot
  getFrameData() {
    return Object.keys(this.frameTemplates).map(key => ({
      id: key,
      name: this.frameTemplates[key].name,
      svg: this.generateSVGFrame(key)
    }));
  }
}

module.exports = FrameGenerator;