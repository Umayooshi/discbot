const path = require('path');

class TestCardsIntegration {
  constructor() {
    this.charactersCache = [];
    this.lastFetchTime = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Test cards using your uploaded images
    this.fastCharacters = [
      { 
        name: "Makima", 
        series: "Chainsaw Man", 
        imageUrl: path.join(__dirname, 'card_a.png'),
        type: "anime" 
      },
      { 
        name: "Nobara", 
        series: "Jujutsu Kaisen", 
        imageUrl: path.join(__dirname, 'card_b.png'),
        type: "anime" 
      },
      { 
        name: "Temple", 
        series: "Architectural", 
        imageUrl: path.join(__dirname, 'card_c.gif'),
        type: "anime" 
      }
    ];
  }

  getRandomCharacters(count = 3) {
    // For testing, make the GIF more likely to appear
    const random = Math.random();
    if (random < 0.5) {
      // 50% chance to return the GIF first
      return [this.fastCharacters[2], ...this.fastCharacters.slice(0, 2)].slice(0, count);
    } else {
      // 50% chance for normal random selection
      const shuffled = [...this.fastCharacters].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
  }

  async fetchCharactersFromMudae(count = 3) {
    return this.getRandomCharacters(count);
  }
}

module.exports = TestCardsIntegration;