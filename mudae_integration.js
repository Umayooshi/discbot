const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MudaeIntegration {
  constructor() {
    this.charactersCache = [];
    this.lastFetchTime = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Pre-loaded character pool with SVG-generated images
    this.fastCharacters = [
      { name: "Nezuko Kamado", series: "Demon Slayer", imageUrl: this.generateCharacterSVG("Nezuko", "#FF69B4"), type: "anime" },
      { name: "Tanjiro Kamado", series: "Demon Slayer", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Zenitsu Agatsuma", series: "Demon Slayer", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Inosuke Hashibira", series: "Demon Slayer", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Goku", series: "Dragon Ball Z", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Vegeta", series: "Dragon Ball Z", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Naruto Uzumaki", series: "Naruto", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Sasuke Uchiha", series: "Naruto", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Sakura Haruno", series: "Naruto", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Luffy", series: "One Piece", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Zoro", series: "One Piece", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Nami", series: "One Piece", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Sanji", series: "One Piece", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Rem", series: "Re:Zero", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Emilia", series: "Re:Zero", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Ram", series: "Re:Zero", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Subaru Natsuki", series: "Re:Zero", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Megumin", series: "KonoSuba", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Aqua", series: "KonoSuba", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Darkness", series: "KonoSuba", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Kazuma Satou", series: "KonoSuba", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Saitama", series: "One Punch Man", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Genos", series: "One Punch Man", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Fubuki", series: "One Punch Man", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Tatsumaki", series: "One Punch Man", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Edward Elric", series: "Fullmetal Alchemist", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Alphonse Elric", series: "Fullmetal Alchemist", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Winry Rockbell", series: "Fullmetal Alchemist", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Roy Mustang", series: "Fullmetal Alchemist", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Riza Hawkeye", series: "Fullmetal Alchemist", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Eren Yeager", series: "Attack on Titan", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Mikasa Ackerman", series: "Attack on Titan", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Armin Arlert", series: "Attack on Titan", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Levi Ackerman", series: "Attack on Titan", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Historia Reiss", series: "Attack on Titan", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Ichigo Kurosaki", series: "Bleach", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Rukia Kuchiki", series: "Bleach", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Orihime Inoue", series: "Bleach", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Renji Abarai", series: "Bleach", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Toshiro Hitsugaya", series: "Bleach", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Inuyasha", series: "Inuyasha", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Kagome Higurashi", series: "Inuyasha", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Miroku", series: "Inuyasha", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Sango", series: "Inuyasha", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Shippo", series: "Inuyasha", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Natsu Dragneel", series: "Fairy Tail", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Lucy Heartfilia", series: "Fairy Tail", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Erza Scarlet", series: "Fairy Tail", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Gray Fullbuster", series: "Fairy Tail", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Wendy Marvell", series: "Fairy Tail", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Yusuke Urameshi", series: "Yu Yu Hakusho", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" },
      { name: "Kuwabara Kazuma", series: "Yu Yu Hakusho", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=face", type: "anime" }
    ];
  }
  
  async getMudaeCharacters(limit = 1000) {
    try {
      // Return fast characters immediately for quick drops
      if (limit <= this.fastCharacters.length) {
        return this.fastCharacters.slice(0, limit);
      }
      
      // For larger requests, use cached data if available
      const now = Date.now();
      if (this.charactersCache.length > 0 && (now - this.lastFetchTime) < this.cacheExpiry) {
        return this.charactersCache.slice(0, limit);
      }
      
      // If we need to fetch new data, use the Python scraper
      const characters = await this.runPythonScraper(limit);
      
      if (characters && characters.length > 0) {
        this.charactersCache = characters;
        this.lastFetchTime = now;
        return characters.slice(0, limit);
      }
      
      // Fallback to fast characters
      return this.fastCharacters.slice(0, limit);
      
    } catch (error) {
      console.error('Error getting Mudae characters:', error);
      return this.fastCharacters.slice(0, limit);
    }
  }
  
  async runPythonScraper(limit = 1000) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        'mudae_scraper.py',
        '--limit', limit.toString()
      ]);
      
      let output = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const characters = JSON.parse(output);
            resolve(characters);
          } catch (e) {
            console.error('Error parsing Python output:', e);
            resolve([]);
          }
        } else {
          console.error('Python scraper error:', error);
          resolve([]);
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        resolve([]);
      }, 10000);
    });
  }
  
  // Get 3 random characters for drops
  getRandomCharacters(count = 3) {
    const characters = this.fastCharacters;
    const selected = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      selected.push(characters[randomIndex]);
    }
    
    return selected;
  }
}

module.exports = MudaeIntegration;