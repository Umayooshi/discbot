const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class CardVersioningSystem {
  constructor() {
    this.imageCollector = null;
    this.versionDatabase = new Map(); // Tracks print numbers for each character
    this.loadVersionDatabase();
  }

  async loadVersionDatabase() {
    try {
      const dbPath = path.join(__dirname, 'version_database.json');
      const data = await fs.readFile(dbPath, 'utf8');
      const parsed = JSON.parse(data);
      this.versionDatabase = new Map(Object.entries(parsed));
    } catch (error) {
      // Database doesn't exist yet, start fresh
      this.versionDatabase = new Map();
    }
  }

  async saveVersionDatabase() {
    try {
      const dbPath = path.join(__dirname, 'version_database.json');
      const obj = Object.fromEntries(this.versionDatabase);
      await fs.writeFile(dbPath, JSON.stringify(obj, null, 2));
    } catch (error) {
      console.error('Error saving version database:', error);
    }
  }

  async collectCharacterImages(characterName, series) {
    return new Promise((resolve, reject) => {
      console.log(`Collecting images for ${characterName} from ${series}`);
      
      const pythonProcess = spawn('python', [
        path.join(__dirname, 'image_collector.py'),
        '--character', characterName,
        '--series', series,
        '--json-output'
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
            const result = JSON.parse(output);
            resolve(result);
          } catch (parseError) {
            reject(parseError);
          }
        } else {
          reject(new Error(`Python process failed: ${error}`));
        }
      });
    });
  }

  getNextCardVersion(characterName, series) {
    const key = `${characterName}_${series}`.replace(/\s+/g, '_').toLowerCase();
    
    if (!this.versionDatabase.has(key)) {
      this.versionDatabase.set(key, {
        currentVersion: 'A',
        currentPrint: 1,
        versions: {
          'A': { maxPrint: 250, currentPrint: 1 },
          'B': { maxPrint: 250, currentPrint: 1 },
          'C': { maxPrint: 250, currentPrint: 1 },
          'D': { maxPrint: 250, currentPrint: 1 },
          'E': { maxPrint: 250, currentPrint: 1 }
        }
      });
    }

    const charData = this.versionDatabase.get(key);
    const currentVersion = charData.currentVersion;
    const currentPrint = charData.currentPrint;

    // Check if current version is maxed out
    if (currentPrint > charData.versions[currentVersion].maxPrint) {
      // Move to next version
      const nextVersion = String.fromCharCode(currentVersion.charCodeAt(0) + 1);
      if (nextVersion <= 'Z') {
        charData.currentVersion = nextVersion;
        charData.currentPrint = 1;
        
        if (!charData.versions[nextVersion]) {
          charData.versions[nextVersion] = { maxPrint: 250, currentPrint: 1 };
        }
      } else {
        // This character is completely maxed out
        return null;
      }
    }

    const result = {
      version: charData.currentVersion,
      print: charData.currentPrint
    };

    // Increment for next card
    charData.currentPrint++;
    this.versionDatabase.set(key, charData);
    this.saveVersionDatabase();

    return result;
  }

  async generateMultiTierCard(characterName, series, requestedTier = 'random') {
    try {
      // Get character images from collector
      const imageData = await this.collectCharacterImages(characterName, series);
      
      if (!imageData || imageData.total_images === 0) {
        throw new Error('No images found for character');
      }

      // Determine tier based on availability and request
      let selectedTier = 'static'; // Default
      const availableTiers = [];
      
      if (imageData.versions.static > 0) availableTiers.push('static');
      if (imageData.versions['3d'] > 0) availableTiers.push('3d');
      if (imageData.versions.animated > 0) availableTiers.push('animated');

      if (requestedTier === 'random') {
        // Weighted random selection (animated rarest, static most common)
        const weights = { 'static': 70, '3d': 20, 'animated': 10 };
        const availableWeighted = availableTiers.filter(tier => weights[tier]);
        
        if (availableWeighted.length > 0) {
          const random = Math.random() * 100;
          let cumulative = 0;
          
          for (const tier of availableWeighted) {
            cumulative += weights[tier];
            if (random <= cumulative) {
              selectedTier = tier;
              break;
            }
          }
        }
      } else if (availableTiers.includes(requestedTier)) {
        selectedTier = requestedTier;
      }

      // Get random image from selected tier
      const tierImages = imageData.images[selectedTier];
      if (!tierImages || tierImages.length === 0) {
        throw new Error(`No images available for tier: ${selectedTier}`);
      }

      const randomImage = tierImages[Math.floor(Math.random() * tierImages.length)];
      
      // Get version and print number
      const versionInfo = this.getNextCardVersion(characterName, series);
      if (!versionInfo) {
        throw new Error('Character has reached maximum card limit');
      }

      // Calculate rarity value (A #1 is most valuable)
      const rarityValue = this.calculateRarityValue(versionInfo.version, versionInfo.print, selectedTier);

      return {
        character: {
          name: characterName,
          series: series
        },
        image: {
          url: randomImage.url,
          tier: selectedTier,
          source: randomImage.source,
          quality: randomImage.quality_score
        },
        version: {
          letter: versionInfo.version,
          print: versionInfo.print,
          formatted: `${versionInfo.version} #${versionInfo.print}`
        },
        rarity: {
          tier: selectedTier,
          value: rarityValue,
          isFirstPrint: versionInfo.version === 'A' && versionInfo.print === 1
        },
        metadata: {
          createdAt: new Date().toISOString(),
          totalImages: imageData.total_images,
          tierCount: imageData.versions[selectedTier]
        }
      };

    } catch (error) {
      console.error('Error generating multi-tier card:', error);
      throw error;
    }
  }

  calculateRarityValue(version, print, tier) {
    // Base values for tiers
    const tierValues = {
      'static': 1,
      '3d': 2,
      'animated': 3
    };

    // Version multiplier (A is most valuable)
    const versionMultiplier = 26 - (version.charCodeAt(0) - 65); // A=26, B=25, C=24, etc.
    
    // Print number multiplier (lower print numbers are more valuable)
    const printMultiplier = Math.max(1, 251 - print); // #1=250, #2=249, etc.

    // Calculate final rarity value
    const baseValue = tierValues[tier] * 1000;
    const versionBonus = versionMultiplier * 100;
    const printBonus = printMultiplier;

    return baseValue + versionBonus + printBonus;
  }

  async generateCardBatch(count = 3, characters = null) {
    const cards = [];
    
    // If no characters specified, use popular anime characters
    if (!characters) {
      characters = [
        { name: "Nezuko Kamado", series: "Demon Slayer" },
        { name: "Zero Two", series: "Darling in the FranXX" },
        { name: "Rem", series: "Re:Zero" },
        { name: "Megumin", series: "KonoSuba" },
        { name: "Tanjiro Kamado", series: "Demon Slayer" },
        { name: "Goku", series: "Dragon Ball Z" },
        { name: "Naruto Uzumaki", series: "Naruto" },
        { name: "Luffy", series: "One Piece" },
        { name: "Ichigo Kurosaki", series: "Bleach" },
        { name: "Natsu Dragneel", series: "Fairy Tail" }
      ];
    }

    for (let i = 0; i < count; i++) {
      try {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        const card = await this.generateMultiTierCard(randomChar.name, randomChar.series);
        cards.push(card);
      } catch (error) {
        console.error(`Error generating card ${i + 1}:`, error);
        // Continue with next card
      }
    }

    return cards;
  }

  getCharacterStats(characterName, series) {
    const key = `${characterName}_${series}`.replace(/\s+/g, '_').toLowerCase();
    return this.versionDatabase.get(key) || null;
  }

  async getTopRarityCards(limit = 10) {
    // This would query the database for the highest rarity cards
    // For now, return empty array
    return [];
  }
}

module.exports = CardVersioningSystem;