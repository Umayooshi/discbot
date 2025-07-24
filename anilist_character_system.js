const axios = require('axios');

class AniListCharacterSystem {
  constructor() {
    this.baseURL = 'https://graphql.anilist.co';
    this.characterCache = [];
    this.loadedPages = 0;
    this.totalCharacters = 0;
    
    // Name normalization rules to fix common issues
    this.nameNormalizationRules = [
      // Common romanization fixes
      { from: 'ou', to: 'o', context: 'japanese' }, // Gojou → Gojo, Satou → Sato
      { from: 'uu', to: 'u', context: 'japanese' }, // Yuuji → Yuji, Ryuu → Ryu
      { from: 'Luffy Monkey', to: 'Monkey D. Luffy', exact: true },
      { from: 'Zoro Roronoa', to: 'Roronoa Zoro', exact: true },
      { from: 'Sanji Vinsmoke', to: 'Vinsmoke Sanji', exact: true },
      { from: 'Robin Nico', to: 'Nico Robin', exact: true },
      { from: 'Nami', to: 'Nami', exact: true }, // Keep as is
      { from: 'Chopper Tony Tony', to: 'Tony Tony Chopper', exact: true },
      { from: 'Usopp', to: 'Usopp', exact: true },
      { from: 'Franky', to: 'Franky', exact: true },
      { from: 'Brook', to: 'Brook', exact: true },
      { from: 'Jinbe', to: 'Jinbe', exact: true },
      { from: 'Naruto Uzumaki', to: 'Naruto Uzumaki', exact: true },
      { from: 'Sasuke Uchiha', to: 'Sasuke Uchiha', exact: true },
      { from: 'Sakura Haruno', to: 'Sakura Haruno', exact: true },
      { from: 'Kakashi Hatake', to: 'Kakashi Hatake', exact: true },
      { from: 'Goku Son', to: 'Son Goku', exact: true },
      { from: 'Vegeta', to: 'Vegeta', exact: true },
      { from: 'Gohan Son', to: 'Son Gohan', exact: true },
      { from: 'Ichigo Kurosaki', to: 'Ichigo Kurosaki', exact: true },
      { from: 'Rukia Kuchiki', to: 'Rukia Kuchiki', exact: true },
      { from: 'Eren Yeager', to: 'Eren Yeager', exact: true },
      { from: 'Mikasa Ackerman', to: 'Mikasa Ackerman', exact: true },
      { from: 'Levi Ackerman', to: 'Levi Ackerman', exact: true },
      { from: 'Tanjiro Kamado', to: 'Tanjiro Kamado', exact: true },
      { from: 'Nezuko Kamado', to: 'Nezuko Kamado', exact: true },
      { from: 'Zenitsu Agatsuma', to: 'Zenitsu Agatsuma', exact: true },
      { from: 'Inosuke Hashibira', to: 'Inosuke Hashibira', exact: true },
      { from: 'Edward Elric', to: 'Edward Elric', exact: true },
      { from: 'Alphonse Elric', to: 'Alphonse Elric', exact: true },
      { from: 'Light Yagami', to: 'Light Yagami', exact: true },
      { from: 'L Lawliet', to: 'L', exact: true },
      { from: 'Ryuk', to: 'Ryuk', exact: true },
      { from: 'Natsu Dragneel', to: 'Natsu Dragneel', exact: true },
      { from: 'Lucy Heartfilia', to: 'Lucy Heartfilia', exact: true },
      { from: 'Erza Scarlet', to: 'Erza Scarlet', exact: true }
    ];
    
    this.loadCharacters();
  }

  normalizeName(name) {
    if (!name) return name;
    
    let normalizedName = name;
    
    // Clean up text encoding issues and remove problematic characters
    normalizedName = normalizedName
      .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // Remove non-standard characters
      .replace(/[★☆※]/g, '') // Remove star symbols
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Apply exact match rules first
    for (const rule of this.nameNormalizationRules) {
      if (rule.exact && normalizedName === rule.from) {
        normalizedName = rule.to;
        break;
      }
    }
    
    // Apply Japanese romanization pattern fixes
    normalizedName = normalizedName
      .replace(/([aeiou])\1+/g, '$1') // Remove doubled vowels (aa -> a, oo -> o)
      .replace(/uu/g, 'u') // uu -> u
      .replace(/ou/g, 'o') // ou -> o (Japanese long vowel fix)
      .replace(/oo/g, 'o') // oo -> o
      .replace(/\bGojou\b/g, 'Gojo') // Satoru Gojou -> Satoru Gojo
      .replace(/\bGoujou\b/g, 'Gojo') // Alternative spelling
      .replace(/\bYuugi\b/g, 'Yugi') // Yuugi -> Yugi
      .replace(/\bKakashii\b/g, 'Kakashi') // Fix doubled consonants
      .replace(/\bSasuuke\b/g, 'Sasuke')
      .replace(/\bNaruuto\b/g, 'Naruto');
    
    // Fix reversed names (Last First -> First Last)
    if (normalizedName.includes(' ')) {
      const parts = normalizedName.split(' ');
      if (parts.length === 2) {
        const [first, second] = parts;
        // Check for common Japanese surname patterns
        if (second.match(/^(Uchiha|Uzumaki|Hatake|Hyuga|Nara|Yamanaka|Akimichi|Inuzuka)$/)) {
          normalizedName = `${second} ${first}`;
        }
      }
    }
    
    return normalizedName;
  }

  async loadCharacters() {
    try {
      // Check if we have cached characters file
      const fs = require('fs');
      const cachedCharactersPath = './anilist_characters_cache.json';
      
      if (fs.existsSync(cachedCharactersPath)) {
        console.log('Loading characters from cache file...');
        const cachedData = JSON.parse(fs.readFileSync(cachedCharactersPath, 'utf8'));
        this.characterCache = cachedData.characters || [];
        this.totalCharacters = this.characterCache.length;
        console.log(`Loaded ${this.totalCharacters} characters from cache`);
        console.log(`Sample characters: ${this.characterCache.slice(0, 5).map(c => c.name).join(', ')}`);
        return;
      }
      
      console.log('No cache found, fetching characters from AniList (target: 2000)...');
      console.log('Loading 80 pages of characters...');
      
      for (let page = 1; page <= 80; page++) {
        const characters = await this.fetchCharactersFromPage(page);
        
        if (characters.length === 0) {
          console.log('Reached end of available characters, stopping');
          break;
        }
        
        for (const char of characters) {
          const normalizedName = this.normalizeName(char.name);
          this.characterCache.push({
            ...char,
            name: normalizedName
          });
        }
        
        this.loadedPages = page;
        this.totalCharacters = this.characterCache.length;
        console.log(`Loaded page ${page}/80 - Total characters: ${this.totalCharacters}`);
        
        // Rate limiting delay
        await this.delay(300);
      }
      
      // Save to cache file for faster future loading
      const cacheData = {
        lastUpdated: new Date().toISOString(),
        characters: this.characterCache
      };
      fs.writeFileSync(cachedCharactersPath, JSON.stringify(cacheData, null, 2));
      console.log(`Saved ${this.totalCharacters} characters to cache file`);
      
      console.log(`AniList character system ready with ${this.totalCharacters} characters`);
      console.log(`Sample characters: ${this.characterCache.slice(0, 5).map(c => c.name).join(', ')}`);
    } catch (error) {
      console.error('Error loading AniList characters:', error);
      console.log('Using fallback character database');
    }
  }

  async fetchCharactersFromPage(page) {
    try {
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            characters {
              id
              name {
                full
                native
              }
              image {
                large
                medium
              }
              media {
                nodes {
                  title {
                    romaji
                    english
                  }
                  type
                }
              }
            }
          }
        }
      `;
      
      const variables = {
        page,
        perPage: 50
      };
      
      const response = await axios.post('https://graphql.anilist.co', {
        query,
        variables
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.data?.data?.Page?.characters) {
        return [];
      }
      
      return response.data.data.Page.characters.map(char => {
        const primaryMedia = char.media?.nodes?.[0];
        
        // Clean up series name for text rendering
        let seriesName = primaryMedia?.title?.english || primaryMedia?.title?.romaji || 'Unknown Series';
        seriesName = seriesName
          .replace(/[★☆※]/g, '') // Remove star symbols
          .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // Remove problematic characters
          .replace(/\s+/g, ' ')
          .trim();
        
        return {
          id: char.id,
          name: char.name?.full || char.name?.native || 'Unknown Character',
          series: seriesName,
          imageUrl: char.image?.large || char.image?.medium
        };
      }).filter(char => char.imageUrl);
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`Rate limited on page ${page}, waiting longer...`);
        await this.delay(2000);
        return [];
      }
      throw error;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchCharacterPage(page) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          characters(sort: FAVOURITES_DESC) {
            id
            name {
              full
              native
            }
            image {
              large
              medium
            }
            media(type: ANIME, sort: POPULARITY_DESC, perPage: 1) {
              nodes {
                title {
                  romaji
                  english
                }
              }
            }
            favourites
          }
        }
      }
    `;

    const variables = {
      page: page,
      perPage: 50
    };

    try {
      const response = await axios.post(this.baseURL, {
        query: query,
        variables: variables
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.data && response.data.data.Page) {
        const characters = response.data.data.Page.characters;
        
        return characters.map(char => {
          const series = char.media.nodes[0] ? 
            (char.media.nodes[0].title.english || char.media.nodes[0].title.romaji) : 
            'Unknown Series';
            
          return {
            id: char.id.toString(),
            name: char.name.full || 'Unknown Character',
            series: series,
            image: char.image.large || char.image.medium,
            favourites: char.favourites || 0,
            source: 'anilist'
          };
        }).filter(char => char.name !== 'Unknown Character' && char.image);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching AniList page ${page}:`, error.message);
      return [];
    }
  }

  async getRandomCharacters(count = 1) {
    try {
      console.log(`Getting ${count} characters from AniList database...`);
      const characters = [];
      
      if (this.characterCache.length === 0) {
        console.log('No characters in cache, using fallback');
        return this.getFallbackCharacters(count);
      }
      
      // Filter characters with valid images first
      const validCharacters = this.characterCache.filter(char => char.imageUrl && char.imageUrl !== 'undefined');
      
      if (validCharacters.length === 0) {
        console.log('No valid characters with images found, using fallback');
        return this.getFallbackCharacters(count);
      }
      
      // Create a copy to avoid modifying the original array
      const availableCharacters = [...validCharacters];
      
      for (let i = 0; i < count && availableCharacters.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableCharacters.length);
        const selected = availableCharacters[randomIndex];
        
        characters.push({
          id: selected.id,
          name: selected.name,
          series: selected.series,
          image: selected.imageUrl,
          imageUrl: selected.imageUrl,
          favourites: selected.favourites,
          source: 'anilist',
          type: 'anilist'
        });
        
        // Remove selected character to prevent duplicates
        availableCharacters.splice(randomIndex, 1);
        
        console.log(`Selected AniList character: ${selected.name} from ${selected.series}`);
      }
      
      // If we didn't get enough valid characters, fill with fallback
      while (characters.length < count) {
        const fallback = this.getFallbackCharacters(1)[0];
        characters.push(fallback);
      }
      
      return characters;
    } catch (error) {
      console.error('Error getting AniList characters:', error);
      return this.getFallbackCharacters(count);
    }
  }

  async getGifCharacter() {
    try {
      console.log('Getting AniList GIF character...');
      const characters = await this.getRandomCharacters(1);
      
      if (characters.length > 0) {
        return {
          ...characters[0],
          isGif: true,
          type: 'anilist_gif'
        };
      }
      
      return this.getFallbackGifCharacter();
    } catch (error) {
      console.error('Error getting AniList GIF character:', error);
      return this.getFallbackGifCharacter();
    }
  }

  getFallbackCharacters(count) {
    const fallbackChars = [
      { id: '1', name: 'Monkey D. Luffy', series: 'One Piece', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40-chM58OKhZgwg.png', favourites: 15000 },
      { id: '2', name: 'Naruto Uzumaki', series: 'Naruto', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b17-zE21vgxbgFTm.png', favourites: 12000 },
      { id: '3', name: 'Son Goku', series: 'Dragon Ball Z', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b246-vD_5nBPBgSnr.png', favourites: 10000 },
      { id: '4', name: 'Satoru Gojo', series: 'Jujutsu Kaisen', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b138870-kNDgZUGhPTIj.png', favourites: 8000 },
      { id: '5', name: 'Roronoa Zoro', series: 'One Piece', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b62-RG4dQo2oa7eV.png', favourites: 7500 },
      { id: '6', name: 'Sasuke Uchiha', series: 'Naruto', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b13-INqgrJE8BfAJ.png', favourites: 7000 },
      { id: '7', name: 'Levi Ackerman', series: 'Attack on Titan', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b45627-0YjZRJ1DcFnR.png', favourites: 6500 },
      { id: '8', name: 'Killua Zoldyck', series: 'Hunter x Hunter', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b27-TL6VHSQ4Qfhz.png', favourites: 6000 },
      { id: '9', name: 'Eren Yeager', series: 'Attack on Titan', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40882-DSj5QMFZ8Qez.png', favourites: 5500 },
      { id: '10', name: 'Tanjiro Kamado', series: 'Demon Slayer', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b146156-RdJZKkBDNhHV.png', favourites: 5000 },
      { id: '11', name: 'Edward Elric', series: 'Fullmetal Alchemist', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b11-Xyc0Fs5Fcgbn.png', favourites: 4500 },
      { id: '12', name: 'Light Yagami', series: 'Death Note', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b80-UHMrUAW7y6b0.png', favourites: 4000 },
      { id: '13', name: 'Ichigo Kurosaki', series: 'Bleach', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b5-ARiOQMF2HhQ5.png', favourites: 3800 },
      { id: '14', name: 'Vegeta', series: 'Dragon Ball Z', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b913-7N5HH1iI36xU.png', favourites: 3600 },
      { id: '15', name: 'Kakashi Hatake', series: 'Naruto', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b85-cLPjJnmZg6gp.png', favourites: 3400 },
      { id: '16', name: 'Nezuko Kamado', series: 'Demon Slayer', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b146157-NbzGNOWLYlsa.png', favourites: 3200 },
      { id: '17', name: 'Mikasa Ackerman', series: 'Attack on Titan', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40881-ULhzgIaHA9O5.png', favourites: 3000 },
      { id: '18', name: 'Gon Freecss', series: 'Hunter x Hunter', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b30-b3MFKyOALfWw.png', favourites: 2800 },
      { id: '19', name: 'Saitama', series: 'One Punch Man', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b73935-8NUyJbWGiK9V.png', favourites: 2600 },
      { id: '20', name: 'Alphonse Elric', series: 'Fullmetal Alchemist', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b12-Iz3reDIl8MFNG.png', favourites: 2400 }
    ];
    
    const characters = [];
    for (let i = 0; i < count; i++) {
      const selected = fallbackChars[i % fallbackChars.length];
      characters.push({
        ...selected,
        source: 'fallback',
        type: 'fallback'
      });
    }
    return characters;
  }

  getFallbackGifCharacter() {
    const fallback = this.getFallbackCharacters(1)[0];
    return {
      ...fallback,
      isGif: true,
      type: 'fallback_gif'
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      totalCharacters: this.totalCharacters,
      loadedPages: this.loadedPages,
      cacheSize: this.characterCache.length
    };
  }
}

module.exports = AniListCharacterSystem;