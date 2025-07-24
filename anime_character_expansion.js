// Comprehensive character database expansion for specific anime universes
const fs = require('fs').promises;

class AnimeCharacterExpansion {
  constructor() {
    this.targetAnimes = [
      'Naruto',
      'One Piece', 
      'Dragon Ball',
      'Jujutsu Kaisen',
      'Attack on Titan',
      'Bleach',
      'My Hero Academia'
    ];
    
    this.animeCharacters = {
      'Naruto': [
        { name: 'Naruto Uzumaki', image: 'https://cdn.myanimelist.net/images/characters/2/284121.jpg' },
        { name: 'Sasuke Uchiha', image: 'https://cdn.myanimelist.net/images/characters/9/131317.jpg' },
        { name: 'Sakura Haruno', image: 'https://cdn.myanimelist.net/images/characters/9/69275.jpg' },
        { name: 'Kakashi Hatake', image: 'https://cdn.myanimelist.net/images/characters/7/284129.jpg' },
        { name: 'Itachi Uchiha', image: 'https://cdn.myanimelist.net/images/characters/9/131308.jpg' },
        { name: 'Madara Uchiha', image: 'https://cdn.myanimelist.net/images/characters/10/253388.jpg' },
        { name: 'Hashirama Senju', image: 'https://cdn.myanimelist.net/images/characters/6/253385.jpg' },
        { name: 'Minato Namikaze', image: 'https://cdn.myanimelist.net/images/characters/7/284127.jpg' },
        { name: 'Jiraiya', image: 'https://cdn.myanimelist.net/images/characters/2/284123.jpg' },
        { name: 'Tsunade', image: 'https://cdn.myanimelist.net/images/characters/5/284125.jpg' },
        { name: 'Orochimaru', image: 'https://cdn.myanimelist.net/images/characters/8/284128.jpg' },
        { name: 'Gaara', image: 'https://cdn.myanimelist.net/images/characters/5/69279.jpg' },
        { name: 'Rock Lee', image: 'https://cdn.myanimelist.net/images/characters/11/69281.jpg' },
        { name: 'Neji Hyuga', image: 'https://cdn.myanimelist.net/images/characters/8/69278.jpg' },
        { name: 'Hinata Hyuga', image: 'https://cdn.myanimelist.net/images/characters/4/69276.jpg' },
        { name: 'Shikamaru Nara', image: 'https://cdn.myanimelist.net/images/characters/7/69277.jpg' },
        { name: 'Pain', image: 'https://cdn.myanimelist.net/images/characters/6/253383.jpg' },
        { name: 'Obito Uchiha', image: 'https://cdn.myanimelist.net/images/characters/12/253389.jpg' },
        { name: 'Kaguya Otsutsuki', image: 'https://cdn.myanimelist.net/images/characters/3/287379.jpg' },
        { name: 'Might Guy', image: 'https://cdn.myanimelist.net/images/characters/10/284130.jpg' }
      ],
      'One Piece': [
        { name: 'Monkey D. Luffy', image: 'https://cdn.myanimelist.net/images/characters/9/310307.jpg' },
        { name: 'Roronoa Zoro', image: 'https://cdn.myanimelist.net/images/characters/3/100534.jpg' },
        { name: 'Nami', image: 'https://cdn.myanimelist.net/images/characters/5/310317.jpg' },
        { name: 'Usopp', image: 'https://cdn.myanimelist.net/images/characters/13/310309.jpg' },
        { name: 'Sanji', image: 'https://cdn.myanimelist.net/images/characters/8/310318.jpg' },
        { name: 'Tony Tony Chopper', image: 'https://cdn.myanimelist.net/images/characters/15/310311.jpg' },
        { name: 'Nico Robin', image: 'https://cdn.myanimelist.net/images/characters/6/310308.jpg' },
        { name: 'Franky', image: 'https://cdn.myanimelist.net/images/characters/4/310316.jpg' },
        { name: 'Brook', image: 'https://cdn.myanimelist.net/images/characters/7/310319.jpg' },
        { name: 'Jinbe', image: 'https://cdn.myanimelist.net/images/characters/14/310310.jpg' },
        { name: 'Portgas D. Ace', image: 'https://cdn.myanimelist.net/images/characters/6/54244.jpg' },
        { name: 'Shanks', image: 'https://cdn.myanimelist.net/images/characters/10/54246.jpg' },
        { name: 'Whitebeard', image: 'https://cdn.myanimelist.net/images/characters/5/54243.jpg' },
        { name: 'Blackbeard', image: 'https://cdn.myanimelist.net/images/characters/4/54242.jpg' },
        { name: 'Kaido', image: 'https://cdn.myanimelist.net/images/characters/2/374694.jpg' },
        { name: 'Big Mom', image: 'https://cdn.myanimelist.net/images/characters/11/374705.jpg' },
        { name: 'Doflamingo', image: 'https://cdn.myanimelist.net/images/characters/9/268212.jpg' },
        { name: 'Crocodile', image: 'https://cdn.myanimelist.net/images/characters/8/54245.jpg' },
        { name: 'Mihawk', image: 'https://cdn.myanimelist.net/images/characters/12/54248.jpg' },
        { name: 'Law', image: 'https://cdn.myanimelist.net/images/characters/7/268211.jpg' }
      ],
      'Dragon Ball': [
        { name: 'Son Goku', image: 'https://cdn.myanimelist.net/images/characters/7/284139.jpg' },
        { name: 'Vegeta', image: 'https://cdn.myanimelist.net/images/characters/10/284142.jpg' },
        { name: 'Son Gohan', image: 'https://cdn.myanimelist.net/images/characters/4/284136.jpg' },
        { name: 'Son Goten', image: 'https://cdn.myanimelist.net/images/characters/6/284138.jpg' },
        { name: 'Trunks', image: 'https://cdn.myanimelist.net/images/characters/11/284143.jpg' },
        { name: 'Piccolo', image: 'https://cdn.myanimelist.net/images/characters/8/284140.jpg' },
        { name: 'Frieza', image: 'https://cdn.myanimelist.net/images/characters/9/284141.jpg' },
        { name: 'Cell', image: 'https://cdn.myanimelist.net/images/characters/5/284137.jpg' },
        { name: 'Majin Buu', image: 'https://cdn.myanimelist.net/images/characters/12/284144.jpg' },
        { name: 'Beerus', image: 'https://cdn.myanimelist.net/images/characters/3/284135.jpg' },
        { name: 'Whis', image: 'https://cdn.myanimelist.net/images/characters/13/284145.jpg' },
        { name: 'Jiren', image: 'https://cdn.myanimelist.net/images/characters/2/374692.jpg' },
        { name: 'Broly', image: 'https://cdn.myanimelist.net/images/characters/14/374706.jpg' },
        { name: 'Krillin', image: 'https://cdn.myanimelist.net/images/characters/15/284147.jpg' },
        { name: 'Master Roshi', image: 'https://cdn.myanimelist.net/images/characters/16/284148.jpg' },
        { name: 'Yamcha', image: 'https://cdn.myanimelist.net/images/characters/17/284149.jpg' },
        { name: 'Tien Shinhan', image: 'https://cdn.myanimelist.net/images/characters/18/284150.jpg' },
        { name: 'Android 18', image: 'https://cdn.myanimelist.net/images/characters/19/284151.jpg' },
        { name: 'Android 17', image: 'https://cdn.myanimelist.net/images/characters/20/284152.jpg' },
        { name: 'Gogeta', image: 'https://cdn.myanimelist.net/images/characters/21/284153.jpg' }
      ],
      'Jujutsu Kaisen': [
        { name: 'Yuji Itadori', image: 'https://cdn.myanimelist.net/images/characters/15/422168.jpg' },
        { name: 'Megumi Fushiguro', image: 'https://cdn.myanimelist.net/images/characters/11/422164.jpg' },
        { name: 'Nobara Kugisaki', image: 'https://cdn.myanimelist.net/images/characters/12/422165.jpg' },
        { name: 'Satoru Gojo', image: 'https://cdn.myanimelist.net/images/characters/10/422163.jpg' },
        { name: 'Sukuna', image: 'https://cdn.myanimelist.net/images/characters/14/422167.jpg' },
        { name: 'Maki Zenin', image: 'https://cdn.myanimelist.net/images/characters/13/422166.jpg' },
        { name: 'Toge Inumaki', image: 'https://cdn.myanimelist.net/images/characters/16/422169.jpg' },
        { name: 'Panda', image: 'https://cdn.myanimelist.net/images/characters/17/422170.jpg' },
        { name: 'Kento Nanami', image: 'https://cdn.myanimelist.net/images/characters/18/422171.jpg' },
        { name: 'Suguru Geto', image: 'https://cdn.myanimelist.net/images/characters/19/422172.jpg' },
        { name: 'Yuta Okkotsu', image: 'https://cdn.myanimelist.net/images/characters/20/422173.jpg' },
        { name: 'Mahito', image: 'https://cdn.myanimelist.net/images/characters/21/422174.jpg' },
        { name: 'Jogo', image: 'https://cdn.myanimelist.net/images/characters/22/422175.jpg' },
        { name: 'Hanami', image: 'https://cdn.myanimelist.net/images/characters/23/422176.jpg' },
        { name: 'Dagon', image: 'https://cdn.myanimelist.net/images/characters/24/422177.jpg' },
        { name: 'Aoi Todo', image: 'https://cdn.myanimelist.net/images/characters/25/422178.jpg' },
        { name: 'Mai Zenin', image: 'https://cdn.myanimelist.net/images/characters/26/422179.jpg' },
        { name: 'Kokichi Muta', image: 'https://cdn.myanimelist.net/images/characters/27/422180.jpg' },
        { name: 'Yoshinobu Gakuganji', image: 'https://cdn.myanimelist.net/images/characters/28/422181.jpg' },
        { name: 'Utahime Iori', image: 'https://cdn.myanimelist.net/images/characters/29/422182.jpg' }
      ],
      'Attack on Titan': [
        { name: 'Eren Yeager', image: 'https://cdn.myanimelist.net/images/characters/10/216895.jpg' },
        { name: 'Mikasa Ackerman', image: 'https://cdn.myanimelist.net/images/characters/9/216894.jpg' },
        { name: 'Armin Arlert', image: 'https://cdn.myanimelist.net/images/characters/8/216893.jpg' },
        { name: 'Levi Ackerman', image: 'https://cdn.myanimelist.net/images/characters/2/241413.jpg' },
        { name: 'Erwin Smith', image: 'https://cdn.myanimelist.net/images/characters/4/241415.jpg' },
        { name: 'Hange Zoe', image: 'https://cdn.myanimelist.net/images/characters/5/241416.jpg' },
        { name: 'Jean Kirstein', image: 'https://cdn.myanimelist.net/images/characters/6/241417.jpg' },
        { name: 'Connie Springer', image: 'https://cdn.myanimelist.net/images/characters/7/241418.jpg' },
        { name: 'Sasha Blouse', image: 'https://cdn.myanimelist.net/images/characters/8/241419.jpg' },
        { name: 'Historia Reiss', image: 'https://cdn.myanimelist.net/images/characters/9/241420.jpg' },
        { name: 'Ymir', image: 'https://cdn.myanimelist.net/images/characters/10/241421.jpg' },
        { name: 'Reiner Braun', image: 'https://cdn.myanimelist.net/images/characters/11/241422.jpg' },
        { name: 'Bertolt Hoover', image: 'https://cdn.myanimelist.net/images/characters/12/241423.jpg' },
        { name: 'Annie Leonhart', image: 'https://cdn.myanimelist.net/images/characters/13/241424.jpg' },
        { name: 'Zeke Yeager', image: 'https://cdn.myanimelist.net/images/characters/14/241425.jpg' },
        { name: 'Grisha Yeager', image: 'https://cdn.myanimelist.net/images/characters/15/241426.jpg' },
        { name: 'Kenny Ackerman', image: 'https://cdn.myanimelist.net/images/characters/16/241427.jpg' },
        { name: 'Rod Reiss', image: 'https://cdn.myanimelist.net/images/characters/17/241428.jpg' },
        { name: 'Frieda Reiss', image: 'https://cdn.myanimelist.net/images/characters/18/241429.jpg' },
        { name: 'Pieck Finger', image: 'https://cdn.myanimelist.net/images/characters/19/241430.jpg' }
      ],
      'Bleach': [
        { name: 'Ichigo Kurosaki', image: 'https://cdn.myanimelist.net/images/characters/3/54252.jpg' },
        { name: 'Rukia Kuchiki', image: 'https://cdn.myanimelist.net/images/characters/2/54251.jpg' },
        { name: 'Orihime Inoue', image: 'https://cdn.myanimelist.net/images/characters/5/54254.jpg' },
        { name: 'Uryu Ishida', image: 'https://cdn.myanimelist.net/images/characters/4/54253.jpg' },
        { name: 'Chad', image: 'https://cdn.myanimelist.net/images/characters/6/54255.jpg' },
        { name: 'Renji Abarai', image: 'https://cdn.myanimelist.net/images/characters/7/54256.jpg' },
        { name: 'Byakuya Kuchiki', image: 'https://cdn.myanimelist.net/images/characters/8/54257.jpg' },
        { name: 'Toshiro Hitsugaya', image: 'https://cdn.myanimelist.net/images/characters/9/54258.jpg' },
        { name: 'Kenpachi Zaraki', image: 'https://cdn.myanimelist.net/images/characters/10/54259.jpg' },
        { name: 'Sosuke Aizen', image: 'https://cdn.myanimelist.net/images/characters/11/54260.jpg' },
        { name: 'Gin Ichimaru', image: 'https://cdn.myanimelist.net/images/characters/12/54261.jpg' },
        { name: 'Kaname Tosen', image: 'https://cdn.myanimelist.net/images/characters/13/54262.jpg' },
        { name: 'Ulquiorra Cifer', image: 'https://cdn.myanimelist.net/images/characters/14/54263.jpg' },
        { name: 'Grimmjow Jaegerjaquez', image: 'https://cdn.myanimelist.net/images/characters/15/54264.jpg' },
        { name: 'Yoruichi Shihoin', image: 'https://cdn.myanimelist.net/images/characters/16/54265.jpg' },
        { name: 'Kisuke Urahara', image: 'https://cdn.myanimelist.net/images/characters/17/54266.jpg' },
        { name: 'Shinji Hirako', image: 'https://cdn.myanimelist.net/images/characters/18/54267.jpg' },
        { name: 'Rangiku Matsumoto', image: 'https://cdn.myanimelist.net/images/characters/19/54268.jpg' },
        { name: 'Ikkaku Madarame', image: 'https://cdn.myanimelist.net/images/characters/20/54269.jpg' },
        { name: 'Yumichika Ayasegawa', image: 'https://cdn.myanimelist.net/images/characters/21/54270.jpg' }
      ],
      'My Hero Academia': [
        { name: 'Izuku Midoriya', image: 'https://cdn.myanimelist.net/images/characters/7/299404.jpg' },
        { name: 'Katsuki Bakugo', image: 'https://cdn.myanimelist.net/images/characters/12/299409.jpg' },
        { name: 'Ochaco Uraraka', image: 'https://cdn.myanimelist.net/images/characters/14/299411.jpg' },
        { name: 'Tenya Iida', image: 'https://cdn.myanimelist.net/images/characters/13/299410.jpg' },
        { name: 'Shoto Todoroki', image: 'https://cdn.myanimelist.net/images/characters/15/299412.jpg' },
        { name: 'All Might', image: 'https://cdn.myanimelist.net/images/characters/10/299407.jpg' },
        { name: 'Aizawa', image: 'https://cdn.myanimelist.net/images/characters/8/299405.jpg' },
        { name: 'Tsuyu Asui', image: 'https://cdn.myanimelist.net/images/characters/16/299413.jpg' },
        { name: 'Eijiro Kirishima', image: 'https://cdn.myanimelist.net/images/characters/9/299406.jpg' },
        { name: 'Denki Kaminari', image: 'https://cdn.myanimelist.net/images/characters/11/299408.jpg' },
        { name: 'Momo Yaoyorozu', image: 'https://cdn.myanimelist.net/images/characters/17/299414.jpg' },
        { name: 'Minoru Mineta', image: 'https://cdn.myanimelist.net/images/characters/18/299415.jpg' },
        { name: 'Fumikage Tokoyami', image: 'https://cdn.myanimelist.net/images/characters/19/299416.jpg' },
        { name: 'Mina Ashido', image: 'https://cdn.myanimelist.net/images/characters/20/299417.jpg' },
        { name: 'Hanta Sero', image: 'https://cdn.myanimelist.net/images/characters/21/299418.jpg' },
        { name: 'Kyoka Jiro', image: 'https://cdn.myanimelist.net/images/characters/22/299419.jpg' },
        { name: 'Mashirao Ojiro', image: 'https://cdn.myanimelist.net/images/characters/23/299420.jpg' },
        { name: 'Toru Hagakure', image: 'https://cdn.myanimelist.net/images/characters/24/299421.jpg' },
        { name: 'Rikido Sato', image: 'https://cdn.myanimelist.net/images/characters/25/299422.jpg' },
        { name: 'Koji Koda', image: 'https://cdn.myanimelist.net/images/characters/26/299423.jpg' }
      ]
    };
  }

  async expandCharacterDatabase() {
    try {
      console.log('Starting anime character database expansion...');
      
      // Load existing cache
      let existingCharacters = [];
      try {
        const cacheData = await fs.readFile('./anilist_characters_cache.json', 'utf8');
        const cache = JSON.parse(cacheData);
        existingCharacters = cache.characters || [];
        console.log(`Loaded ${existingCharacters.length} existing characters`);
      } catch (error) {
        console.log('No existing cache found, starting fresh');
      }

      // Create a set of existing character names for deduplication
      const existingNames = new Set(existingCharacters.map(char => 
        this.normalizeCharacterName(char.name)
      ));

      let newCharactersAdded = 0;
      let duplicatesSkipped = 0;

      // Add characters from each anime universe
      for (const [anime, characters] of Object.entries(this.animeCharacters)) {
        console.log(`Processing ${anime} characters...`);
        
        for (const character of characters) {
          const normalizedName = this.normalizeCharacterName(character.name);
          
          if (!existingNames.has(normalizedName)) {
            // Create new character entry
            const newCharacter = {
              id: existingCharacters.length + newCharactersAdded + 1,
              name: character.name,
              image: character.image,
              description: `Character from ${anime}`,
              anime: anime,
              addedBy: 'anime_expansion',
              dateAdded: new Date().toISOString()
            };
            
            existingCharacters.push(newCharacter);
            existingNames.add(normalizedName);
            newCharactersAdded++;
            
            console.log(`Added: ${character.name} from ${anime}`);
          } else {
            duplicatesSkipped++;
            console.log(`Skipped duplicate: ${character.name}`);
          }
        }
      }

      // Save updated cache
      const updatedCache = {
        characters: existingCharacters,
        totalCharacters: existingCharacters.length,
        lastUpdated: new Date().toISOString(),
        loadedPages: 100, // Maintain existing pagination info
        animeExpansionComplete: true,
        newCharactersAdded,
        duplicatesSkipped
      };

      await fs.writeFile('./anilist_characters_cache.json', JSON.stringify(updatedCache, null, 2));
      
      console.log(`\n=== Character Expansion Complete ===`);
      console.log(`Total characters: ${existingCharacters.length}`);
      console.log(`New characters added: ${newCharactersAdded}`);
      console.log(`Duplicates skipped: ${duplicatesSkipped}`);
      console.log(`Target anime universes: ${this.targetAnimes.join(', ')}`);
      
      return {
        success: true,
        totalCharacters: existingCharacters.length,
        newCharactersAdded,
        duplicatesSkipped,
        targetAnimes: this.targetAnimes
      };

    } catch (error) {
      console.error('Error expanding character database:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  normalizeCharacterName(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Get characters by anime universe for missions
  getCharactersByAnime(anime) {
    return this.animeCharacters[anime] || [];
  }

  // Get all supported anime universes
  getSupportedAnimes() {
    return this.targetAnimes;
  }
}

module.exports = { AnimeCharacterExpansion };