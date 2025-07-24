const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MudaeIntegration {
  constructor() {
    this.charactersCache = [];
    this.lastFetchTime = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Character colors for unique identification
    this.characterColors = {
      "Nezuko Kamado": "#FF6B9D",
      "Tanjiro Kamado": "#4ECDC4",
      "Zenitsu Agatsuma": "#FFE66D",
      "Inosuke Hashibira": "#6BCF7F",
      "Goku": "#FF8C42",
      "Vegeta": "#A8E6CF",
      "Naruto Uzumaki": "#FFD93D",
      "Sasuke Uchiha": "#A8A8FF",
      "Sakura Haruno": "#FFB3BA",
      "Luffy": "#FF6B6B",
      "Zoro": "#4ECDC4",
      "Nami": "#FFE66D",
      "Sanji": "#6BCF7F",
      "Rem": "#95E1D3",
      "Emilia": "#FFEAA7",
      "Ram": "#FF7675",
      "Subaru Natsuki": "#74B9FF",
      "Megumin": "#FD79A8",
      "Aqua": "#00CEC9",
      "Darkness": "#FFD93D",
      "Kazuma Satou": "#A29BFE",
      "Saitama": "#FDCB6E",
      "Genos": "#E17055",
      "Fubuki": "#81ECEC",
      "Tatsumaki": "#00B894",
      "Edward Elric": "#E84393",
      "Alphonse Elric": "#FDCB6E",
      "Winry Rockbell": "#FFB3BA",
      "Roy Mustang": "#FF6B6B",
      "Riza Hawkeye": "#4ECDC4",
      "Eren Yeager": "#6C5CE7",
      "Mikasa Ackerman": "#FF7675",
      "Armin Arlert": "#74B9FF",
      "Levi Ackerman": "#636E72",
      "Historia Reiss": "#FD79A8",
      "Ichigo Kurosaki": "#E17055",
      "Rukia Kuchiki": "#81ECEC",
      "Orihime Inoue": "#FFD93D",
      "Renji Abarai": "#FF6B6B",
      "Toshiro Hitsugaya": "#00CEC9",
      "Inuyasha": "#E84393",
      "Kagome Higurashi": "#FFB3BA",
      "Miroku": "#A29BFE",
      "Sango": "#00B894",
      "Shippo": "#FDCB6E",
      "Natsu Dragneel": "#FF6B6B",
      "Lucy Heartfilia": "#FD79A8",
      "Erza Scarlet": "#E17055",
      "Gray Fullbuster": "#74B9FF",
      "Wendy Marvell": "#81ECEC",
      "Yusuke Urameshi": "#6C5CE7",
      "Kuwabara Kazuma": "#E84393"
    };
    
    // Pre-loaded character pool with SVG images
    this.fastCharacters = this.generateCharacterData();
  }
  
  generateCharacterSVG(name, color) {
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
    const svg = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.darkenColor(color, 0.3)};stop-opacity:1" />
          </linearGradient>
          <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/>
          </pattern>
        </defs>
        <rect width="400" height="600" fill="url(#grad)"/>
        <rect width="400" height="600" fill="url(#pattern)"/>
        <circle cx="200" cy="200" r="80" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
        <text x="200" y="215" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="36" font-weight="bold" fill="white">${initials}</text>
        <text x="200" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">${name}</text>
        <text x="200" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">Anime Character</text>
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                  (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                  (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  generateCharacterData() {
    const characters = [
      { name: "Nezuko Kamado", series: "Demon Slayer" },
      { name: "Tanjiro Kamado", series: "Demon Slayer" },
      { name: "Zenitsu Agatsuma", series: "Demon Slayer" },
      { name: "Inosuke Hashibira", series: "Demon Slayer" },
      { name: "Goku", series: "Dragon Ball Z" },
      { name: "Vegeta", series: "Dragon Ball Z" },
      { name: "Naruto Uzumaki", series: "Naruto" },
      { name: "Sasuke Uchiha", series: "Naruto" },
      { name: "Sakura Haruno", series: "Naruto" },
      { name: "Luffy", series: "One Piece" },
      { name: "Zoro", series: "One Piece" },
      { name: "Nami", series: "One Piece" },
      { name: "Sanji", series: "One Piece" },
      { name: "Rem", series: "Re:Zero" },
      { name: "Emilia", series: "Re:Zero" },
      { name: "Ram", series: "Re:Zero" },
      { name: "Subaru Natsuki", series: "Re:Zero" },
      { name: "Megumin", series: "KonoSuba" },
      { name: "Aqua", series: "KonoSuba" },
      { name: "Darkness", series: "KonoSuba" },
      { name: "Kazuma Satou", series: "KonoSuba" },
      { name: "Saitama", series: "One Punch Man" },
      { name: "Genos", series: "One Punch Man" },
      { name: "Fubuki", series: "One Punch Man" },
      { name: "Tatsumaki", series: "One Punch Man" },
      { name: "Edward Elric", series: "Fullmetal Alchemist" },
      { name: "Alphonse Elric", series: "Fullmetal Alchemist" },
      { name: "Winry Rockbell", series: "Fullmetal Alchemist" },
      { name: "Roy Mustang", series: "Fullmetal Alchemist" },
      { name: "Riza Hawkeye", series: "Fullmetal Alchemist" },
      { name: "Eren Yeager", series: "Attack on Titan" },
      { name: "Mikasa Ackerman", series: "Attack on Titan" },
      { name: "Armin Arlert", series: "Attack on Titan" },
      { name: "Levi Ackerman", series: "Attack on Titan" },
      { name: "Historia Reiss", series: "Attack on Titan" },
      { name: "Ichigo Kurosaki", series: "Bleach" },
      { name: "Rukia Kuchiki", series: "Bleach" },
      { name: "Orihime Inoue", series: "Bleach" },
      { name: "Renji Abarai", series: "Bleach" },
      { name: "Toshiro Hitsugaya", series: "Bleach" },
      { name: "Inuyasha", series: "Inuyasha" },
      { name: "Kagome Higurashi", series: "Inuyasha" },
      { name: "Miroku", series: "Inuyasha" },
      { name: "Sango", series: "Inuyasha" },
      { name: "Shippo", series: "Inuyasha" },
      { name: "Natsu Dragneel", series: "Fairy Tail" },
      { name: "Lucy Heartfilia", series: "Fairy Tail" },
      { name: "Erza Scarlet", series: "Fairy Tail" },
      { name: "Gray Fullbuster", series: "Fairy Tail" },
      { name: "Wendy Marvell", series: "Fairy Tail" },
      { name: "Yusuke Urameshi", series: "Yu Yu Hakusho" },
      { name: "Kuwabara Kazuma", series: "Yu Yu Hakusho" }
    ];
    
    return characters.map(char => ({
      name: char.name,
      series: char.series,
      imageUrl: this.generateCharacterSVG(char.name, this.characterColors[char.name] || "#4ECDC4"),
      type: "anime"
    }));
  }

  getRandomCharacters(count = 3) {
    const shuffled = [...this.fastCharacters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async fetchCharactersFromMudae(count = 3) {
    // This is a placeholder for future Mudae integration
    // For now, return from fast characters
    return this.getRandomCharacters(count);
  }
}

module.exports = MudaeIntegration;