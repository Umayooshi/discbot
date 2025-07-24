const fs = require('fs').promises;
const path = require('path');

class SimpleVersioning {
  constructor() {
    this.dbPath = path.join(__dirname, 'character_versions.json');
    this.versionDatabase = {};
    this.loadDatabase();
  }

  async loadDatabase() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf8');
      this.versionDatabase = JSON.parse(data);
    } catch (error) {
      this.versionDatabase = {};
    }
  }

  async saveDatabase() {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.versionDatabase, null, 2));
    } catch (error) {
      console.error('Error saving version database:', error);
    }
  }

  getNextVersion(characterName, series) {
    const key = `${characterName}_${series}`.replace(/\s+/g, '_').toLowerCase();
    
    if (!this.versionDatabase[key]) {
      this.versionDatabase[key] = {
        currentVersion: 'A',
        printCount: 0,
        versions: {
          'A': 0,
          'B': 0,
          'C': 0,
          'D': 0,
          'E': 0
        }
      };
    }

    const charData = this.versionDatabase[key];
    let currentVersion = charData.currentVersion;
    let printNumber = charData.versions[currentVersion] + 1;

    // If current version hits 250, move to next version
    if (printNumber > 250) {
      const nextVersionCode = currentVersion.charCodeAt(0) + 1;
      if (nextVersionCode <= 90) { // Z is 90
        currentVersion = String.fromCharCode(nextVersionCode);
        charData.currentVersion = currentVersion;
        printNumber = 1;
      } else {
        // Character is completely maxed out
        return null;
      }
    }

    // Update the database
    charData.versions[currentVersion] = printNumber;
    charData.printCount++;
    
    this.saveDatabase();

    return {
      version: currentVersion,
      print: printNumber,
      formatted: `#${printNumber}`,
      rarity: this.calculateRarity(currentVersion, printNumber)
    };
  }

  calculateRarity(version, print) {
    // Calculate rarity score (A #1 is most valuable)
    const versionValue = 26 - (version.charCodeAt(0) - 65); // A=26, B=25, etc.
    const printValue = Math.max(1, 251 - print); // #1=250, #2=249, etc.
    
    const rarityScore = (versionValue * 1000) + printValue;
    
    // Determine rarity tier
    if (version === 'A' && print === 1) return { tier: 'Pristine', score: rarityScore };
    if (version === 'A' && print <= 10) return { tier: 'Legendary', score: rarityScore };
    if (version === 'A' && print <= 50) return { tier: 'Epic', score: rarityScore };
    if (version === 'A' && print <= 100) return { tier: 'Rare', score: rarityScore };
    if (version === 'A') return { tier: 'Uncommon', score: rarityScore };
    if (version === 'B' && print <= 25) return { tier: 'Rare', score: rarityScore };
    if (version === 'B') return { tier: 'Common', score: rarityScore };
    return { tier: 'Common', score: rarityScore };
  }

  getCharacterStats(characterName, series) {
    const key = `${characterName}_${series}`.replace(/\s+/g, '_').toLowerCase();
    return this.versionDatabase[key] || null;
  }

  getTopCards(limit = 10) {
    const allCards = [];
    
    for (const [key, charData] of Object.entries(this.versionDatabase)) {
      const [name, series] = key.split('_');
      
      for (const [version, printCount] of Object.entries(charData.versions)) {
        if (printCount > 0) {
          for (let print = 1; print <= printCount; print++) {
            const rarity = this.calculateRarity(version, print);
            allCards.push({
              name: name.replace(/_/g, ' '),
              series: series.replace(/_/g, ' '),
              version,
              print,
              rarity: rarity.score
            });
          }
        }
      }
    }

    return allCards.sort((a, b) => b.rarity - a.rarity).slice(0, limit);
  }
}

module.exports = SimpleVersioning;