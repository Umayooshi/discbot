const { Client, GatewayIntentBits, SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, EmbedBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const mongoose = require('mongoose');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const abilities = require('./abilities');
const battleSystem = require('./battleSystem');
const gameLogic = require('./gameLogic');
// Mission system removed
const classSystem = require('./classSystem');
const emojiAPI = require('./emojiAPI');
const FreepikEmojiSystem = require('./freepik_emoji_system');
const EnhancedEmojiSystem = require('./enhanced_emoji_system');
const AniListCharacterSystem = require('./anilist_character_system');
const SimpleVersioning = require('./simple_versioning');
const TrainingSystem = require('./training_system');
const MissionSystem = require('./mission_system');
const InteractiveMissionSystem = require('./interactive_mission_system');
const HealthRecoverySystem = require('./health_recovery_system');
const ShopSystem = require('./shop_system');
require('dotenv').config();

// Custom emojis for bot aesthetics
const CUSTOM_EMOJIS = {
  tank: '<:tank:1397654349823344680>',
  damage: '<:damage:1397654774144303165>',
  support: '<:support:1397657410830860430>',
  intel: '<:intel:1397658594333294834>',
  lumen: '<:lumen:1397657413271818422>',
  novagem: '<:novagem:1397657403477987408>',
  mysticshard: '<:mysticshard:1397657408104300725>'
};

// Utility function to get class emoji
function getClassEmoji(className) {
  return CUSTOM_EMOJIS[className.toLowerCase()] || '⚔️';
}

// Utility function to get currency emoji
function getCurrencyEmoji(currencyType) {
  const type = currencyType.toLowerCase().replace(/\s+/g, '');
  if (type.includes('lumen')) return CUSTOM_EMOJIS.lumen;
  if (type.includes('nova') || type.includes('gem')) return CUSTOM_EMOJIS.novagem;
  if (type.includes('mystic') || type.includes('shard')) return CUSTOM_EMOJIS.mysticshard;
  return '💰';
}

// Initialize systems
const aniListCharacterSystem = new AniListCharacterSystem();
const simpleVersioning = new SimpleVersioning();
const enhancedEmojiSystem = require('./enhanced_emoji_system.js');
const trainingSystem = new TrainingSystem();
const missionSystem = new MissionSystem();
// OLD INTERACTIVE MISSION SYSTEM REMOVED - USING CLEAN MISSION SYSTEM ONLY
const InteractiveMissionSystemV2 = require('./interactive_mission_system_v2.js');
const missionSystemV2 = new InteractiveMissionSystemV2();
const AIBattleSystem = require('./ai_battle_system.js');
const aiBattleSystem = new AIBattleSystem();
const ShopkeeperSystem = require('./shopkeeper_system.js');
const shopkeeperSystem = new ShopkeeperSystem();
const healthRecoverySystem = new HealthRecoverySystem();
const shopSystem = new ShopSystem();
const FishingSystem = require('./fishing_system.js');
const fishingSystem = new FishingSystem();
const AuraSystem = require('./aura_system.js');
const auraSystem = new AuraSystem();
const NewBattleSystem = require('./new_battle_system.js');
const newBattleSystem = new NewBattleSystem();

// MAL system removed - back to AniList only
const { debugSystem, debug } = require('./enhanced_debug_system');
const GradingSystem = require('./grading_system.js');
// Initialize grading system after models are defined

// Add persistent lineup storage to prevent data loss on restart
const fs = require('fs');
const LINEUP_FILE = './user_lineups.json';

// Load saved lineups on startup
function loadLineups() {
  try {
    if (fs.existsSync(LINEUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(LINEUP_FILE, 'utf8'));
      Object.entries(data).forEach(([userId, lineup]) => {
        newBattleSystem.activeLineups.set(userId, lineup);
      });
      console.log(`Loaded ${Object.keys(data).length} saved lineups`);
    }
  } catch (error) {
    console.error('Error loading lineups:', error);
  }
}

// Save lineups to prevent data loss
function saveLineups() {
  try {
    const lineupsObj = Object.fromEntries(newBattleSystem.activeLineups);
    fs.writeFileSync(LINEUP_FILE, JSON.stringify(lineupsObj, null, 2));
  } catch (error) {
    console.error('Error saving lineups:', error);
  }
}

// Load lineups on startup
loadLineups();

// Load user lineups as object for easy access
let userLineups = {};
try {
  if (fs.existsSync(LINEUP_FILE)) {
    userLineups = JSON.parse(fs.readFileSync(LINEUP_FILE, 'utf8'));
    console.log(`Loaded ${Object.keys(userLineups).length} user lineups for battle system`);
  }
} catch (error) {
  console.log('No existing lineup file found, starting fresh');
  userLineups = {};
}
const FrameOverlaySystem = require('./frame_overlay_system.js');
const frameOverlaySystem = new FrameOverlaySystem();

// Professional Image System - Sharp + Canvas integration
const ProfessionalImageSystem = require('./professional_image_system.js');

// Sharp GIF System for animated cards
const SharpGifSystem = require('./sharp_gif_system.js');
const sharpGifSystem = new SharpGifSystem();

// Temporary card storage for drop sessions
const dropCardCache = new Map();

// Battle sessions storage
const battleSessions = new Map();

// Generate battle arena image using our proven Sharp system
async function generateBattleArena(battleState) {
  try {
    // Generate all 6 card images
    const userCardBuffers = await Promise.all(
      battleState.userTeam.map(card => generateCardImage(card, true))
    );
    const enemyCardBuffers = await Promise.all(
      battleState.enemyTeam.map(card => generateCardImage(card, true))
    );
    
    const sharp = require('sharp');
    const { createCanvas } = require('canvas');
    
    // Battle arena dimensions - larger cards for better visibility
    const canvasWidth = 1600;
    const canvasHeight = 1200;
    const cardWidth = 380;  // Increased from 300
    const cardHeight = 570; // Increased from 450
    
    // Create darker background (#242429)
    const background = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 3,
        background: { r: 36, g: 36, b: 41 }  // #242429
      }
    }).png().toBuffer();
    
    // Resize all cards
    const resizedUserCards = await Promise.all(
      userCardBuffers.map(buffer => 
        sharp(buffer).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer()
      )
    );
    const resizedEnemyCards = await Promise.all(
      enemyCardBuffers.map(buffer => 
        sharp(buffer).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer()
      )
    );
    
    // Position cards: User team on top, enemy team on bottom - adjusted for larger cards
    const spacing = 80;  // Slightly reduced spacing for larger cards
    const startX = (canvasWidth - (cardWidth * 3 + spacing * 2)) / 2;
    const userY = 40;    // Slightly adjusted for larger cards
    const enemyY = canvasHeight - cardHeight - 40;
    
    const positions = [
      Math.floor(startX),
      Math.floor(startX + cardWidth + spacing),
      Math.floor(startX + (cardWidth + spacing) * 2)
    ];
    
    // Create clean VS text overlay only (no health bars or names)
    const vsCanvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = vsCanvas.getContext('2d');
    
    // VS text centered perfectly (smaller size)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Arial';  // Reduced from 120px to 80px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';  // Ensures perfect vertical centering
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;  // Reduced stroke width proportionally
    ctx.strokeText('VS', canvasWidth / 2, canvasHeight / 2);
    ctx.fillText('VS', canvasWidth / 2, canvasHeight / 2);
    
    const vsBuffer = vsCanvas.toBuffer('image/png');
    
    // Composite all elements
    const compositeArray = [
      // User team (top)
      { input: resizedUserCards[0], left: positions[0], top: userY },
      { input: resizedUserCards[1], left: positions[1], top: userY },
      { input: resizedUserCards[2], left: positions[2], top: userY },
      // Enemy team (bottom)
      { input: resizedEnemyCards[0], left: positions[0], top: enemyY },
      { input: resizedEnemyCards[1], left: positions[1], top: enemyY },
      { input: resizedEnemyCards[2], left: positions[2], top: enemyY },
      // VS text overlay only
      { input: vsBuffer, left: 0, top: 0, blend: 'over' }
    ];
    
    const finalBuffer = await sharp(background)
      .composite(compositeArray)
      .png()
      .toBuffer();
    
    return finalBuffer;
    
  } catch (error) {
    console.error('Error generating battle arena:', error);
    return null;
  }
}

// Process AI turn automatically
async function processAITurn(battleId, interaction) {
  try {
    const battleState = battleSessions.get(battleId);
    if (!battleState || !battleState.isActive) return;
    
    const currentTurn = battleState.turnOrder[0];
    if (currentTurn.isUser) return; // Not AI turn
    
    // Find the current AI card
    const aiCard = battleState.enemyTeam.find(card => card.cardId === currentTurn.cardId);
    if (!aiCard || !aiCard.isAlive) {
      // Skip dead card's turn
      advanceTurn(battleState);
      updateBattleDisplay(battleId, interaction);
      return;
    }
    
    // AI decision making - simple but effective
    const targets = battleState.userTeam.filter(card => card.isAlive);
    if (targets.length === 0) {
      // Player defeated - end battle
      endBattle(battleId, 'enemy', interaction);
      return;
    }
    
    // Choose action: 70% attack, 20% ability, 10% defend
    const actionRoll = Math.random();
    let action, damage = 0, target;
    
    if (actionRoll < 0.7) {
      // Basic attack
      target = targets[Math.floor(Math.random() * targets.length)];
      damage = Math.max(1, Math.floor(aiCard.stats.attack * (0.8 + Math.random() * 0.4) - target.stats.defense * 0.3));
      target.stats.hp = Math.max(0, target.stats.hp - damage);
      action = `${aiCard.name} attacks ${target.name} for ${damage} damage!`;
      
      if (target.stats.hp <= 0) {
        target.isAlive = false;
        action += ` ${target.name} is defeated!`;
        aiCard.killCount++;
      }
    } else if (actionRoll < 0.9 && aiCard.abilities && aiCard.abilities.length > 0) {
      // Use ability
      action = `${aiCard.name} uses ${aiCard.abilities[0]}!`;
      // Simplified ability effect - just extra damage
      target = targets[Math.floor(Math.random() * targets.length)];
      damage = Math.floor(aiCard.stats.attack * 1.3);
      target.stats.hp = Math.max(0, target.stats.hp - damage);
      action += ` ${target.name} takes ${damage} ability damage!`;
      
      if (target.stats.hp <= 0) {
        target.isAlive = false;
        action += ` ${target.name} is defeated!`;
        aiCard.killCount++;
      }
    } else {
      // Defend
      action = `${aiCard.name} defends (+50% defense next turn)`;
    }
    
    battleState.battleLog.push(action);
    
    // Check win condition
    if (battleState.userTeam.every(card => !card.isAlive)) {
      endBattle(battleId, 'enemy', interaction);
      return;
    }
    
    // Advance turn
    advanceTurn(battleState);
    
    // Continue battle
    setTimeout(() => updateBattleDisplay(battleId, interaction), 1500);
    
  } catch (error) {
    console.error('Error processing AI turn:', error);
  }
}

// Advance to next turn
function advanceTurn(battleState) {
  battleState.turn++;
  battleState.turnOrder.shift(); // Remove current turn
  
  // If no turns left, rebuild turn order
  if (battleState.turnOrder.length === 0) {
    battleState.round++;
    const allCards = [...battleState.userTeam, ...battleState.enemyTeam];
    battleState.turnOrder = allCards
      .filter(card => card.isAlive)
      .sort((a, b) => b.stats.speed - a.stats.speed)
      .map(card => ({
        cardId: card.cardId,
        isUser: battleState.userTeam.some(uc => uc.cardId === card.cardId),
        name: card.name,
        speed: card.stats.speed
      }));
  }
}

// Update battle display
async function updateBattleDisplay(battleId, interaction) {
  try {
    const battleState = battleSessions.get(battleId);
    if (!battleState || !battleState.isActive) return;
    
    // Generate updated battle image
    const battleImage = await generateBattleArena(battleState);
    const timestamp = Date.now();
    const attachment = new AttachmentBuilder(battleImage, { name: `battle_${timestamp}.png` });
    
    // Create updated embed
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Battle in Progress')
      .setDescription(`**Round ${battleState.round}** - Turn ${battleState.turn}\n\n${battleState.battleLog.slice(-3).join('\n')}`)
      .setImage(`attachment://battle_${timestamp}.png`)
      .setColor('#ff6b6b');
    
    // Add current turn info if battle continues
    if (battleState.turnOrder.length > 0) {
      embed.addFields({
        name: '⚡ Current Turn',
        value: `**${battleState.turnOrder[0].name}** ${battleState.turnOrder[0].isUser ? '(Your card)' : '(Enemy)'}`,
        inline: false
      });
    }
    
    // Create action buttons for player's turn
    const components = [];
    if (battleState.turnOrder.length > 0 && battleState.turnOrder[0].isUser) {
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_attack_${battleId}`)
          .setLabel('⚔️ Attack')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`battle_ability_${battleId}`)
          .setLabel('⚡ Use Ability')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`battle_defend_${battleId}`)
          .setLabel('🛡️ Defend')
          .setStyle(ButtonStyle.Success)
      );
      components.push(actionRow);
    } else if (battleState.turnOrder.length > 0) {
      // AI turn coming up
      setTimeout(() => processAITurn(battleId, interaction), 2000);
    }
    
    await interaction.editReply({ embeds: [embed], files: [attachment], components });
    
  } catch (error) {
    console.error('Error updating battle display:', error);
  }
}

// End battle
async function endBattle(battleId, winner, interaction) {
  try {
    const battleState = battleSessions.get(battleId);
    if (!battleState) return;
    
    battleState.isActive = false;
    
    const embed = new EmbedBuilder()
      .setTitle(winner === 'user' ? '🎉 Victory!' : '💀 Defeat!')
      .setDescription(winner === 'user' ? 'Congratulations! You won the battle!' : 'Your team was defeated. Better luck next time!')
      .addFields({
        name: '📊 Battle Summary',
        value: battleState.battleLog.slice(-5).join('\n'),
        inline: false
      })
      .setColor(winner === 'user' ? '#00ff00' : '#ff0000');
    
    await interaction.editReply({ embeds: [embed], components: [] });
    
    // Clean up battle session
    battleSessions.delete(battleId);
    
  } catch (error) {
    console.error('Error ending battle:', error);
  }
}

// PvP battle requests storage
const pvpBattleRequests = new Map();

// Register fonts with full paths
try {
  registerFont('./Bubblegum.ttf', { family: 'Bubblegum', weight: 'normal' });
  registerFont('./To Japan.ttf', { family: 'To Japan', weight: 'normal' });
} catch (error) {
  console.log('Font files not found, using system fonts');
}

// Enable uncaught exception logging
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onibot', { 
  serverSelectionTimeoutMS: 5000 
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Enhanced CharacterPrints schema
const characterPrintsSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  highestPrintNumber: { type: Number, default: 0 },
});
const CharacterPrints = mongoose.model('CharacterPrints', characterPrintsSchema);

// Enhanced Card schema with gameplay features
const cardSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true },
  name: String,
  series: String,
  imageUrl: String,
  type: String,
  printNumber: Number,
  version: String,
  versionFormatted: String,
  rarity: {
    tier: String,
    score: Number
  },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  class: { type: String, enum: ['Tank', 'Damage', 'Support', 'Intel'], default: 'Damage' },
  stats: {
    hp: { type: Number, default: 1000 },
    maxHp: { type: Number, default: 1000 },
    attack: { type: Number, default: 600 },
    defense: { type: Number, default: 500 },
    speed: { type: Number, default: 60 }
  },
  abilities: [{ type: String }],
  ownerId: { type: String, required: true },
  equippedItem: { type: String, default: null },
  equippedPet: { type: String, default: null },
  lastTraining: { type: Date, default: null },
  battleStats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    damageDealt: { type: Number, default: 0 },
    damageTaken: { type: Number, default: 0 }
  },
  customizedImageUrl: String,
  dyeSettings: {
    hue: { type: Number, default: 0 },
    saturation: { type: Number, default: 100 },
    highlights: { type: Number, default: 0 }
  },
  appliedAura: { type: String, default: null },
  trashed: { type: Boolean, default: false },
  trashedDate: { type: Date, default: null },
  grade: { type: Number, default: null } // PSA-style grading: 6.0-10.0
});
const Card = mongoose.model('Card', cardSchema);

// Enhanced Player schema with gameplay features
const playerSchema = new mongoose.Schema({
  userId: String,
  username: String,
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  currency: { type: Number, default: 0 },
  lumens: { type: Number, default: 500 },
  novaGems: { type: Number, default: 50 },
  mythicShards: { type: Number, default: 5 },
  unlockedAuras: { type: [String], default: [] },
  lastClaim: { type: Date, default: null },
  lastMission: { type: Date, default: null },
  battleStats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    rank: { type: Number, default: 1000 }
  },
  inventory: {
    items: [{ name: String, quantity: Number }],
    pets: [{ name: String, equipped: Boolean }]
  },
  // Mission system removed
});
const Player = mongoose.model('Player', playerSchema);

// Initialize grading system with models
const gradingSystem = new GradingSystem(Card, Player);

// Battle session schema
const battleSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  players: [{
    userId: String,
    cardId: mongoose.Schema.Types.ObjectId,
    currentHp: Number,
    effects: [{
      type: String,
      duration: Number,
      value: Number
    }]
  }],
  currentTurn: { type: Number, default: 0 },
  turnOrder: [String],
  battleType: { type: String, enum: ['1v1', '5v5'], default: '1v1' },
  status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
  winner: String,
  createdAt: { type: Date, default: Date.now },
  lastAction: { type: Date, default: Date.now }
});
const BattleSession = mongoose.model('BattleSession', battleSessionSchema);

// Corrections for character names and series titles
const corrections = {
  'Dororo': 'Hyakimaru',
  'Robert E. O. Speedwagon': 'Robert E. O. Speedwagon',
  'Satoru Gojo': 'Satoru Gojo',
  'Naruto Uzumaki': 'Naruto Uzumaki',
  'Luffy': 'Monkey D. Luffy',
  'Ichigo Kurosaki': 'Ichigo Kurosaki',
  'Gon Freecss': 'Gon Freecss',
  'Goku': 'Goku',
  'Eren Yeager': 'Eren Yeager',
  'Izuku Midoriya': 'Izuku Midoriya',
  'Tanjiro Kamado': 'Tanjiro Kamado',
  'Edward Elric': 'Edward Elric',
  'Light Yagami': 'Light Yagami',
  'Spike Spiegel': 'Spike Spiegel',
  'Shinji Ikari': 'Shinji Ikari',
  'Yusuke Urameshi': 'Yusuke Urameshi',
  'Natsu Dragneel': 'Natsu Dragneel',
  'Asta': 'Asta',
  'Ken Kaneki': 'Ken Kaneki',
  'Gintoki Sakata': 'Gintoki Sakata',
  'Shoyo Hinata': 'Shoyo Hinata',
  'Yuji Itadori': 'Yuji Itadori',
  'Loid Forger': 'Loid Forger',
  'Senku Ishigami': 'Senku Ishigami',
  'Meliodas': 'Meliodas',
  'Shigeo Kageyama': 'Shigeo Kageyama',
  'Rimuru Tempest': 'Rimuru Tempest',
  'JoJo no Kimyou na Bouken (TV)': "JoJo's Bizarre Adventure",
  'Naruto': 'Naruto',
  'Bleach': 'Bleach',
  'One Piece': 'One Piece',
  'Hunter x Hunter': 'Hunter x Hunter',
  'Dragon Ball': 'Dragon Ball',
  'Shingeki no Kyojin': "Attack on Titan",
  'Boku no Hero Academia': 'My Hero Academia',
  'Kimetsu no Yaiba': 'Demon Slayer: Kimetsu no Yaiba',
  'Fullmetal Alchemist: Brotherhood': 'Fullmetal Alchemist: Brotherhood',
  'Death Note': 'Death Note',
  'Cowboy Bebop': 'Cowboy Bebop',
  'Neon Genesis Evangelion': 'Neon Genesis Evangelion',
  'Yu Yu Hakusho': 'Yu Yu Hakusho',
  'Fairy Tail': 'Fairy Tail',
  'Black Clover': 'Black Clover',
  'Tokyo Ghoul': 'Tokyo Ghoul',
  'Gintama': 'Gintama',
  'Haikyuu!!': 'Haikyuu!!',
  'Jujutsu Kaisen': 'Jujutsu Kaisen',
  'Spy x Family': 'Spy x Family',
  'Dr. Stone': 'Dr. Stone',
  'Nanatsu no Taizai': 'The Seven Deadly Sins',
  'Mob Psycho 100': 'Mob Psycho 100',
  'Tensei shitara Slime Datta Ken': 'That Time I Got Reincarnated as a Slime',
};

// Generate unique 5-character card ID
async function generateUniqueCardId() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const existingIds = (await Card.find()).map(c => c.cardId);
  while (true) {
    let cardId = '';
    for (let i = 0; i < 5; i++) {
      cardId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (!existingIds.includes(cardId)) return cardId;
  }
}

// Fetch anime characters from AniList with different sorting methods for diversity
async function fetchAnimeCharacters(page = 1, perPage = 50, allCharacters = [], retries = 5) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    // Use different sorting methods for more variety
    const sortMethods = ['FAVOURITES_DESC', 'ID_DESC', 'ID'];
    const sortMethod = sortMethods[page % sortMethods.length];
    
    const query = `
      query ($page: Int, $perPage: Int, $sort: [CharacterSort]) {
        Page(page: $page, perPage: $perPage) {
          characters(sort: $sort) {
            name { full }
            image { large }
            media { nodes { title { romaji, english }, type } }
          }
        }
      }
    `;
    const response = await axios.post('https://graphql.anilist.co', {
      query,
      variables: { page, perPage, sort: [sortMethod] },
    }, { signal: controller.signal });
    clearTimeout(timeoutId);

    const characters = response.data.data.Page.characters || [];
    characters.forEach(char => {
      if (char.name.full && char.image.large && char.media.nodes.length > 0) {
        let name = char.name.full;
        let series = char.media.nodes[0].title.romaji || 'Unknown Series';
        if (char.media.nodes[0].title.english) series = char.media.nodes[0].title.english;
        name = corrections[name] || name;
        series = corrections[series] || series;
        
        // Include both anime and manga characters
        const mediaType = char.media.nodes[0].type || 'ANIME';
        const characterType = mediaType.toLowerCase() === 'manga' ? 'manga' : 'anime';
        
        allCharacters.push({ 
          name, 
          series, 
          type: characterType, 
          imageUrl: char.image.large 
        });
      }
    });

    if (characters.length === perPage && page < 200) {
      // Add small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      return fetchAnimeCharacters(page + 1, perPage, allCharacters, retries);
    }
    return allCharacters;
  } catch (error) {
    console.error(`Error fetching anime characters (page ${page}): ${error.message}`);
    if (retries > 0 && error.response?.status === 429) {
      console.log(`Rate limit hit, retrying ${retries} more times...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchAnimeCharacters(page, perPage, allCharacters, retries - 1);
    }
    return allCharacters;
  }
}

// Helper function for HSL to RGB conversion
function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

// Enhanced image loading with fallback system
async function loadImageWithFallback(imageUrl, characterName) {
  try {
    console.log(`Loading image for ${characterName} from: ${imageUrl}`);
    
    // First try: Load image directly
    const image = await loadImage(imageUrl);
    console.log(`Successfully loaded image for ${characterName}`);
    return image;
    
  } catch (error) {
    console.log(`Failed to load image for ${characterName}: ${error.message}`);
    
    // Second try: Load with proper headers
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://myanimelist.net/'
        },
        timeout: 5000
      });
      
      const buffer = Buffer.from(response.data);
      const image = await loadImage(buffer);
      console.log(`Successfully loaded image for ${characterName} with headers`);
      return image;
      
    } catch (headerError) {
      console.log(`Header retry failed for ${characterName}: ${headerError.message}`);
      
      // Third try: Use curated character images as fallback
      const curatedCharacters = require('./curated_character_data.js');
      const curatedChar = curatedCharacters.find(c => c.character_name === characterName);
      
      if (curatedChar && curatedChar.images && curatedChar.images.length > 0) {
        try {
          const fallbackImage = await loadImage(curatedChar.images[0]);
          console.log(`Using curated fallback image for ${characterName}`);
          return fallbackImage;
        } catch (curatedError) {
          console.log(`Curated fallback failed for ${characterName}: ${curatedError.message}`);
        }
      }
      
      // Final fallback: Generate placeholder
      console.log(`Using placeholder for ${characterName}`);
      return generatePlaceholderImage(characterName);
    }
  }
}

// Generate a simple placeholder image
function generatePlaceholderImage(characterName) {
  const canvas = createCanvas(400, 600);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, '#4a90e2');
  gradient.addColorStop(1, '#7b68ee');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 600);
  
  // Add character name
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(characterName || 'Unknown', 200, 300);
  
  return canvas;
}

// Generate card image with consistent sizing, text cleanup, and aura effects
async function generateCardImage(card, useLegacySystem = true) {
  // FORCE LEGACY SYSTEM - Professional system is broken
  // Always use legacy system until professional system is fixed
  if (useLegacySystem === false) {
    try {
      return await ProfessionalImageSystem.generateProfessionalCard(card);
    } catch (error) {
      console.error('Professional system failed, using legacy:', error);
      // Fall back to legacy system
    }
  }
  
  // Working Legacy system (restored as default)
  const width = 400; // Consistent size for all cards
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Clean up text for rendering
  const cleanName = (card.name || 'Unknown')
    .replace(/[★☆※]/g, '') // Remove star symbols
    .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // Remove problematic characters
    .trim();
  
  const cleanSeries = (card.series || 'Unknown')
    .replace(/[★☆※]/g, '')
    .replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
    .trim();

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, width, height);

  // Draw border first
  const borderWidth = 15;
  const characterImage = await loadImageWithFallback(card.imageUrl, card.name);
  if (!characterImage) return null;

  // Force consistent rendering dimensions regardless of source image aspect ratio
  const renderWidth = width * 0.8;  // Always 80% of card width
  const renderHeight = height * 0.8; // Always 80% of card height
  const x = (width - renderWidth) / 2;  // Center horizontally
  const y = (height - renderHeight) / 2; // Center vertically

  // Sample RGB from the original image
  const sampleCanvas = createCanvas(100, 100);
  const sampleCtx = sampleCanvas.getContext('2d');
  sampleCtx.drawImage(characterImage, 0, 0, 100, 100);
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

  // Draw border gradient with vibrant colors
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

  // Draw character image with forced uniform dimensions and clipping
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, renderWidth, renderHeight);
  ctx.clip();
  ctx.drawImage(characterImage, x, y, renderWidth, renderHeight);
  ctx.restore();

  // Apply dye effects if settings are customized
  if (card.dyeSettings && (card.dyeSettings.hue !== 0 || card.dyeSettings.saturation !== 100 || card.dyeSettings.highlights !== 0)) {
    const { hue = 0, saturation = 100, highlights = 0 } = card.dyeSettings;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply color adjustments
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
      let r_ = hueToRgb(p, q, h + 1/3);
      let g_ = hueToRgb(p, q, h);
      let b_ = hueToRgb(p, q, h - 1/3);
      data[i] = Math.min(255, Math.max(0, r_ * 255));
      data[i + 1] = Math.min(255, Math.max(0, g_ * 255));
      data[i + 2] = Math.min(255, Math.max(0, b_ * 255));
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Add text gradient - clipped to card frame boundaries
  const gradientY = height * 0.75;
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

  ctx.textAlign = 'center';
  const textX = x + (renderWidth / 2);
  const fullCanvasGradientHeight = height - gradientY; // Use full canvas height for text positioning like GIF cards
  const baseTextY = gradientY + (fullCanvasGradientHeight * 0.25);

  let displayName = cleanName.length > 16 ? cleanName.substring(0, 13) + '...' : cleanName;
  let displaySeries = cleanSeries.length > 22 ? cleanSeries.substring(0, 19) + '...' : cleanSeries;

  function renderTextWithFallback(text, yPos, size, fillColor) {
    ctx.font = `${size}px "Bubblegum"`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = fillColor;
    let hasSpecialChar = false;
    for (let char of text) if (/[^\x00-\x7F]/.test(char)) { hasSpecialChar = true; break; }
    if (hasSpecialChar) {
      let parts = [], currentPart = '';
      for (let char of text) {
        if (/[^\x00-\x7F]/.test(char)) {
          if (currentPart) parts.push(currentPart);
          parts.push(char);
          currentPart = '';
        } else currentPart += char;
      }
      if (currentPart) parts.push(currentPart);
      let xOffset = textX - (parts.length * (size / 4));
      for (let part of parts) {
        ctx.font = /[^\x00-\x7F]/.test(part) ? `${size}px "To Japan"` : `${size}px "Bubblegum"`;
        ctx.strokeText(part, xOffset, yPos);
        ctx.fillText(part, xOffset, yPos);
        xOffset += ctx.measureText(part).width;
      }
    } else {
      ctx.strokeText(text, textX, yPos);
      ctx.fillText(text, textX, yPos);
    }
  }

  renderTextWithFallback(displayName, baseTextY, 32, '#FFFFFF');
  renderTextWithFallback(displaySeries, baseTextY + 28, 20, seriesColor);

  // Add version and print number to bottom right corner with special colors
  ctx.textAlign = 'right';
  const printText = `#${card.printNumber}`;
  ctx.font = '24px "Bubblegum"';  // Reduced from 40px to 24px
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;  // Reduced stroke width to match smaller text
  
  // Set color based on print number - ALL WHITE as requested (1, 2, 3)
  if (card.printNumber === 1 || card.printNumber === 2 || card.printNumber === 3) {
    // White for #1, #2, and #3 as requested
    ctx.fillStyle = '#FFFFFF';
  } else {
    // White for #4+
    ctx.fillStyle = '#FFFFFF';
  }
  
  ctx.strokeText(printText, x + renderWidth - 15, y + renderHeight - 15);
  ctx.fillText(printText, x + renderWidth - 15, y + renderHeight - 15);
  
  // Rarity tier indicator removed as requested

  let finalBuffer = canvas.toBuffer('image/png');
  
  // Apply aura effect if the card has one
  if (card.appliedAura) {
    try {
      finalBuffer = await auraSystem.applyAura(finalBuffer, card.appliedAura);
    } catch (error) {
      console.error('Error applying aura to card:', error);
      // Return original card if aura fails
    }
  }
  
  return finalBuffer;
}

// Make generateCardImage available globally for visual battle system
global.generateCardImage = generateCardImage;

// Generate composite image with consistent card sizing
async function generateCompositeImage(cards) {
  const cardWidth = 400; // Match generateCardImage width
  const cardHeight = 600; // Match generateCardImage height
  const gap = 30;
  const totalWidth = 3 * cardWidth + 2 * gap;
  const height = cardHeight;
  const canvas = createCanvas(totalWidth, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, totalWidth, height);

  for (let i = 0; i < 3; i++) {
    if (cards[i]) {
      const cardImageBuffer = await generateCardImage(cards[i]);
      const cardImage = await loadImage(cardImageBuffer);
      ctx.drawImage(cardImage, i * (cardWidth + gap), 0, cardWidth, cardHeight);
    }
  }

  return canvas.toBuffer('image/png');
}

// Initialize or get player
async function initializePlayer(userId, username) {
  let player = await Player.findOne({ userId });
  if (!player) {
    player = new Player({ userId, username });
    await player.save();
  }
  return player;
}

// Calculate required XP for next level
function getRequiredXP(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Level up card logic
async function levelUpCard(card) {
  const requiredXP = getRequiredXP(card.level);
  if (card.xp >= requiredXP && card.level < 100) {
    card.xp -= requiredXP;
    card.level++;
    
    // Apply class-based stat increases
    const statGrowth = classSystem.getStatGrowth(card.class);
    card.stats.maxHp += statGrowth.hp;
    card.stats.hp = card.stats.maxHp; // Full heal on level up
    card.stats.attack += statGrowth.attack;
    card.stats.defense += statGrowth.defense;
    card.stats.speed += statGrowth.speed;
    
    // Unlock new abilities at milestone levels
    if (card.level === 10 || card.level === 25 || card.level === 50) {
      const newAbility = abilities.getRandomAbilityForClass(card.class);
      if (!card.abilities.includes(newAbility)) {
        card.abilities.push(newAbility);
      }
    }
    
    await card.save();
    return true;
  }
  return false;
}

// Slash command definitions
const commands = [
  new SlashCommandBuilder()
    .setName('drop')
    .setDescription('Spawns 3 cards to grab'),
    
  new SlashCommandBuilder()
    .setName('gifdrop')
    .setDescription('Spawns 3 animated GIF cards using Sharp processing'),
    
  new SlashCommandBuilder()
    .setName('testsharpbattle')
    .setDescription('Test Sharp battle system (Owner only)'),
  
  new SlashCommandBuilder()
    .setName('collection')
    .setDescription('View your card collection'),
    
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse and purchase card chests'),
    
  new SlashCommandBuilder()
    .setName('trash')
    .setDescription('Send a card to the river for currency')
    .addStringOption(option =>
      option.setName('cardid')
        .setDescription('The ID of the card to trash')
        .setRequired(true)),
        
  new SlashCommandBuilder()
    .setName('fish')
    .setDescription('Go fishing in the river to rescue trashed cards'),
  
  new SlashCommandBuilder()
    .setName('card')
    .setDescription('View details of a specific card')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Card ID to view')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('train')
    .setDescription('Send up to 3 cards on training sessions')
    .addStringOption(option =>
      option.setName('card1')
        .setDescription('First card ID to train')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('card2')
        .setDescription('Second card ID to train')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('card3')
        .setDescription('Third card ID to train')
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('battle')
    .setDescription('Start a 3v3 turn-based battle')
    .addStringOption(option =>
      option.setName('card1')
        .setDescription('Your first card ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('card2')
        .setDescription('Your second card ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('card3')
        .setDescription('Your third card ID')
        .setRequired(true)),
    
  new SlashCommandBuilder()
    .setName('three')
    .setDescription('Test 3D card with popping effect'),
    
  new SlashCommandBuilder()
    .setName('two')
    .setDescription('Display two cards side by side')
    .addStringOption(option =>
      option.setName('card1')
        .setDescription('First card ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('card2')
        .setDescription('Second card ID')
        .setRequired(true)),
        
  new SlashCommandBuilder()
    .setName('battletest')
    .setDescription('Test battle arena: your 3 cards vs 3 random enemies')
    .addStringOption(option =>
      option.setName('card1')
        .setDescription('Your first card ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('card2')
        .setDescription('Your second card ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('card3')
        .setDescription('Your third card ID')
        .setRequired(true)),
  
  // Mission command removed
  
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the battle leaderboard'),
  
  new SlashCommandBuilder()
    .setName('abilities')
    .setDescription('View available abilities')
    .addStringOption(option =>
      option.setName('class')
        .setDescription('Filter by class')
        .setRequired(false)
        .addChoices(
          { name: 'Tank', value: 'Tank' },
          { name: 'Damage', value: 'Damage' },
          { name: 'Support', value: 'Support' },
          { name: 'Intel', value: 'Intel' }
        )),
  
  new SlashCommandBuilder()
    .setName('customize')
    .setDescription('Open the Customization Boutique for a card')
    .addStringOption(option =>
      option.setName('cardid')
        .setDescription('The card ID to customize')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('spawn')
    .setDescription('Spawn a single card for testing'),
  
  new SlashCommandBuilder()
    .setName('spawngif')
    .setDescription('Force spawn the animated GIF card for testing'),
    
  new SlashCommandBuilder()
    .setName('characterstats')
    .setDescription('Show AniList character database statistics'),
  
  new SlashCommandBuilder()
    .setName('expanddb')
    .setDescription('Expand character database to 5000+ characters (Owner only)'),
  
  new SlashCommandBuilder()
    .setName('testemojis')
    .setDescription('Test the enhanced emoji systems (emoji.gg + Freepik)'),
  
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('View your current currency balances'),
  
  new SlashCommandBuilder()
    .setName('lineup')
    .setDescription('Interactive 5-card battle lineup builder with buttons and modals'),
  
  new SlashCommandBuilder()
    .setName('newbattle')
    .setDescription('Start a 5v5 battle against AI with your lineup'),
  
  // MAL Integration Commands
  new SlashCommandBuilder()
    .setName('mdrop')
    .setDescription('MAL TEST: Spawns 3 MyAnimeList cards with versioning'),
    
  new SlashCommandBuilder()
    .setName('mcollection')
    .setDescription('MAL TEST: View your MyAnimeList card collection'),
    
  new SlashCommandBuilder()
    .setName('testmal')
    .setDescription('Test MyAnimeList API connection and character fetching'),
    
  new SlashCommandBuilder()
    .setName('grade')
    .setDescription('Grade your card with PSA-style rating system')
    .addStringOption(option =>
      option.setName('cardid')
        .setDescription('Card ID to grade (e.g. o24sq)')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('regrade')
        .setDescription('Regrade an already graded card (500 Nova Gems)')
        .setRequired(false))
];

// Register commands
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  try {
    await client.application.commands.set(commands);
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

// Handle all interactions (commands, buttons, modals)
client.on('interactionCreate', async interaction => {
  // Handle modal submissions first
  if (interaction.isModalSubmit()) {
    // Handle lineup modal submissions
    if (interaction.customId.startsWith('lineup_add_modal_')) {
      await interaction.deferReply({ ephemeral: true });
      
      const userId = interaction.customId.split('_')[3];
      const cardId = interaction.fields.getTextInputValue('cardId');
      
      try {
        // Verify card exists and belongs to user
        const card = await Card.findOne({ cardId: cardId, ownerId: interaction.user.id });
        if (!card) {
          return interaction.editReply('❌ Card not found in your collection!');
        }
        
        // Add to lineup
        const result = newBattleSystem.addToLineup(userId, cardId);
        if (!result.success) {
          return interaction.editReply(`❌ ${result.message}`);
        }
        
        await interaction.editReply(`✅ **${card.name}** added to your lineup!`);
        saveLineups(); // Save lineup after adding card
        
      } catch (error) {
        console.error('Error adding card to lineup:', error);
        await interaction.editReply('❌ Error adding card to lineup.');
      }
      return;
    }
    
    else if (interaction.customId.startsWith('lineup_remove_modal_')) {
      await interaction.deferReply({ ephemeral: true });
      
      const userId = interaction.customId.split('_')[3];
      const position = parseInt(interaction.fields.getTextInputValue('position'));
      
      try {
        const result = newBattleSystem.removeFromLineup(userId, position);
        if (!result.success) {
          return interaction.editReply(`❌ ${result.message}`);
        }
        
        await interaction.editReply(`✅ Card removed from position ${position}!`);
        saveLineups(); // Save lineup after removing card
        
      } catch (error) {
        console.error('Error removing card from lineup:', error);
        await interaction.editReply('❌ Error removing card from lineup.');
      }
      return;
    }
    // Add other modal handlers here if needed
  }
  
  // Handle button interactions
  if (interaction.isButton()) {
    console.log('Button interaction received:', interaction.customId);
    
    try {
      // Handle lineup builder buttons
      if (interaction.customId.startsWith('lineup_')) {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const userId = parts[2];
        
        console.log('Lineup button pressed:', {
          customId: interaction.customId,
          parts: parts,
          action: action,
          userId: userId,
          actualUserId: interaction.user.id,
          match: userId === interaction.user.id
        });
        
        if (userId !== interaction.user.id) {
          return interaction.reply({ content: '❌ This is not your lineup builder!', ephemeral: true });
        }
        
        if (action === 'add') {
          const modal = new ModalBuilder()
            .setCustomId(`lineup_add_modal_${userId}`)
            .setTitle('Add Card to Lineup');
          
          const cardIdInput = new TextInputBuilder()
            .setCustomId('cardId')
            .setLabel('Card ID')
            .setPlaceholder('Enter the card ID you want to add')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          
          const row = new ActionRowBuilder().addComponents(cardIdInput);
          modal.addComponents(row);
          await interaction.showModal(modal);
          return;
          
        } else if (action === 'remove') {
          const modal = new ModalBuilder()
            .setCustomId(`lineup_remove_modal_${userId}`)
            .setTitle('Remove Card from Lineup');
          
          const positionInput = new TextInputBuilder()
            .setCustomId('position')
            .setLabel('Position (1-5)')
            .setPlaceholder('Enter position number to remove (1, 2, 3, 4, or 5)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          
          const row = new ActionRowBuilder().addComponents(positionInput);
          modal.addComponents(row);
          await interaction.showModal(modal);
          return;
          
        } else if (action === 'clear') {
          await interaction.deferUpdate();
          newBattleSystem.clearLineup(userId);
          saveLineups(); // Save lineup after clearing
          
          const embed = new EmbedBuilder()
            .setTitle('⚔️ Interactive Lineup Builder')
            .setDescription(`Build your 5-card strategic battle team!\n\n**Current Lineup:** 0/5 cards`)
            .addFields([{ name: '📋 Current Lineup', value: '*No cards selected*\n\nUse the buttons below to add cards!', inline: false }])
            .setColor('#4a90e2')
            .setFooter({ text: 'Add cards by ID or remove them from your lineup' });
          
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`lineup_add_${userId}`).setLabel('➕ Add Card').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`lineup_remove_${userId}`).setLabel('➖ Remove Card').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`lineup_clear_${userId}`).setLabel('🗑️ Clear All').setStyle(ButtonStyle.Danger)
          );
          
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`lineup_view_collection_${userId}`).setLabel('👀 View My Cards').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`lineup_battle_${userId}`).setLabel('⚔️ Start Battle!').setStyle(ButtonStyle.Success).setDisabled(true)
          );
          
          await interaction.editReply({ embeds: [embed], components: [row1, row2] });
          return;
          
        } else if (action === 'view') {
          await interaction.deferReply({ ephemeral: true });
          
          const player = await Player.findOne({ userId: interaction.user.id }).populate('cards');
          if (!player || player.cards.length === 0) {
            return interaction.editReply('❌ You have no cards in your collection!');
          }
          
          const cardsPerPage = 10;
          const cards = player.cards.slice(0, cardsPerPage);
          
          let cardList = cards.map(card => 
            `**${card.name}** - \`${card.cardId}\`\n${getClassEmoji(card.class)} ${card.class} • Level ${card.level} • ⚡ ${card.stats.speed} SPD`
          ).join('\n\n');
          
          const embed = new EmbedBuilder()
            .setTitle('👀 Your Card Collection')
            .setDescription(`${cardList}`)
            .setColor('#00ff00')
            .setFooter({ text: 'Copy the card ID and use the Add Card button!' });
          
          await interaction.editReply({ embeds: [embed] });
          return;
          
        } else if (action === 'battle') {
          await interaction.deferUpdate();
          
          // Check if user has a lineup set
          const lineup = newBattleSystem.getLineup(userId);
          if (lineup.length !== 5) {
            return interaction.editReply('❌ You need to set a 5-card lineup first! Use `/lineup` command.');
          }
          
          // Get the actual card objects
          const playerCards = [];
          for (const cardId of lineup) {
            const card = await Card.findOne({ cardId: cardId, ownerId: userId });
            if (!card) {
              return interaction.editReply(`❌ Card ${cardId} not found. Please update your lineup.`);
            }
            playerCards.push(card);
          }
          
          // Start the battle
          const battleState = await newBattleSystem.startBattle(userId, playerCards);
          
          // Create initial battle embed with enhanced team display
          const embed = new EmbedBuilder()
            .setTitle('⚔️ 5v5 Strategic Battle!')
            .setDescription(`**${interaction.user.username}** vs **AI Team**\n\n🎮 *Cards are displayed in battle formation above*\n🔄 *Battle auto-progresses every 3 seconds*`)
            .addFields([
              { 
                name: '⚡ Turn Order (by Speed)', 
                value: battleState.turnOrder.map((card, index) => 
                  `**${index + 1}.** ${card.name} (${card.team === 'player' ? 'You' : 'AI'}) - ${card.stats.speed} SPD`
                ).join(' • '), 
                inline: false 
              }
            ])
            .setColor('#ff6b35')
            .setFooter({ text: 'Enhanced visual battle system - Turn limit: 50 turns' });
          
          // Use Sharp battle system for professional battle visuals
          const SharpBattleSystem = require('./sharp_battle_system');
          const sharpBattle = new SharpBattleSystem();
          const attachment = new AttachmentBuilder(await sharpBattle.generateBattleImage(battleState), { name: 'battle.png' });
          
          const battleMessage = await interaction.editReply({ 
            embeds: [embed], 
            files: [attachment],
            components: [] // Remove lineup buttons during battle
          });
          
          // Auto-progress battle every 3 seconds
          const battleInterval = setInterval(async () => {
            try {
              // Add turn limit to prevent infinite battles
              if (battleState.turn > 50) {
                clearInterval(battleInterval);
                battleState.phase = 'ended';
                battleState.winner = 'draw';
                console.log('Battle ended due to turn limit (50 turns)');
              }
              
              const result = await newBattleSystem.processTurn(battleState);
              
              if (battleState.phase === 'ended') {
                clearInterval(battleInterval);
                
                // Create final battle result
                const winnerText = battleState.winner === 'player' ? 
                  `🎉 **${interaction.user.username} WINS!**` : 
                  battleState.winner === 'draw' ?
                  '⏱️ **DRAW! Battle time limit reached**' :
                  '💀 **AI Team Wins!**';
                
                const finalEmbed = new EmbedBuilder()
                  .setTitle('⚔️ Battle Complete!')
                  .setDescription(`${winnerText}\n\n**Battle Summary:**\n${battleState.battleLog.slice(-5).map(log => log.message).join('\n')}`)
                  .setColor(battleState.winner === 'player' ? '#00ff00' : battleState.winner === 'draw' ? '#ffff00' : '#ff0000')
                  .setFooter({ text: `Battle lasted ${battleState.turn} turns` });
                
                await interaction.editReply({ 
                  embeds: [finalEmbed]
                });
                return;
              }
              
              // Update battle display - embed only
              const progressEmbed = new EmbedBuilder()
                .setTitle(`⚔️ Battle Turn ${battleState.turn}`)
                .setDescription(`**${battleState.battleLog.slice(-1)[0]?.message || 'Battle in progress...'}**\n\n` +
                  `**YOUR TEAM:**\n${battleState.playerTeam.map((card, i) => {
                    const hpPercent = Math.floor((card.stats.hp / card.stats.maxHp) * 100);
                    const healthBar = card.isAlive ? 
                      `🟩`.repeat(Math.floor(hpPercent / 20)) + `⬜`.repeat(5 - Math.floor(hpPercent / 20)) :
                      `💀💀💀💀💀`;
                    return `**${i + 1}. ${card.name}** - ${card.class}\n${healthBar} ${card.stats.hp}/${card.stats.maxHp} HP`;
                  }).join('\n\n')}\n\n` +
                  `**🔥 VS 🔥**\n\n` +
                  `**AI TEAM:**\n${battleState.aiTeam.map((card, i) => {
                    const hpPercent = Math.floor((card.stats.hp / card.stats.maxHp) * 100);
                    const healthBar = card.isAlive ? 
                      `🟩`.repeat(Math.floor(hpPercent / 20)) + `⬜`.repeat(5 - Math.floor(hpPercent / 20)) :
                      `💀💀💀💀💀`;
                    return `**${i + 1}. ${card.name}** - ${card.class}\n${healthBar} ${card.stats.hp}/${card.stats.maxHp} HP`;
                  }).join('\n\n')}`)
                .setColor('#ff6b35')
                .setFooter({ text: `Turn ${battleState.turn} • Clean embed battle display` });
              
              await interaction.editReply({ 
                embeds: [progressEmbed]
              });
              
            } catch (error) {
              console.error('Battle progression error:', error);
              clearInterval(battleInterval);
              await interaction.editReply('❌ Battle encountered an error and was stopped.');
            }
          }, 3000);
          
          return;
        }
      }
      
      // Handle grab buttons (drop command)
      else if (interaction.customId.startsWith('grab_')) {
        const parts = interaction.customId.split('|');
        const grabAndUserId = parts[0]; // "grab_1234"
        const cardIndex = parts[1];
        const cacheKey = parts[2];
        
        const userId = grabAndUserId.split('_')[1];
        
        if (grabAndUserId.startsWith('grab_') && userId === interaction.user.id.slice(-4)) {
          if (!cardIndex || !cacheKey) {
            await interaction.reply({ content: 'Invalid button. Try /drop again.', ephemeral: true });
            return;
          }
          
          try {
            console.log('Grab button pressed:', interaction.customId);
            console.log('Looking for cache key:', cacheKey);
            console.log('Cache has keys:', Array.from(dropCardCache.keys()));
            
            // Get card data from cache
            const cardData = dropCardCache.get(cacheKey);
            if (!cardData) {
              await interaction.reply({ content: 'Drop session expired. Try /drop again.', ephemeral: true });
              return;
            }
            
            const index = parseInt(cardIndex) - 1;
            
            if (index < 0 || index >= cardData.length) {
              await interaction.reply({ content: 'Invalid card selection. Try /drop again.', ephemeral: true });
              return;
            }
            
            const selectedCard = cardData[index];
            
            let player = await Player.findOne({ userId: interaction.user.id });
            if (!player) {
              player = new Player({
                userId: interaction.user.id,
                username: interaction.user.username,
                cards: []
              });
            }
            
            // Get or create character print record
            let characterPrint = await CharacterPrints.findOne({ name: selectedCard.name });
            if (!characterPrint) {
              characterPrint = new CharacterPrints({
                name: selectedCard.name,
                series: selectedCard.series || 'Unknown',
                currentPrint: 1
              });
              await characterPrint.save();
            }
            
            console.log('Creating new card with data:', {
              cardId: selectedCard.cardId,
              name: selectedCard.name,
              series: selectedCard.series,
              imageUrl: selectedCard.imageUrl,
              ownerId: interaction.user.id
            });
            
            // Create new card
            const newCard = new Card({
              cardId: selectedCard.cardId,
              name: selectedCard.name,
              series: selectedCard.series,
              imageUrl: selectedCard.imageUrl,
              type: selectedCard.type,
              printNumber: selectedCard.printNumber,
              version: selectedCard.version,
              versionFormatted: selectedCard.versionFormatted,
              rarity: selectedCard.rarity,
              class: selectedCard.class,
              level: selectedCard.level,
              xp: selectedCard.xp,
              stats: selectedCard.stats,
              abilities: selectedCard.abilities,
              ownerId: interaction.user.id
            });
            
            console.log('Saving new card to database...');
            await newCard.save();
            console.log('Card saved successfully with _id:', newCard._id);
            
            // Add to player's collection
            console.log('Adding card to player collection...');
            player.cards.push(newCard._id);
            await player.save();
            console.log('Player collection updated successfully');
            
            // Remove from cache and disable all buttons in the original message
            dropCardCache.delete(cacheKey);
            
            // Remove the drop message completely after collection
            try {
              const originalMessage = await interaction.message.fetch();
              if (originalMessage) {
                await originalMessage.delete();
              }
            } catch (err) {
              console.log('Could not delete original message:', err.message);
            }
            
            await interaction.reply({ 
              content: `✅ ${interaction.user.username} grabbed **${selectedCard.name}** (${selectedCard.versionFormatted})!\nCard ID: \`${selectedCard.cardId}\`\nAdded to your collection.`, 
              ephemeral: false 
            });
            
          } catch (error) {
            console.error('Error handling grab button:', error);
            await interaction.reply({ content: '❌ Error grabbing card. Please try again.', ephemeral: true });
          }
        }
        return;
      }
      
      // Handle MAL grab buttons
      else if (interaction.customId.startsWith('mal_grab_')) {
        try {
          debug().info('BUTTON', 'MAL grab button pressed', {
            customId: interaction.customId,
            user: interaction.user.tag
          });
          
          const cardId = interaction.customId.replace('mal_grab_', '');
          
          // Find the drop session
          let dropSession = null;
          let sessionKey = null;
          
          for (const [key, session] of dropCardCache.entries()) {
            if (key.startsWith('mal_drop_') && session.userId === interaction.user.id) {
              const foundCard = session.cards.find(card => card.cardId === cardId);
              if (foundCard) {
                dropSession = session;
                sessionKey = key;
                break;
              }
            }
          }
          
          if (!dropSession) {
            debug().warning('BUTTON', 'MAL drop session not found', { cardId });
            return interaction.reply({ 
              content: '❌ Drop session expired or card not found. Try `/mdrop` again.', 
              ephemeral: true 
            });
          }
          
          const selectedCard = dropSession.cards.find(card => card.cardId === cardId);
          if (!selectedCard) {
            return interaction.reply({ 
              content: '❌ Card not found in session.', 
              ephemeral: true 
            });
          }
          
          // Get or create player
          let player = await Player.findOne({ userId: interaction.user.id });
          if (!player) {
            player = new Player({
              userId: interaction.user.id,
              username: interaction.user.username,
              cards: []
            });
          }
          
          // Assign class using existing class system
          const assignedClass = classSystem.assignClass(selectedCard.character.name, selectedCard.character.anime?.[0] || 'Unknown');
          const baseStats = classSystem.getBaseStats(assignedClass);
          
          // Create new MAL card document
          const newCard = new Card({
            cardId: selectedCard.cardId,
            name: selectedCard.character.name,
            series: selectedCard.character.anime?.[0] || 'MyAnimeList',
            imageUrl: selectedCard.character.selectedImageUrl,
            type: 'MAL Character',
            printNumber: selectedCard.printNumber,
            version: selectedCard.character.version,
            versionFormatted: selectedCard.character.version.toUpperCase(),
            rarity: selectedCard.character.version === 'v1' ? 'Legendary' : 
                   selectedCard.character.version === 'v2' ? 'Epic' : 'Rare',
            class: assignedClass,
            level: 1,
            xp: 0,
            stats: baseStats,
            abilities: [abilities.getRandomAbilityForClass(assignedClass)],
            ownerId: interaction.user.id,
            malData: {
              malId: selectedCard.character.id,
              originalName: selectedCard.character.originalName,
              favorites: selectedCard.character.favorites,
              imageIndex: selectedCard.character.imageIndex,
              totalImages: selectedCard.character.alternativeImages?.length || 1
            }
          });
          
          // Save card to database
          await newCard.save();
          debug().malCharacterLog('COLLECTED', selectedCard.character.name, {
            cardId: selectedCard.cardId,
            printNumber: selectedCard.printNumber,
            version: selectedCard.character.version,
            user: interaction.user.tag
          });
          
          // Add to player's collection
          player.cards.push(newCard._id);
          await player.save();
          
          // Clean up drop session
          dropCardCache.delete(sessionKey);
          
          // Delete original drop message
          try {
            await interaction.message.delete();
          } catch (err) {
            debug().warning('BUTTON', 'Could not delete drop message', { error: err.message });
          }
          
          // Reply with success
          await interaction.reply({
            content: `✅ ${interaction.user.username} grabbed **${selectedCard.character.name}** #${selectedCard.printNumber}!\n` +
                    `${selectedCard.character.version.toUpperCase()} • Card ID: \`${selectedCard.cardId}\`\n` +
                    `Added to your collection with ${selectedCard.character.alternativeImages?.length || 1} image variants!`,
            ephemeral: false
          });
          
        } catch (error) {
          debug().error('BUTTON', 'MAL grab failed', { 
            error: error.message,
            customId: interaction.customId 
          });
          await interaction.reply({ 
            content: '❌ Error grabbing MAL card. Please try again.', 
            ephemeral: true 
          });
        }
        return;
      }
      
      // Handle collection pagination buttons
      else if (interaction.customId.startsWith('collection_')) {
        await interaction.deferUpdate();
        
        const targetPage = parseInt(interaction.customId.split('_')[1]);
        const cards = await Card.find({ ownerId: interaction.user.id }).sort({ level: -1, cardId: 1 });
        
        if (cards.length === 0) {
          return interaction.editReply('❌ You have no cards in your collection.');
        }

        const cardsPerPage = 12;
        const totalPages = Math.ceil(cards.length / cardsPerPage);
        const currentPage = Math.max(1, Math.min(targetPage, totalPages));
        
        const startIndex = (currentPage - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const pageCards = cards.slice(startIndex, endIndex);
        
        const player = await Player.findOne({ userId: interaction.user.id });
        const currencyDisplay = `💰 ${player.currency} coins | ${getCurrencyEmoji('lumen')} ${player.lumens} Lumens | ${getCurrencyEmoji('nova')} ${player.novaGems} Nova Gems | ${getCurrencyEmoji('mystic')} ${player.mythicShards} Mythic Shards`;
        
        const embed = new EmbedBuilder()
          .setTitle(`🎴 ${interaction.user.username}'s Collection`)
          .setDescription(`${currencyDisplay}\n\n${cards.length} Total Cards | Page ${currentPage}/${totalPages}`)
          .addFields([
            {
              name: `📋 Cards ${startIndex + 1}-${Math.min(endIndex, cards.length)}`,
              value: '```' + pageCards.map((card, index) => {
                const globalIndex = startIndex + index + 1;
                const printDisplay = `#${card.printNumber}`;
                const gradeDisplay = card.grade ? ` [${card.grade}]` : '';
                return `${globalIndex.toString().padStart(2, ' ')}. ${card.cardId} | ${card.name}${gradeDisplay} | ${printDisplay} | Lv.${card.level}`;
              }).join('\n') + '```',
              inline: false
            }
          ])
          .setColor('#4a90e2')
          .setFooter({ text: `Use /card <id> for detailed stats` });

        const prevButton = new ButtonBuilder()
          .setCustomId(`collection_${currentPage - 1}`)
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1);

        const nextButton = new ButtonBuilder()
          .setCustomId(`collection_${currentPage + 1}`)
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages);

        const row = new ActionRowBuilder().addComponents(prevButton, nextButton);
        
        await interaction.editReply({ embeds: [embed], components: [row] });
        return;
      }
      
      // Handle other button types...
      
    } catch (error) {
      console.error('Error handling button interaction:', error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
      }
    }
    return;
  }

  // Handle slash commands
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  
  try {
    const player = await initializePlayer(interaction.user.id, interaction.user.username);
    
    if (commandName === 'drop') {
      await interaction.deferReply();
      
      let selectedCards = [];
      let cardIds = [];
      
      try {
        // Get 3 random characters from Mudae's fast character pool
        const selectedCharacters = await aniListCharacterSystem.getRandomCharacters(3);
        
        if (selectedCharacters.length === 0) {
          return interaction.editReply('❌ No characters available at the moment. Please try again later.');
        }
        
        // Create cards from selected characters with versioning
        for (let i = 0; i < selectedCharacters.length; i++) {
          const character = selectedCharacters[i];
          const cardId = await generateUniqueCardId();
          
          // Get version and print number from versioning system
          const versionInfo = simpleVersioning.getNextVersion(character.name, character.series);
          
          if (!versionInfo) {
            console.log(`Character ${character.name} has reached maximum prints`);
            continue; // Skip this character if maxed out
          }
          
          // Assign class based on character
          const assignedClass = classSystem.assignClass(character.name, character.series);
          const baseStats = classSystem.getBaseStats(assignedClass);
          
          const card = {
            cardId,
            name: character.name,
            series: character.series,
            imageUrl: character.image, // Fixed: use 'image' not 'imageUrl'
            type: character.type,
            printNumber: versionInfo.print,
            version: versionInfo.version,
            versionFormatted: versionInfo.formatted,
            rarity: versionInfo.rarity,
            class: assignedClass,
            level: 1,
            xp: 0,
            stats: baseStats,
            abilities: [abilities.getRandomAbilityForClass(assignedClass)],
            // Store original character data for grab buttons
            originalCharacter: character
          };
          
          selectedCards.push(card);
          cardIds.push(cardId);
        }
        
        // Check if any cards are GIFs
        const hasGifs = selectedCards.some(card => card.imageUrl && card.imageUrl.endsWith('.gif'));
        
        if (hasGifs) {
          // For GIFs, preserve animation with individual attachments
          const attachments = [];
          let content = '**🎴 3 cards have appeared! Click a button to grab one.**\n\n';
          
          for (let i = 0; i < selectedCards.length; i++) {
            const card = selectedCards[i];
            const rarityEmoji = card.rarity.tier === 'Pristine' ? '💎' : 
                              card.rarity.tier === 'Legendary' ? '🏆' : 
                              card.rarity.tier === 'Epic' ? '⭐' : '🎯';
            
            content += `**${i + 1}. ${card.name}** ${rarityEmoji} (${card.series}) - #${card.printNumber}\n`;
            
            if (card.imageUrl && card.imageUrl.endsWith('.gif')) {
              // Direct GIF attachment
              attachments.push(new AttachmentBuilder(card.imageUrl, { name: `card_${i + 1}.gif` }));
            } else {
              // Generate static card image
              const cardImage = await generateCardImage(card);
              if (cardImage) {
                attachments.push(new AttachmentBuilder(cardImage, { name: `card_${i + 1}.png` }));
              }
            }
          }
          
          // Store cards in cache and create grab buttons
          const dropId = `${interaction.user.id}_${Date.now()}`;
          dropCardCache.set(dropId, selectedCards);
          
          // Clean up cache after 5 minutes
          setTimeout(() => {
            dropCardCache.delete(dropId);
          }, 5 * 60 * 1000);
          
          const buttons = [];
          for (let i = 0; i < 3; i++) {
            buttons.push(
              new ButtonBuilder()
                .setCustomId(`grab_${interaction.user.id.slice(-4)}|${i + 1}|${dropId}`)
                .setLabel(`${i + 1}`)
                .setStyle(ButtonStyle.Primary)
            );
          }
          
          const row = new ActionRowBuilder().addComponents(buttons);
          
          await interaction.editReply({ 
            content: content,
            files: attachments,
            components: [row] 
          });
        } else {
          // Generate beautiful composite image for static cards
          const compositeImage = await generateCompositeImage(selectedCards);
          if (compositeImage) {
            const attachment = new AttachmentBuilder(compositeImage, { name: 'cards.png' });
            
            // Store cards in cache and create grab buttons
            const dropId = `${interaction.user.id}_${Date.now()}`;
            dropCardCache.set(dropId, selectedCards);
            
            // Clean up cache after 5 minutes
            setTimeout(() => {
              dropCardCache.delete(dropId);
            }, 5 * 60 * 1000);
            
            const buttons = [];
            for (let i = 0; i < 3; i++) {
              buttons.push(
                new ButtonBuilder()
                  .setCustomId(`grab_${interaction.user.id.slice(-4)}|${i + 1}|${dropId}`)
                  .setLabel(`${i + 1}`)
                  .setStyle(ButtonStyle.Primary)
              );
            }
            
            const row = new ActionRowBuilder().addComponents(buttons);
            
            await interaction.editReply({ 
              content: '**🎴 3 cards have appeared! Click a button to grab one.**',
              files: [attachment],
              components: [row] 
            });
          } else {
            // Fallback to text display if image generation fails
            let content = '**🎴 3 cards have appeared! Click a button to grab one.**\n\n';
            
            for (let i = 0; i < selectedCards.length; i++) {
              const card = selectedCards[i];
              const rarityEmoji = card.rarity.tier === 'Pristine' ? '💎' : 
                                card.rarity.tier === 'Legendary' ? '🏆' : 
                                card.rarity.tier === 'Epic' ? '⭐' : '🎯';
              
              content += `**${i + 1}. ${card.name}** ${rarityEmoji}\n`;
              content += `   📺 ${card.series}\n`;
              content += `   📊 ${card.class} • Level ${card.level}\n`;
              content += `   🎲 Print #${card.printNumber}\n\n`;
            }
            
            // Store cards in cache and create grab buttons
            const dropId = `${interaction.user.id}_${Date.now()}`;
            dropCardCache.set(dropId, selectedCards);
            
            // Clean up cache after 5 minutes
            setTimeout(() => {
              dropCardCache.delete(dropId);
            }, 5 * 60 * 1000);
            
            const buttons = [];
            for (let i = 0; i < 3; i++) {
              buttons.push(
                new ButtonBuilder()
                  .setCustomId(`grab_${interaction.user.id.slice(-4)}|${i + 1}|${dropId}`)
                  .setLabel(`${i + 1}`)
                  .setStyle(ButtonStyle.Primary)
              );
            }
            
            const row = new ActionRowBuilder().addComponents(buttons);
            
            await interaction.editReply({ 
              content: content,
              components: [row] 
            });
          }
        }
      } catch (error) {
        console.error('Error in drop command:', error);
        return interaction.editReply('❌ Error generating cards. Please try again.');
      }
    }
    

    
    else if (commandName === 'three') {
      await interaction.deferReply();
      
      try {
        // Build 3D card from scratch - no dependencies on broken systems
        const { createCanvas, loadImage } = require('canvas');
        const canvas = createCanvas(500, 750);
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, 500, 750);
        
        // Draw card frame first (your normal card style)
        const cardX = 50;
        const cardY = 75;
        const cardWidth = 400;
        const cardHeight = 600;
        
        // Card background gradient
        const gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = gradient;
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        
        // Card border
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 4;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        
        // Add text to card first (before character)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MAKIMA', cardX + cardWidth/2, cardY + cardHeight - 80);
        
        ctx.font = '18px Arial';
        ctx.fillText('Chainsaw Man', cardX + cardWidth/2, cardY + cardHeight - 55);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#f39c12';
        ctx.fillText('INTEL • Level 10', cardX + cardWidth/2, cardY + cardHeight - 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('#1', cardX + cardWidth - 30, cardY + 25);
        
        // Now load and position Makima render to pop out
        const makimaRender = await loadImage('./attached_assets/makima_render_by_aeiouact4_df9byu6-fullview_1753222192036.png');
        
        // Add drop shadow for 3D effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;
        
        // Draw Makima larger and positioned to extend beyond card frame
        ctx.drawImage(makimaRender, 25, 50, 450, 650);
        
        const finalBuffer = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(finalBuffer, { name: '3d_card.png' });
        
        const embed = new EmbedBuilder()
          .setTitle('🎯 3D Card Test')
          .setDescription('Testing Makima with popping 3D effect')
          .setImage('attachment://3d_card.png')
          .setColor('#f39c12');
        
        await interaction.editReply({ embeds: [embed], files: [attachment] });
        
      } catch (error) {
        console.error('Error in three command:', error);
        await interaction.editReply('❌ 3D card error');
      }
    }
    
    else if (commandName === 'two') {
      await interaction.deferReply();
      
      try {
        const card1Id = interaction.options.getString('card1');
        const card2Id = interaction.options.getString('card2');
        
        // Find both cards in database
        const card1 = await Card.findOne({ cardId: card1Id });
        const card2 = await Card.findOne({ cardId: card2Id });
        
        if (!card1) {
          return interaction.editReply(`❌ Card with ID ${card1Id} not found`);
        }
        if (!card2) {
          return interaction.editReply(`❌ Card with ID ${card2Id} not found`);
        }
        
        // Generate both card images using working legacy system
        const card1Buffer = await generateCardImage(card1, true);
        const card2Buffer = await generateCardImage(card2, true);
        
        if (!card1Buffer || !card2Buffer) {
          return interaction.editReply('❌ Failed to generate card images');
        }
        
        // Use Sharp for reliable image manipulation
        const sharp = require('sharp');
        
        // Create larger cards for better visibility
        const cardWidth = 400;
        const cardHeight = 600;
        const spacing = 150;
        
        const resizedCard1 = await sharp(card1Buffer)
          .resize(cardWidth, cardHeight, { fit: 'cover' })
          .png()
          .toBuffer();
          
        const resizedCard2 = await sharp(card2Buffer)
          .resize(cardWidth, cardHeight, { fit: 'cover' })
          .png()
          .toBuffer();
        
        // Create very large canvas so cards appear smaller when Discord scales
        const canvasWidth = 1600;
        const canvasHeight = 1200;
        
        // Position one card in corner, one in center - let's get jiggy with it
        const card1X = 50; // Top-left corner
        const card1Y = 50;
        const card2X = Math.floor((canvasWidth - cardWidth) / 2); // Dead center
        const card2Y = Math.floor((canvasHeight - cardHeight) / 2);
        
        // Use Discord's exact embed background color to create "invisible" background effect like Sofi
        const background = await sharp({
          create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 3,
            background: { r: 47, g: 49, b: 54 }  // Discord's #2f3136 embed background
          }
        }).png().toBuffer();
        
        console.log(`Positioning: Card1(${card1X},${card1Y}) Card2(${card2X},${card2Y})`);
        
        // Composite cards onto background
        const finalBuffer = await sharp(background)
          .composite([
            { input: resizedCard1, left: card1X, top: card1Y },
            { input: resizedCard2, left: card2X, top: card2Y }
          ])
          .png()
          .toBuffer();
        
        const timestamp = Date.now();
        const attachment = new AttachmentBuilder(finalBuffer, { name: `two_cards_${timestamp}.png` });
        
        const embed = new EmbedBuilder()
          .setTitle('🎴 Card Comparison')
          .setDescription(`**${card1.name}** vs **${card2.name}**`)
          .addFields(
            { 
              name: `${card1.name}`, 
              value: `${card1.series}\nLevel ${card1.level} ${card1.class}`, 
              inline: true 
            },
            { 
              name: `${card2.name}`, 
              value: `${card2.series}\nLevel ${card2.level} ${card2.class}`, 
              inline: true 
            }
          )
          .setImage(`attachment://two_cards_${timestamp}.png`)
          .setColor('#4a90e2');
        
        await interaction.editReply({ embeds: [embed], files: [attachment] });
        
      } catch (error) {
        console.error('Error in two command:', error);
        await interaction.editReply('❌ Error displaying cards');
      }
    }
    
    else if (commandName === 'battle') {
      await interaction.deferReply();
      
      try {
        console.log('Starting battle command...');
        const card1Id = interaction.options.getString('card1');
        const card2Id = interaction.options.getString('card2');
        const card3Id = interaction.options.getString('card3');
        console.log(`Battle cards requested: ${card1Id}, ${card2Id}, ${card3Id}`);
        
        // Find user's 3 cards
        const userCard1 = await Card.findOne({ cardId: card1Id, ownerId: interaction.user.id });
        const userCard2 = await Card.findOne({ cardId: card2Id, ownerId: interaction.user.id });
        const userCard3 = await Card.findOne({ cardId: card3Id, ownerId: interaction.user.id });
        
        console.log(`Found cards: ${userCard1?.name}, ${userCard2?.name}, ${userCard3?.name}`);
        
        if (!userCard1 || !userCard2 || !userCard3) {
          return interaction.editReply('❌ One or more cards not found or not owned by you');
        }
        
        // Get class system for proper stats
        const classSystem = require('./classSystem');
        
        // Add proper stats to user cards based on their classes
        const userTeam = [
          {
            ...userCard1.toObject(),
            stats: userCard1.stats || classSystem.getBaseStats(userCard1.class),
            isAlive: true,
            abilityOn3TurnCooldown: false
          },
          {
            ...userCard2.toObject(),
            stats: userCard2.stats || classSystem.getBaseStats(userCard2.class),
            isAlive: true,
            abilityOn3TurnCooldown: false
          },
          {
            ...userCard3.toObject(),
            stats: userCard3.stats || classSystem.getBaseStats(userCard3.class),
            isAlive: true,
            abilityOn3TurnCooldown: false
          }
        ];
        
        // Check if cards are healthy enough to battle using proper stats
        if (userTeam[0].stats.hp <= 0 || userTeam[1].stats.hp <= 0 || userTeam[2].stats.hp <= 0) {
          return interaction.editReply('❌ All cards must have HP > 0 to battle. Use healing items or wait for recovery.');
        }
        
        // Create battle ID and initialize battle state
        const battleId = `battle_${interaction.user.id}_${Date.now()}`;
        const battleState = {
          battleId,
          userId: interaction.user.id,
          userTeam: userTeam,
          enemyTeam: [],
          turn: 1,
          currentPlayer: 'user',
          turnOrder: [],
          battleLog: [],
          isActive: true,
          round: 1
        };
        
        // Generate enemy team with similar power level
        const avgUserLevel = Math.floor((userCard1.level + userCard2.level + userCard3.level) / 3);
        const characters = aniListCharacterSystem.characterCache.filter(char => char.image && char.image !== 'undefined');
        
        for (let i = 0; i < 3; i++) {
          const randomChar = characters[Math.floor(Math.random() * characters.length)];
          const enemyClass = ['Tank', 'Damage', 'Support', 'Intel'][Math.floor(Math.random() * 4)];
          const enemyLevel = Math.max(1, avgUserLevel + Math.floor(Math.random() * 6) - 3); // ±3 levels
          const baseStats = classSystem.getBaseStats(enemyClass);
          
          // Scale stats by level with BALANCED scaling (reduced HP)
          const scaledStats = {
            hp: Math.floor(baseStats.hp * (1 + (enemyLevel - 1) * 0.06) * 0.8), // Reduced HP scaling
            maxHp: Math.floor(baseStats.hp * (1 + (enemyLevel - 1) * 0.06) * 0.8),
            attack: Math.floor(baseStats.attack * (1 + (enemyLevel - 1) * 0.06)),
            defense: Math.floor(baseStats.defense * (1 + (enemyLevel - 1) * 0.06)),
            speed: Math.floor(baseStats.speed * (1 + (enemyLevel - 1) * 0.04))
          };
          
          const enemyCard = {
            cardId: `enemy_${i + 1}`,
            name: randomChar.name,
            series: randomChar.anime || 'Unknown',
            imageUrl: randomChar.image,
            level: enemyLevel,
            class: enemyClass,
            stats: scaledStats,
            abilities: [abilities.getRandomAbilityForClass(enemyClass)],
            isAlive: true,
            abilityCooldowns: {},
            killCount: 0
          };
          
          battleState.enemyTeam.push(enemyCard);
        }
        
        // Initialize user team battle stats
        battleState.userTeam.forEach(card => {
          card.isAlive = card.stats.hp > 0;
          card.abilityCooldowns = {};
          card.killCount = 0;
        });
        
        // Create turn order based on speed (fastest goes first)
        const allCards = [...battleState.userTeam, ...battleState.enemyTeam];
        battleState.turnOrder = allCards
          .filter(card => card.isAlive)
          .sort((a, b) => b.stats.speed - a.stats.speed)
          .map(card => ({
            cardId: card.cardId,
            isUser: battleState.userTeam.some(uc => uc.cardId === card.cardId),
            name: card.name,
            speed: card.stats.speed
          }));
        
        // Store battle session
        battleSessions.set(battleId, battleState);
        
        // Get advanced health visualizer for the health display
        const AdvancedHealthVisualizer = require('./advanced_health_visualizer');
        
        // Generate battle arena image
        const battleImage = await generateBattleArena(battleState);
        const timestamp = Date.now();
        const attachment = new AttachmentBuilder(battleImage, { name: `battle_${timestamp}.png` });
        
        // Create sophisticated health display embed with black background styling
        const embed = AdvancedHealthVisualizer.createHealthDisplay(battleState.userTeam, battleState.enemyTeam, battleState);
        
        // Set battle arena image using attachment reference
        embed.setImage(`attachment://battle_${timestamp}.png`);
        
        // Send battle message with attachment and store image URL for preservation
        const battleMessage = await interaction.editReply({ 
          embeds: [embed],
          files: [attachment]
        });
        
        // Store the Discord CDN URL after message is sent
        setTimeout(async () => {
          try {
            const freshMessage = await battleMessage.fetch();
            const freshEmbed = freshMessage.embeds[0];
            if (freshEmbed && freshEmbed.image && freshEmbed.image.url) {
              battleState.originalImageUrl = freshEmbed.image.url;
              console.log('🖼️ Stored Discord CDN URL as backup:', battleState.originalImageUrl);
            } else {
              console.log('❌ Failed to get Discord CDN URL from fresh message');
            }
          } catch (error) {
            console.error('Error fetching fresh message for CDN URL:', error);
          }
        }, 2000); // Give Discord time to process and generate CDN URL
        
        // Start automated AI battle system
        const AiAutomaticBattleSystem = require('./ai_automatic_battle_system');
        const aiBattleSystem = new AiAutomaticBattleSystem();
        await aiBattleSystem.startAutomatedBattle(battleState, battleMessage);
        
      } catch (error) {
        console.error('Error in battle command:', error);
        await interaction.editReply('❌ Battle failed to start');
      }
    }
    
    else if (commandName === 'battletest') {
      await interaction.deferReply();
      
      try {
        const card1Id = interaction.options.getString('card1');
        const card2Id = interaction.options.getString('card2');
        const card3Id = interaction.options.getString('card3');
        
        // Find user's 3 cards
        const userCard1 = await Card.findOne({ cardId: card1Id });
        const userCard2 = await Card.findOne({ cardId: card2Id });
        const userCard3 = await Card.findOne({ cardId: card3Id });
        
        if (!userCard1 || !userCard2 || !userCard3) {
          return interaction.editReply('❌ One or more cards not found');
        }
        
        // Get 3 random characters with valid images from loaded cache
        const characters = aniListCharacterSystem.characterCache.filter(char => char.image && char.image !== 'undefined');
        if (characters.length < 3) {
          return interaction.editReply('❌ Not enough valid characters loaded');
        }
        
        const enemyChar1 = characters[Math.floor(Math.random() * characters.length)];
        const enemyChar2 = characters[Math.floor(Math.random() * characters.length)];
        const enemyChar3 = characters[Math.floor(Math.random() * characters.length)];
        
        // Create enemy card objects (simplified, no DB save)
        const enemyCard1 = {
          name: enemyChar1.name,
          series: enemyChar1.anime,
          imageUrl: enemyChar1.image,
          level: Math.floor(Math.random() * 50) + 1,
          class: ['Tank', 'Damage', 'Support', 'Intel'][Math.floor(Math.random() * 4)]
        };
        const enemyCard2 = {
          name: enemyChar2.name,
          series: enemyChar2.anime,
          imageUrl: enemyChar2.image,
          level: Math.floor(Math.random() * 50) + 1,
          class: ['Tank', 'Damage', 'Support', 'Intel'][Math.floor(Math.random() * 4)]
        };
        const enemyCard3 = {
          name: enemyChar3.name,
          series: enemyChar3.anime,
          imageUrl: enemyChar3.image,
          level: Math.floor(Math.random() * 50) + 1,
          class: ['Tank', 'Damage', 'Support', 'Intel'][Math.floor(Math.random() * 4)]
        };
        
        // Generate all 6 card images
        const userCardBuffer1 = await generateCardImage(userCard1, true);
        const userCardBuffer2 = await generateCardImage(userCard2, true);
        const userCardBuffer3 = await generateCardImage(userCard3, true);
        const enemyCardBuffer1 = await generateCardImage(enemyCard1, true);
        const enemyCardBuffer2 = await generateCardImage(enemyCard2, true);
        const enemyCardBuffer3 = await generateCardImage(enemyCard3, true);
        
        if (!userCardBuffer1 || !userCardBuffer2 || !userCardBuffer3 || 
            !enemyCardBuffer1 || !enemyCardBuffer2 || !enemyCardBuffer3) {
          return interaction.editReply('❌ Failed to generate card images');
        }
        
        // Use Sharp for battle layout
        const sharp = require('sharp');
        const { createCanvas, loadImage } = require('canvas');
        
        // Battle arena dimensions
        const canvasWidth = 1600;
        const canvasHeight = 1200;
        const cardWidth = 300;
        const cardHeight = 450;
        
        // Create Discord background
        const background = await sharp({
          create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 3,
            background: { r: 47, g: 49, b: 54 }
          }
        }).png().toBuffer();
        
        // Resize all cards
        const resizedUserCard1 = await sharp(userCardBuffer1).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer();
        const resizedUserCard2 = await sharp(userCardBuffer2).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer();
        const resizedUserCard3 = await sharp(userCardBuffer3).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer();
        const resizedEnemyCard1 = await sharp(enemyCardBuffer1).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer();
        const resizedEnemyCard2 = await sharp(enemyCardBuffer2).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer();
        const resizedEnemyCard3 = await sharp(enemyCardBuffer3).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer();
        
        // Position cards: User team on top, enemy team on bottom
        const spacing = 100;
        const startX = (canvasWidth - (cardWidth * 3 + spacing * 2)) / 2;
        const userY = 50; // Top row
        const enemyY = canvasHeight - cardHeight - 50; // Bottom row
        
        const userX1 = Math.floor(startX);
        const userX2 = Math.floor(startX + cardWidth + spacing);
        const userX3 = Math.floor(startX + (cardWidth + spacing) * 2);
        
        console.log(`Battle positioning: User cards Y=${userY}, Enemy cards Y=${enemyY}`);
        
        // Create VS text overlay
        const vsCanvas = createCanvas(canvasWidth, canvasHeight);
        const vsCtx = vsCanvas.getContext('2d');
        vsCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        vsCtx.font = 'bold 120px Arial';
        vsCtx.textAlign = 'center';
        vsCtx.fillText('VS', canvasWidth / 2, canvasHeight / 2 + 40);
        const vsBuffer = vsCanvas.toBuffer('image/png');
        
        // Composite all elements
        const finalBuffer = await sharp(background)
          .composite([
            // User team (top)
            { input: resizedUserCard1, left: userX1, top: userY },
            { input: resizedUserCard2, left: userX2, top: userY },
            { input: resizedUserCard3, left: userX3, top: userY },
            // Enemy team (bottom)  
            { input: resizedEnemyCard1, left: userX1, top: enemyY },
            { input: resizedEnemyCard2, left: userX2, top: enemyY },
            { input: resizedEnemyCard3, left: userX3, top: enemyY },
            // VS text
            { input: vsBuffer, left: 0, top: 0, blend: 'overlay' }
          ])
          .png()
          .toBuffer();
        
        const timestamp = Date.now();
        const attachment = new AttachmentBuilder(finalBuffer, { name: `battle_test_${timestamp}.png` });
        
        const embed = new EmbedBuilder()
          .setTitle('⚔️ Battle Test Arena')
          .setDescription(`**Your Team** vs **Enemy Team**\n\nYour Cards: ${userCard1.name}, ${userCard2.name}, ${userCard3.name}\nEnemy Cards: ${enemyCard1.name}, ${enemyCard2.name}, ${enemyCard3.name}`)
          .setImage(`attachment://battle_test_${timestamp}.png`)
          .setColor('#ff6b6b');
        
        await interaction.editReply({ embeds: [embed], files: [attachment] });
        
      } catch (error) {
        console.error('Error in battletest command:', error);
        await interaction.editReply('❌ Battle test failed');
      }
    }
    
    else if (commandName === 'gifdrop') {
      await interaction.deferReply();
      
      try {
        // Get the provided GIF file
        const gifPath = path.join('./attached_assets/fAnCprr~uWcz9Vj_1753203530001.gif');
        const gifBuffer = fs.readFileSync(gifPath);
        
        // Get 3 random characters for GIF cards
        const selectedCharacters = await aniListCharacterSystem.getRandomCharacters(3);
        
        if (selectedCharacters.length === 0) {
          return interaction.editReply('❌ No characters available at the moment. Please try again later.');
        }
        
        const selectedCards = [];
        const cardIds = [];
        
        // Available GIF characters
        const gifCharacters = [
          {
            name: 'Makima',
            series: 'Chainsaw Man',
            image: 'https://s4.anilist.co/file/anilistcdn/character/large/b132014-WNaOQMGYMq0n.png'
          },
          {
            name: 'Megumin',
            series: 'Kono Subarashii Sekai ni Shukufuku wo!',
            image: 'https://s4.anilist.co/file/anilistcdn/character/large/b17001-Pp7zXHV2OXQG.jpg'
          }
        ];
        
        // Select random GIF character
        const selectedGifCharacter = gifCharacters[Math.floor(Math.random() * gifCharacters.length)];
        
        const cardId = await generateUniqueCardId();
        
        // Get version and print number for selected character
        const versionInfo = simpleVersioning.getNextVersion(selectedGifCharacter.name, selectedGifCharacter.series);
        
        if (!versionInfo) {
          return interaction.editReply(`❌ ${selectedGifCharacter.name} has reached maximum prints.`);
        }
        
        // Assign class for selected character
        const assignedClass = classSystem.assignClass(selectedGifCharacter.name, selectedGifCharacter.series);
        const baseStats = classSystem.getBaseStats(assignedClass);
        
        const card = {
          cardId,
          name: selectedGifCharacter.name,
          series: selectedGifCharacter.series,
          imageUrl: selectedGifCharacter.image, 
          type: 'gif_card',
          printNumber: versionInfo.print,
          version: versionInfo.version,
          versionFormatted: versionInfo.formatted,
          rarity: versionInfo.rarity,
          class: assignedClass,
          level: 1,
          xp: 0,
          stats: baseStats,
          abilities: [abilities.getRandomAbilityForClass(assignedClass)],
          originalCharacter: selectedGifCharacter
        };
        
        selectedCards.push(card);
        cardIds.push(cardId);
        
        console.log(`Generated ${selectedCards.length} GIF cards using Sharp system`);
        
        // Generate GIF cards using Sharp system
        const gifAttachments = [];
        let content = '**🎴 One animated card has appeared! Click the button to grab it.**\n\n';
        
        for (let i = 0; i < selectedCards.length; i++) {
          const card = selectedCards[i];
          
          try {
            console.log(`Generating GIF card ${i + 1}/3: ${card.name}...`);
            
            // Select appropriate GIF file based on character
            let currentGifBuffer = gifBuffer; // Default to Makima temple GIF
            
            if (card.name === 'Megumin') {
              const meguminGifPath = path.join(__dirname, 'attached_assets', 'aSZixGu~EAzeWUT_1753207070429.gif');
              if (fs.existsSync(meguminGifPath)) {
                currentGifBuffer = fs.readFileSync(meguminGifPath);
              }
            }
            
            // Generate animated card using Sharp GIF system
            const gifCardBuffer = await sharpGifSystem.generateGifCard(card, currentGifBuffer);
            
            const attachment = new AttachmentBuilder(gifCardBuffer, { 
              name: `gif_card_${i + 1}.gif` 
            });
            gifAttachments.push(attachment);
            
            const rarityEmoji = card.rarity.tier === 'Pristine' ? '💎' : 
                              card.rarity.tier === 'Legendary' ? '🏆' : 
                              card.rarity.tier === 'Epic' ? '⭐' : '🎯';
            
            // Remove detailed card info from message
            
          } catch (error) {
            console.error(`Error generating GIF card for ${card.name}:`, error);
            // Fallback to regular card generation
            content += `**${i + 1}. ${card.name}** ${card.rarity.tier === 'Pristine' ? '💎' : 
                              card.rarity.tier === 'Legendary' ? '🏆' : 
                              card.rarity.tier === 'Epic' ? '⭐' : '🎯'}\n`;
            content += `   📺 ${card.series}\n`;
            content += `   📊 ${card.class} • Level ${card.level}\n`;
            content += `   🎲 Print #${card.printNumber} (WHITE)\n\n`;
          }
        }
        
        // Store cards in cache and create grab buttons
        const dropId = `gif_${interaction.user.id}_${Date.now()}`;
        dropCardCache.set(dropId, selectedCards);
        
        // Clean up cache after 5 minutes
        setTimeout(() => {
          dropCardCache.delete(dropId);
        }, 5 * 60 * 1000);
        
        const buttons = [];
        for (let i = 0; i < selectedCards.length; i++) {
          buttons.push(
            new ButtonBuilder()
              .setCustomId(`grab_${interaction.user.id.slice(-4)}|${i + 1}|${dropId}`)
              .setLabel(`🎬 ${i + 1}`)
              .setStyle(ButtonStyle.Primary)
          );
        }
        
        const row = new ActionRowBuilder().addComponents(buttons);
        
        await interaction.editReply({ 
          content: content,
          files: gifAttachments,
          components: [row] 
        });
        
      } catch (error) {
        console.error('Error in gifdrop command:', error);
        return interaction.editReply('❌ Error generating GIF cards. Please try again.');
      }
    }
    
    else if (commandName === 'collection') {
      await interaction.deferReply();
      
      const cards = await Card.find({ ownerId: interaction.user.id }).sort({ level: -1, cardId: 1 });
      if (cards.length === 0) {
        return interaction.editReply('❌ You have no cards in your collection. Use `/drop` to get started!');
      }

      // Pagination settings - 12 cards per page in compact format
      const cardsPerPage = 12;
      const totalPages = Math.ceil(cards.length / cardsPerPage);
      const currentPage = 1;
      
      // Get cards for current page
      const startIndex = (currentPage - 1) * cardsPerPage;
      const endIndex = startIndex + cardsPerPage;
      const pageCards = cards.slice(startIndex, endIndex);
      
      // Get player data for currency display with custom emojis
      const player = await Player.findOne({ userId: interaction.user.id });
      const currencyDisplay = `💰 ${player.currency} coins | ${getCurrencyEmoji('lumen')} ${player.lumens} Lumens | ${getCurrencyEmoji('nova')} ${player.novaGems} Nova Gems | ${getCurrencyEmoji('mystic')} ${player.mythicShards} Mythic Shards`;
      
      // Create ultra-compact collection embed with code blocks
      const embed = new EmbedBuilder()
        .setTitle(`🎴 ${interaction.user.username}'s Collection`)
        .setDescription(`${currencyDisplay}\n\n${cards.length} Total Cards | Page ${currentPage}/${totalPages}`)
        .addFields([
          {
            name: '📋 Your Cards',
            value: '```\n' + pageCards.map((card, index) => {
              const globalIndex = startIndex + index + 1;
              
              // Print number with special display
              let printDisplay;
              if (card.printNumber === 1) {
                printDisplay = `#${card.printNumber} ★`;
              } else if (card.printNumber === 2 || card.printNumber === 3) {
                printDisplay = `#${card.printNumber} ◆`;
              } else {
                printDisplay = `#${card.printNumber}`;
              }
              
              return `${globalIndex.toString().padStart(2, ' ')}. ${card.cardId} | ${card.name} | ${printDisplay} | Lv.${card.level}`;
            }).join('\n') + '```',
            inline: false
          }
        ])
        .setColor('#4a90e2')
        .setFooter({ text: `Use /card <id> for detailed stats` });

      // Create pagination buttons
      const prevButton = new ButtonBuilder()
        .setCustomId(`collection_${currentPage - 1}`)
        .setLabel('◀️ Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1);

      const nextButton = new ButtonBuilder()
        .setCustomId(`collection_${currentPage + 1}`)
        .setLabel('Next ▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages);

      const pageButton = new ButtonBuilder()
        .setCustomId('collection_info')
        .setLabel(`Page ${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);

      const buttons = totalPages > 1 ? [new ActionRowBuilder().addComponents(prevButton, pageButton, nextButton)] : [];

      await interaction.editReply({ embeds: [embed], components: buttons });
    }
    
    else if (commandName === 'shop') {
      await handleShopCommand(interaction);
    }
    
    else if (commandName === 'trash') {
      await interaction.deferReply();
      await handleTrashCommand(interaction);
    }
    
    else if (commandName === 'fish') {
      await interaction.deferReply();
      await fishingSystem.startFishing(interaction, []);
    }
    
    else if (commandName === 'card') {
      await interaction.deferReply();
      
      const cardId = interaction.options.getString('id');
      const card = await Card.findOne({ cardId });
      
      if (!card) {
        return interaction.editReply('❌ Card not found. Please check the card ID.');
      }
      
      const cardImage = await generateCardImage(card);
      if (cardImage) {
        const attachment = new AttachmentBuilder(cardImage, { name: 'card.png' });
        // Check if card is recovering from knockout
        const recoveryStatus = card.stats.hp <= 0 ? await healthRecoverySystem.getRecoveryStatus(card._id) : null;
        
        const embed = new EmbedBuilder()
          .setTitle(`🎴 ${card.name}`)
          .setDescription(`${card.series}`)
          .addFields(
            { name: '📊 Card Information', value: `${getClassEmoji(card.class)} Class: ${card.class}\n⭐ Level: ${card.level}\n💎 XP: ${card.xp}/${getRequiredXP(card.level)}\n🔢 Print: #${card.printNumber}\n🆔 ID: ${card.cardId}`, inline: false },
            { name: '📈 Combat Stats', value: `❤️ HP: ${card.stats.hp}/${card.stats.maxHp}\n⚔️ ATK: ${card.stats.attack}\n🛡️ DEF: ${card.stats.defense}\n⚡ SPD: ${card.stats.speed}`, inline: true },
            { name: '🏆 Battle Record', value: `✅ Wins: ${card.battleStats.wins}\n❌ Losses: ${card.battleStats.losses}\n📊 Win Rate: ${card.battleStats.wins + card.battleStats.losses > 0 ? Math.round((card.battleStats.wins / (card.battleStats.wins + card.battleStats.losses)) * 100) : 0}%`, inline: true }
          )
          .setImage('attachment://card.png')
          .setColor(classSystem.getClassColor(card.class));
        
        // Add health recovery status if card is knocked out
        if (recoveryStatus) {
          if (recoveryStatus.status === 'complete') {
            embed.addFields({
              name: '💚 Health Status',
              value: `\`\`\`\n${recoveryStatus.message}\`\`\``,
              inline: false
            });
          } else {
            embed.addFields({
              name: '🏥 Health Recovery', 
              value: `\`\`\`\n${recoveryStatus.progressBar} ${recoveryStatus.progress}%\n❤️ HP: ${recoveryStatus.currentHp}/${recoveryStatus.maxHp}\n⏱️ Time Remaining: ${recoveryStatus.timeRemaining}\`\`\``,
              inline: false
            });
          }
        }
        
        // Add abilities with color-coded descriptions
        if (card.abilities && card.abilities.length > 0) {
          const abilityText = card.abilities.map(abilityKey => {
            const ability = abilities.abilities[abilityKey];
            if (!ability) return `\`\`\`\n${abilityKey} - Unknown ability\`\`\``;
            
            // Get class color for ability description based on card's class
            let colorCode = '';
            if (card.class === 'Tank') colorCode = '```ansi\n\u001b[34m'; // Blue
            else if (card.class === 'Damage') colorCode = '```ansi\n\u001b[31m'; // Red  
            else if (card.class === 'Support') colorCode = '```ansi\n\u001b[32m'; // Green
            else if (card.class === 'Intel') colorCode = '```ansi\n\u001b[35m'; // Purple
            else colorCode = '```ansi\n\u001b[37m'; // White
            
            return `${colorCode}${ability.name} - ${ability.description}\u001b[0m\`\`\``;
          }).join('\n');
          
          embed.addFields({
            name: '⚡ Abilities',
            value: abilityText,
            inline: false
          });
        }
        
        await interaction.editReply({ embeds: [embed], files: [attachment] });
      } else {
        await interaction.editReply('❌ Error generating card image.');
      }
    }
    
    else if (commandName === 'train') {
      await interaction.deferReply();
      
      const cardIds = [
        interaction.options.getString('card1'),
        interaction.options.getString('card2'),
        interaction.options.getString('card3')
      ].filter(id => id); // Remove null values
      
      if (cardIds.length === 0) {
        // Show training overview
        // Auto-complete any finished training sessions first
        await trainingSystem.checkCompletedSessions();
        
        const activeSessions = await trainingSystem.getActiveTrainingSessions(interaction.user.id);
        
        if (activeSessions.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle('🏋️ Training Laboratory')
            .setDescription('> *Welcome to the Training Laboratory! Send up to 3 cards on training sessions to level them up.*')
            .addFields(
              { name: '📋 How Training Works', value: '```\n• Training duration depends on card level\n• Level 1: 3 minutes → Level 2\n• Higher levels take longer\n• Cards gain XP, currency, and stat boosts\n• Knocked out cards cannot train```', inline: false },
              { name: '💡 Usage', value: '```\n/train card1:abc123 card2:def456 card3:ghi789```', inline: false },
              { name: '🎯 Available Slots', value: '```\n3/3 slots available```', inline: false }
            )
            .setColor('#3498db')
            .setFooter({ text: 'Use /train with card IDs to start training sessions' });
          
          return interaction.editReply({ embeds: [embed] });
        }
        
        // Show active training sessions with progress bars
        const embed = new EmbedBuilder()
          .setTitle('🏋️ Active Training Sessions')
          .setDescription('> *Your cards are currently undergoing intense training regimens*')
          .setColor('#e74c3c');
        
        for (let i = 0; i < activeSessions.length; i++) {
          const session = activeSessions[i];
          const card = session.card;
          
          // Check if card exists (fix null reference error)
          if (!card) {
            console.log('Training session has null card, skipping...');
            continue;
          }
          
          // Calculate training progress
          const now = new Date();
          const elapsed = now.getTime() - session.startTime.getTime();
          const total = session.endTime.getTime() - session.startTime.getTime();
          const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
          const timeRemaining = Math.max(0, session.endTime.getTime() - now.getTime());
          
          const progressBar = trainingSystem.createProgressBar(progress);
          const timeRemainingText = trainingSystem.formatTimeRemaining(timeRemaining);
          
          embed.addFields({
            name: `🎯 Slot ${i + 1}: ${card.name}`,
            value: `\`\`\`\n🏷️ ${card.cardId}\n⭐ Level ${card.level} → ${card.level + 1}\n📊 ${progressBar} ${Math.round(progress)}%\n⏱️ ${timeRemainingText}\n💎 +${session.rewards.xp} XP | +${session.rewards.currency} coins\`\`\``,
            inline: true
          });
        }
        
        embed.addFields({
          name: '📊 Training Slots',
          value: `\`\`\`\n${activeSessions.length}/3 slots in use\`\`\``,
          inline: false
        });
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      // Auto-complete any finished training sessions first
      await trainingSystem.checkCompletedSessions();
      
      // Start training for provided cards
      const results = [];
      const errors = [];
      
      for (const cardId of cardIds) {
        console.log(`Training: Looking for card with cardId: ${cardId}`);
        const card = await Card.findOne({ cardId });
        
        if (!card) {
          console.log(`Training: Card ${cardId} not found in database`);
          errors.push(`❌ Card ${cardId} not found`);
          continue;
        }
        
        console.log(`Training: Found card ${card.name} (${card.cardId}) owned by ${card.ownerId}`);
        
        // Check ownership
        const populatedPlayer = await Player.findOne({ userId: interaction.user.id }).populate('cards');
        if (!populatedPlayer) {
          console.log(`Training: Player ${interaction.user.id} not found`);
          errors.push(`❌ Player not found`);
          continue;
        }
        
        console.log(`Training: Player has ${populatedPlayer.cards.length} cards`);
        const ownsCard = populatedPlayer.cards.some(c => c.cardId === cardId);
        
        if (!ownsCard) {
          console.log(`Training: Player does not own card ${cardId}`);
          console.log(`Training: Player's cards:`, populatedPlayer.cards.map(c => `${c.name} (${c.cardId})`));
          errors.push(`❌ You don't own card ${cardId}`);
          continue;
        }
        
        const result = await trainingSystem.startTraining(interaction.user.id, card._id);
        
        if (result.success) {
          results.push({
            card: card,
            duration: result.duration,
            rewards: result.rewards
          });
        } else {
          errors.push(`❌ ${card.name}: ${result.message}`);
        }
      }
      
      if (results.length === 0) {
        return interaction.editReply(errors.join('\n'));
      }
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🏋️ Training Sessions Started!')
        .setDescription('> *Your cards have begun their intensive training regimens*')
        .setColor('#2ecc71');
      
      for (const result of results) {
        const card = result.card;
        const duration = result.duration;
        const rewards = result.rewards;
        
        embed.addFields({
          name: `${card.name} (Level ${card.level})`,
          value: `\`\`\`\n⏱️ Duration: ${duration} minutes\n💎 Reward: ${rewards.xp} XP, ${rewards.currency} coins\n📈 Level ${card.level} → ${card.level + 1}\`\`\``,
          inline: false
        });
      }
      
      if (errors.length > 0) {
        embed.addFields({
          name: '⚠️ Errors',
          value: errors.join('\n'),
          inline: false
        });
      }
      
      embed.setFooter({ text: 'Use /train without parameters to check progress' });
      
      await interaction.editReply({ embeds: [embed] });
    }
    
    else if (commandName === 'battle') {
      await interaction.deferReply();
      
      const opponent = interaction.options.getUser('opponent');
      const cardId = interaction.options.getString('card');
      
      // Validate inputs
      if (opponent.id === interaction.user.id) {
        return interaction.editReply('❌ You cannot battle yourself!');
      }
      
      if (opponent.bot) {
        return interaction.editReply('❌ You cannot battle bots!');
      }
      
      // Check if player's card exists and is owned by them
      const playerCard = await Card.findOne({ cardId: cardId, ownerId: interaction.user.id });
      if (!playerCard) {
        return interaction.editReply('❌ Card not found or not owned by you. Please check the card ID.');
      }
      
      // Check if card is knocked out
      if (playerCard.stats.hp <= 0) {
        return interaction.editReply('❌ This card is knocked out and cannot battle! Wait for recovery or use another card.');
      }
      
      // Check if a battle request already exists
      const existingBattle = pvpBattleRequests.get(`${interaction.user.id}_${opponent.id}`);
      if (existingBattle) {
        return interaction.editReply('❌ You already have a pending battle request with this player.');
      }
      
      // Create battle request
      const battleRequest = {
        challenger: interaction.user.id,
        challengerName: interaction.user.username,
        opponent: opponent.id,
        opponentName: opponent.username,
        challengerCard: playerCard,
        createdAt: Date.now()
      };
      
      pvpBattleRequests.set(`${interaction.user.id}_${opponent.id}`, battleRequest);
      
      // Clean up request after 2 minutes
      setTimeout(() => {
        pvpBattleRequests.delete(`${interaction.user.id}_${opponent.id}`);
      }, 2 * 60 * 1000);
      
      const embed = new EmbedBuilder()
        .setTitle('⚔️ PvP Battle Challenge')
        .setDescription(`**${interaction.user.username}** challenges **${opponent.username}** to a 1v1 battle!`)
        .addFields([
          {
            name: '🎯 Challenger Card',
            value: `**${playerCard.name}** (${playerCard.cardId})\n⭐ Level ${playerCard.level} | 🏆 ${playerCard.class}\n❤️ ${playerCard.stats.hp}/${playerCard.stats.maxHp} HP`,
            inline: true
          },
          {
            name: '⏰ Instructions',
            value: `${opponent.username}, click **Accept Battle** and provide your card ID to join!`,
            inline: false
          }
        ])
        .setColor('#e74c3c')
        .setFooter({ text: 'Battle request expires in 2 minutes' });
      
      const acceptButton = new ButtonBuilder()
        .setCustomId(`pvp_accept_${interaction.user.id}_${opponent.id}`)
        .setLabel('⚔️ Accept Battle')
        .setStyle(ButtonStyle.Success);
      
      const declineButton = new ButtonBuilder()
        .setCustomId(`pvp_decline_${interaction.user.id}_${opponent.id}`)
        .setLabel('❌ Decline')
        .setStyle(ButtonStyle.Danger);
      
      const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);
      
      await interaction.editReply({ 
        content: `<@${opponent.id}>`,
        embeds: [embed], 
        components: [row] 
      });
    }
    
    // Mission system removed
    
    // Old mission system removed
    
    else if (commandName === 'leaderboard') {
      const topPlayers = await Player.find()
        .sort({ 'battleStats.wins': -1 })
        .limit(10);
      
      const embed = new EmbedBuilder()
        .setTitle('🏆 Battle Leaderboard')
        .setDescription('Top 10 Players by Wins')
        .setColor('#ffd700');
      
      const leaderboardText = topPlayers.map((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        return `${medal} ${player.username} - ${player.battleStats.wins} wins`;
      }).join('\n');
      
      embed.addFields({
        name: 'Rankings',
        value: leaderboardText || 'No battles yet!',
        inline: false
      });
      
      await interaction.reply({ embeds: [embed] });
    }
    
    else if (commandName === 'abilities') {
      const classFilter = interaction.options.getString('class');
      const abilityList = abilities.getAbilityList(classFilter);
      
      const embed = new EmbedBuilder()
        .setTitle('⚡ Available Abilities')
        .setDescription(classFilter ? `Abilities for ${classFilter} class` : 'All abilities')
        .setColor('#9b59b6');
      
      abilityList.forEach(ability => {
        embed.addFields({
          name: ability.name,
          value: `${ability.description}\n*Classes: ${ability.classes.join(', ')}*`,
          inline: true
        });
      });
      
      await interaction.reply({ embeds: [embed] });
    }
    
    else if (commandName === 'customize') {
      await interaction.deferReply();
      
      const cardId = interaction.options.getString('cardid');
      const populatedPlayer = await Player.findOne({ userId: interaction.user.id }).populate('cards');
      
      if (!populatedPlayer) {
        return interaction.editReply('❌ You need to have cards to customize them. Use `/drop` to get started!');
      }
      
      const card = populatedPlayer.cards.find(c => c.cardId === cardId);
      if (!card) {
        return interaction.editReply('❌ Card not found in your collection. Make sure you own this card.');
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`🎨 Customization Boutique 🎨`)
        .setDescription(`Welcome to the Customization Boutique, ${interaction.user.username}!\n\nWhat would you like to customize for **${card.name}**?`)
        .setColor('#2C2F33')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '**Card ID:**', value: `\`${card.cardId}\``, inline: true },
          { name: '**Character:**', value: `${card.name}`, inline: true },
          { name: '**Series:**', value: `${card.series}`, inline: true }
        )
        .setFooter({ text: 'Select an option below to customize your card!' });
      
      const userId = interaction.user.id.slice(-4);
      const dyeButton = new ButtonBuilder()
        .setCustomId(`custom_${cardId}_dye_${userId}`)
        .setLabel('🎨 Dye System')
        .setStyle(ButtonStyle.Primary);
      
      const frameButton = new ButtonBuilder()
        .setCustomId(`custom_${cardId}_frame_${userId}`)
        .setLabel('🖼️ Frame Selection')
        .setStyle(ButtonStyle.Secondary);
      
      const auraButton = new ButtonBuilder()
        .setCustomId(`custom_${cardId}_aura_${userId}`)
        .setLabel('⭐ Aura Effects')
        .setStyle(ButtonStyle.Success);
      
      const cancelButton = new ButtonBuilder()
        .setCustomId(`custom_${cardId}_cancel_${userId}`)
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger);
      
      const row = new ActionRowBuilder().addComponents(dyeButton, frameButton, auraButton, cancelButton);
      
      await interaction.editReply({ embeds: [embed], components: [row] });
    }
    
    else if (commandName === 'spawn') {
      await interaction.deferReply();
      
      try {
        const characters = await aniListCharacterSystem.getRandomCharacters(1);
        const character = characters[0];
        
        // Get version info
        const versionInfo = simpleVersioning.getNextVersion(character.name, character.series);
        if (!versionInfo) {
          return interaction.editReply('❌ This character has reached maximum versions.');
        }
        
        // Generate unique card ID
        const cardId = `${character.name.replace(/\s+/g, '')}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Assign class and create card
        const assignedClass = classSystem.assignClass(character.name, character.series);
        const baseStats = classSystem.getBaseStats(assignedClass);
        
        const card = {
          cardId: cardId,
          name: character.name,
          series: character.series,
          imageUrl: character.image, // Fixed: use 'image' not 'imageUrl'
          type: character.type,
          printNumber: versionInfo.print,
          version: versionInfo.version,
          versionFormatted: versionInfo.formatted,
          rarity: versionInfo.rarity,
          class: assignedClass,
          level: 1,
          xp: 0,
          stats: baseStats,
          abilities: [abilities.getRandomAbilityForClass(assignedClass)]
        };
        
        // Check if it's a GIF and handle differently
        if (card.imageUrl && card.imageUrl.endsWith('.gif')) {
          // For GIFs, try to create a bordered version
          const GifBorderOverlay = require('./gif_border_overlay');
          const borderOverlay = new GifBorderOverlay();
          
          const gifPath = card.imageUrl;
          
          // Try to create a bordered GIF (static frame with border)
          const borderedGif = await borderOverlay.createBorderedGif(gifPath, card);
          
          if (borderedGif) {
            // Send both the original GIF and the bordered static version
            const originalGif = new AttachmentBuilder(gifPath, { name: 'animated_original.gif' });
            const borderedStatic = new AttachmentBuilder(borderedGif, { name: 'bordered_preview.png' });
            
            let content = `**${card.name}** (${card.series}) - ${card.versionFormatted}\n`;
            content += `**${card.class}** Class • Level ${card.level}\n`;
            content += `\`${card.cardId}\`\n\n`;
            content += `🎬 **Original Animated** vs 🖼️ **Bordered Preview**`;
            
            await interaction.editReply({ 
              content: content,
              files: [originalGif, borderedStatic]
            });
          } else {
            // Fallback to original GIF only
            const attachment = new AttachmentBuilder(gifPath, { name: 'animated_card.gif' });
            
            let content = `**${card.name}** (${card.series}) - ${card.versionFormatted}\n`;
            content += `**${card.class}** Class • Level ${card.level}\n`;
            content += `\`${card.cardId}\`\n\n`;
            content += `🎬 **Animated Card** (borders not available for GIFs)`;
            
            await interaction.editReply({ 
              content: content,
              files: [attachment]
            });
          }
        } else {
          // For static images, generate the styled card
          const cardImage = await generateCardImage(card);
          if (cardImage) {
            const attachment = new AttachmentBuilder(cardImage, { name: 'card.png' });
            await interaction.editReply({ files: [attachment] });
          } else {
            await interaction.editReply('❌ Error generating card image. Please try again.');
          }
        }
        
      } catch (error) {
        console.error('Error in spawn command:', error);
        return interaction.editReply('❌ Error generating card. Please try again.');
      }
    }
    
    else if (commandName === 'characterstats') {
      await interaction.deferReply();
      
      try {
        const characterExpansion = require('./character_expansion_system');
        const stats = await characterExpansion.getCharacterStats();
        
        const embed = new EmbedBuilder()
          .setTitle('📊 Character Database Statistics')
          .setColor(stats.needsExpansion ? 0xFF8C00 : 0x00FF00)
          .addFields(
            { name: '📚 Total Characters Loaded', value: stats.count.toLocaleString(), inline: true },
            { name: '📄 Pages Processed', value: stats.loadedPages.toString(), inline: true },
            { name: '🎯 Target Goal', value: '5,000 characters', inline: true },
            { name: '📈 Progress', value: `${Math.round((stats.count / 5000) * 100)}%`, inline: true },
            { name: '📅 Last Updated', value: stats.lastUpdated === 'Never' ? 'Database not initialized' : new Date(stats.lastUpdated).toLocaleDateString(), inline: true },
            { name: '✨ Features', value: 'Name normalization, Visual battles, 5K expansion ready', inline: true }
          )
          .setFooter({ text: stats.needsExpansion ? '⚠️ Database can be expanded to 5K' : '✅ Database fully loaded' })
          .setTimestamp();
          
        await interaction.editReply({ embeds: [embed] });
        
      } catch (error) {
        console.error('Error showing character stats:', error);
        await interaction.editReply('❌ Error retrieving character statistics.');
      }
    }

    else if (commandName === 'expanddb') {
      if (interaction.user.id !== '1212577275875168287') {
        return interaction.reply({ content: '❌ Only the bot owner can expand the database.', flags: 64 });
      }

      await interaction.deferReply();
      
      try {
        const characterExpansion = require('./character_expansion_system');
        
        const embed = new EmbedBuilder()
          .setTitle('🔄 Expanding Character Database')
          .setDescription('Starting expansion to 5000+ characters from AniList...')
          .setColor(0xFFA500);
        
        await interaction.editReply({ embeds: [embed] });
        
        const expandedCharacters = await characterExpansion.expandDatabase();
        
        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Database Expansion Complete')
          .setDescription(`Successfully expanded character database to **${expandedCharacters.length.toLocaleString()}** characters`)
          .addFields(
            { name: '📈 Growth', value: `Database now contains ${expandedCharacters.length} unique anime characters`, inline: false },
            { name: '🎮 Impact', value: 'More diverse character drops and mission enemies available', inline: false }
          )
          .setColor(0x00FF00);
        
        await interaction.editReply({ embeds: [successEmbed] });
        
      } catch (error) {
        console.error('Error expanding database:', error);
        await interaction.editReply('❌ Error expanding database. Check console for details.');
      }
    }
    
    else if (commandName === 'testemojis') {
      await interaction.deferReply();
      
      try {
        // Test enhanced game emojis
        const gameEmojis = await enhancedEmojiSystem.getGameEmojis();
        const battleEmojis = await enhancedEmojiSystem.getBattleEmojis();
        const rarityEmojis = await enhancedEmojiSystem.getRarityEmojis();
        const classEmojis = enhancedEmojiSystem.getClassEmojis();
        
        const testMessage = `**🔧 Enhanced Emoji System Test**

**Game Emojis:**
${gameEmojis.sparkle} Sparkle • ${gameEmojis.crown} Crown • ${gameEmojis.sword} Sword
${gameEmojis.shield} Shield • ${gameEmojis.lightning} Lightning • ${gameEmojis.heart} Heart
${gameEmojis.star} Star • ${gameEmojis.gem} Gem • ${gameEmojis.fire} Fire

**Battle Emojis:**
${battleEmojis.attack} Attack • ${battleEmojis.defend} Defend • ${battleEmojis.critical} Critical
${battleEmojis.heal} Heal • ${battleEmojis.boost} Boost • ${battleEmojis.victory} Victory

**Rarity Emojis:**
${rarityEmojis.static} Static • ${rarityEmojis.animated_3d} 3D • ${rarityEmojis.animated_gif} Animated

**Class Emojis:**
${classEmojis.Tank} Tank • ${classEmojis.Damage} Damage • ${classEmojis.Support} Support • ${classEmojis.Intel} Intel

**Level Progression:**
${enhancedEmojiSystem.getLevelEmojis(5)} Level 5 • ${enhancedEmojiSystem.getLevelEmojis(15)} Level 15 
${enhancedEmojiSystem.getLevelEmojis(35)} Level 35 • ${enhancedEmojiSystem.getLevelEmojis(75)} Level 75 
${enhancedEmojiSystem.getLevelEmojis(105)} Level 105

**API Status:**
✅ emoji.gg integration: Active
✅ Freepik API integration: Active (${process.env.FREEPIK_API_KEY ? 'Key Found' : 'Key Missing'})
✅ Enhanced emoji system: Operational`;

        await interaction.editReply(testMessage);
      } catch (error) {
        console.error('Error testing enhanced emojis:', error);
        await interaction.editReply('❌ Error testing emoji systems: ' + error.message);
      }
    }
    
    else if (commandName === 'balance') {
      await interaction.deferReply();
      
      const player = await Player.findOne({ userId: interaction.user.id });
      if (!player) {
        return interaction.editReply('❌ Player profile not found. Use `/drop` to get started!');
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`💰 ${interaction.user.username}'s Balance`)
        .setDescription('Here are your current currency balances:')
        .addFields(
          { name: '💰 Coins', value: `**${player.currency}** coins`, inline: true },
          { name: `${getCurrencyEmoji('lumen')} Lumens`, value: `**${player.lumens}** Lumens`, inline: true },
          { name: `${getCurrencyEmoji('nova')} Nova Gems`, value: `**${player.novaGems}** Nova Gems`, inline: true },
          { name: `${getCurrencyEmoji('mystic')} Mythic Shards`, value: `**${player.mythicShards}** Mythic Shards`, inline: true },
          { name: '📊 Player Stats', value: `Level: **${player.level}**\nXP: **${player.xp}**\nCards: **${player.cards.length}**`, inline: true }
        )
        .setColor('#f39c12')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'Use /shop to spend your currencies on card chests!' });
      
      await interaction.editReply({ embeds: [embed] });
    }
    
    else if (commandName === 'lineup') {
      await interaction.deferReply();
      
      try {
        // Get current lineup
        const currentLineup = newBattleSystem.getLineup(interaction.user.id);
        
        // Create interactive lineup builder
        const embed = new EmbedBuilder()
          .setTitle('⚔️ Interactive Lineup Builder')
          .setDescription(`Build your 5-card strategic battle team!\n\n**Current Lineup:** ${currentLineup.length}/5 cards`)
          .setColor('#4a90e2')
          .setFooter({ text: 'Add cards by ID or remove them from your lineup' });
        
        // Show current lineup if any
        if (currentLineup.length > 0) {
          let lineupDisplay = '';
          for (let i = 0; i < 5; i++) {
            if (i < currentLineup.length) {
              const card = await Card.findOne({ cardId: currentLineup[i], ownerId: interaction.user.id });
              if (card) {
                lineupDisplay += `**${i + 1}.** ${card.name} (${card.class}) - Level ${card.level}\n`;
                lineupDisplay += `   💥 ${card.stats.attack} | 🛡️ ${card.stats.defense} | ⚡ ${card.stats.speed}\n\n`;
              } else {
                lineupDisplay += `**${i + 1}.** *Invalid Card*\n\n`;
              }
            } else {
              lineupDisplay += `**${i + 1}.** *Empty Slot*\n\n`;
            }
          }
          embed.addFields([{ name: '📋 Current Lineup', value: lineupDisplay, inline: false }]);
        } else {
          embed.addFields([{ name: '📋 Current Lineup', value: '*No cards selected*\n\nUse the buttons below to add cards!', inline: false }]);
        }
        
        // Create interactive buttons
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`lineup_add_${interaction.user.id}`)
            .setLabel('➕ Add Card')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`lineup_remove_${interaction.user.id}`)
            .setLabel('➖ Remove Card')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`lineup_clear_${interaction.user.id}`)
            .setLabel('🗑️ Clear All')
            .setStyle(ButtonStyle.Danger)
        );
        
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`lineup_view_collection_${interaction.user.id}`)
            .setLabel('👀 View My Cards')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`lineup_battle_${interaction.user.id}`)
            .setLabel('⚔️ Start Battle!')
            .setStyle(ButtonStyle.Success)
            .setDisabled(currentLineup.length !== 5)
        );
        
        await interaction.editReply({ 
          embeds: [embed], 
          components: [row1, row2] 
        });
        
      } catch (error) {
        console.error('Error creating interactive lineup:', error);
        await interaction.editReply('❌ Error creating lineup builder. Please try again.');
      }
    }
    
    else if (commandName === 'newbattle') {
      await interaction.deferReply();
      
      try {
        // Get user's lineup (now only need 3 cards for 3v3)
        const lineup = userLineups[interaction.user.id];
        if (!lineup || lineup.length < 3) {
          return interaction.editReply('❌ You need at least 3 cards in your lineup for 3v3 battles. Use `/lineup` to set up your team first.');
        }
        
        // Get cards from database (take first 3 for 3v3)
        const playerCards = [];
        for (let i = 0; i < Math.min(3, lineup.length); i++) {
          const cardId = lineup[i];
          const card = await Card.findOne({ cardId: cardId, ownerId: interaction.user.id });
          if (!card) {
            return interaction.editReply(`❌ Card ${cardId} not found. Please update your lineup.`);
          }
          playerCards.push(card);
        }
        
        console.log('Starting battle for user:', interaction.user.id);
        console.log('Player cards:', playerCards.map(c => c.name));
        
        // Start the battle with professional system
        const professionalBattleSystem = require('./professional_battle_system');
        const battleState = await professionalBattleSystem.startBattle(interaction.user.id, playerCards);
        console.log('Battle state created successfully');
        
        // Create professional battle embed with Canvas image like the reference
        const { embed, attachment } = await professionalBattleSystem.createBattleEmbed(battleState);
        
        // Send initial battle display with image
        const battleMessage = await interaction.editReply({ 
          embeds: [embed],
          files: [attachment]
        });
        
        // Auto-progress battle every 3 seconds
        const battleInterval = setInterval(async () => {
          try {
            // Add turn limit to prevent infinite battles
            if (battleState.turn > 50) {
              clearInterval(battleInterval);
              battleState.phase = 'ended';
              battleState.winner = 'draw';
              console.log('Battle ended due to turn limit (50 turns)');
            }
            
            const result = await professionalBattleSystem.processTurn(battleState);
            
            if (battleState.phase === 'ended') {
              clearInterval(battleInterval);
              
              // Create final battle result
              const winnerText = battleState.winner === 'player' ? 
                `🎉 **${interaction.user.username} WINS!**` : 
                battleState.winner === 'draw' ?
                '⏱️ **DRAW! Battle time limit reached**' :
                '💀 **AI Team Wins!**';
              
              const finalEmbed = new EmbedBuilder()
                .setTitle('⚔️ Battle Complete!')
                .setDescription(`${winnerText}\n\n**Battle Summary:**\n${battleState.battleLog.slice(-5).map(log => log.message).join('\n')}`)
                .addFields([
                  { 
                    name: '👥 Your Team Status', 
                    value: battleState.playerTeam.map(card => 
                      `${card.isAlive ? '✅' : '💀'} **${card.name}** - ${card.stats.hp}/${card.stats.maxHp} HP`
                    ).join('\n'), 
                    inline: true 
                  },
                  { 
                    name: '🤖 AI Team Status', 
                    value: battleState.aiTeam.map(card => 
                      `${card.isAlive ? '✅' : '💀'} **${card.name}** - ${card.stats.hp}/${card.stats.maxHp} HP`
                    ).join('\n'), 
                    inline: true 
                  }
                ])
                .setColor(battleState.winner === 'player' ? '#00ff00' : '#ff0000')
                .setFooter({ text: `Battle lasted ${battleState.turn} turns` });
              

              
              await battleMessage.edit({ 
                embeds: [finalEmbed]
              });
              
            } else {
              // Update battle display with professional Canvas image
              const { embed: progressEmbed, attachment: progressAttachment } = await professionalBattleSystem.createBattleEmbed(battleState);
              
              await battleMessage.edit({ 
                embeds: [progressEmbed],
                files: [progressAttachment]
              });
            }
            
          } catch (error) {
            console.error('Error in battle progression:', error);
            clearInterval(battleInterval);
          }
        }, 3000);
        
      } catch (error) {
        console.error('Error starting new battle:', error);
        await interaction.editReply('❌ Error starting battle. Please try again.');
      }
    }
    
    else if (commandName === 'spawngif') {
      await interaction.deferReply();
      
      try {
        // Force spawn a GIF character from nekos.best
        const character = await aniListCharacterSystem.getGifCharacter();
        
        // Get version info
        const versionInfo = simpleVersioning.getNextVersion(character.name, character.series);
        if (!versionInfo) {
          return interaction.editReply('❌ This character has reached maximum versions.');
        }
        
        // Generate unique card ID
        const cardId = `${character.name.replace(/\s+/g, '')}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Assign class and create card
        const assignedClass = classSystem.assignClass(character.name, character.series);
        const baseStats = classSystem.getBaseStats(assignedClass);
        
        const card = {
          cardId: cardId,
          name: character.name,
          series: character.series,
          imageUrl: character.image, // Fixed: use 'image' not 'imageUrl'
          type: character.type,
          printNumber: versionInfo.print,
          version: versionInfo.version,
          versionFormatted: versionInfo.formatted,
          rarity: versionInfo.rarity,
          class: assignedClass,
          level: 1,
          xp: 0,
          stats: baseStats,
          abilities: [abilities.getRandomAbilityForClass(assignedClass)]
        };
        
        // Since we know this is the GIF card, handle it accordingly
        const GifBorderOverlay = require('./gif_border_overlay');
        const borderOverlay = new GifBorderOverlay();
        
        const gifPath = card.imageUrl;
        
        // Try to create a bordered GIF (static frame with border)
        const borderedGif = await borderOverlay.createBorderedGif(gifPath, card);
        
        if (borderedGif) {
          // Send both the original GIF and the bordered static version
          const originalGif = new AttachmentBuilder(gifPath, { name: 'animated_original.gif' });
          const borderedStatic = new AttachmentBuilder(borderedGif, { name: 'bordered_preview.png' });
          
          let content = `**🎬 ANIMATED CARD SPAWNED!**\n\n`;
          content += `**${card.name}** (${card.series}) - ${card.versionFormatted}\n`;
          content += `**${card.class}** Class • Level ${card.level}\n`;
          content += `\`${card.cardId}\`\n\n`;
          content += `🎬 **Original Animated** vs 🖼️ **Bordered Preview**`;
          
          await interaction.editReply({ 
            content: content,
            files: [originalGif, borderedStatic]
          });
        } else {
          // Fallback to original GIF only
          const attachment = new AttachmentBuilder(gifPath, { name: 'animated_card.gif' });
          
          let content = `**🎬 ANIMATED CARD SPAWNED!**\n\n`;
          content += `**${card.name}** (${card.series}) - ${card.versionFormatted}\n`;
          content += `**${card.class}** Class • Level ${card.level}\n`;
          content += `\`${card.cardId}\`\n\n`;
          content += `🎬 **Animated Card** (borders not available for GIFs)`;
          
          await interaction.editReply({ 
            content: content,
            files: [attachment]
          });
        }
        
      } catch (error) {
        console.error('Error in spawnGIF command:', error);
        return interaction.editReply('❌ Error generating animated card. Please try again.');
      }
    }
    
    // MAL commands removed - back to pure AniList system
    else if (commandName === 'testmal') {
      await interaction.editReply('❌ MAL integration removed. Using AniList only.');
    }
    
    else if (commandName === 'mdrop') {
      await interaction.editReply('❌ MAL integration removed. Use /drop for regular AniList cards.');
    }
    
    else if (commandName === 'mcollection') {
      await interaction.editReply('❌ MAL integration removed. Use /collection for regular AniList cards.');
    }
    
    // PSA-Style Card Grading System
    else if (commandName === 'grade') {
      await interaction.deferReply();
      
      try {
        const cardId = interaction.options.getString('cardid');
        const isRegrade = interaction.options.getBoolean('regrade') || false;
        const userId = interaction.user.id;
        
        debug().info('COMMAND', 'Grade command started', {
          user: interaction.user.tag,
          cardId: cardId,
          isRegrade: isRegrade
        });
        
        let result;
        if (isRegrade) {
          result = await gradingSystem.regradeCard(cardId, userId);
        } else {
          result = await gradingSystem.gradeCard(cardId, userId);
        }
        
        if (!result.success) {
          debug().error('GRADING', 'Grading failed', {
            cardId: cardId,
            reason: result.message,
            isRegrade: isRegrade
          });
          return interaction.editReply(`❌ ${result.message}`);
        }
        
        // Get the card details for display
        const card = await Card.findOne({ cardId: cardId, ownerId: userId });
        if (!card) {
          return interaction.editReply('❌ Card not found after grading.');
        }
        
        const embed = new EmbedBuilder()
          .setTitle(`🏆 Card Grading ${isRegrade ? 'Complete - Regrade' : 'Complete'}`)
          .setColor(isRegrade ? '#FFD700' : '#00FF00')
          .addFields(
            { name: '📋 Card', value: `**${card.name}**\nfrom ${card.series}`, inline: true },
            { name: '🆔 Card ID', value: `\`${cardId}\``, inline: true },
            { name: '💎 Grade', value: isRegrade ? 
              `**${result.oldGrade}** → **${result.newGrade}**` : 
              `**${result.grade}**`, inline: true },
            { name: '💰 Cost', value: `${result.cost} ${result.currency}`, inline: true },
            { name: '📊 Result', value: result.message, inline: false }
          )
          .setFooter({ 
            text: isRegrade ? 
              'Regrades can only improve or maintain your grade!' : 
              'Grade locked! Use regrade option to improve (500 Nova Gems).'
          });
        
        if (isRegrade && result.improved) {
          embed.setDescription('🎉 **Grade Improved!** Your card is now worth more!');
        } else if (isRegrade && !result.improved) {
          embed.setDescription('✨ **Grade Maintained** - Your card kept its quality rating.');
        } else {
          embed.setDescription('🏆 **Card Successfully Graded!** Now locked with PSA-style rating.');
        }
        
        await interaction.editReply({ embeds: [embed] });
        
        debug().success('GRADING', 'Grading completed successfully', {
          cardId: cardId,
          grade: isRegrade ? result.newGrade : result.grade,
          cost: result.cost,
          currency: result.currency,
          improved: isRegrade ? result.improved : 'N/A'
        });
        
      } catch (error) {
        debug().error('COMMAND', 'Grade command failed', {
          error: error.message,
          user: interaction.user.tag,
          cardId: interaction.options.getString('cardid')
        });
        console.error('Error in grade command:', error);
        await interaction.editReply('❌ Error processing grade command. Please try again.');
      }
    }
    
    // Test currency command for debugging
    else if (commandName === 'testcurrency') {
      if (interaction.user.id !== '152246456202297344') {
        return interaction.editReply('❌ This command is owner-only.');
      }
      
      await interaction.deferReply();
      
      try {
        let player = await Player.findOne({ userId: interaction.user.id });
        if (!player) {
          player = new Player({
            userId: interaction.user.id,
            username: interaction.user.username,
            cards: []
          });
        }
        
        player.lumens = 100000;
        player.novaGems = 50000;
        player.mythicShards = 10000;
        player.currency = 50000;
        
        await player.save();
        
        const embed = new EmbedBuilder()
          .setTitle('💰 Test Currency Added')
          .setDescription('Your currencies have been reset to test amounts!')
          .addFields(
            { name: '💰 Coins', value: '50,000', inline: true },
            { name: '💎 Lumens', value: '100,000', inline: true },
            { name: '🌟 Nova Gems', value: '50,000', inline: true },
            { name: '✨ Mythic Shards', value: '10,000', inline: true }
          )
          .setColor('#00FF00');
        
        await interaction.editReply({ embeds: [embed] });
        
      } catch (error) {
        console.error('Error in testcurrency command:', error);
        await interaction.editReply('❌ Error setting test currency.');
      }
    }
    
    // Clean up any other MAL commands
    else if (commandName === 'oldmcollection') {
      await interaction.deferReply();
      
      try {
        debug().info('COMMAND', 'MAL collection requested', {
          user: interaction.user.tag,
          command: 'mcollection'
        });
        
        // For now, show a placeholder since we need to create a separate MAL card database
        const embed = new EmbedBuilder()
          .setTitle('📺 MyAnimeList Collection')
          .setDescription('**MAL Collection System Coming Soon!**\n\nThis will show your collected MAL characters with versioning system.')
          .setColor('#2E51A2')
          .addFields(
            { name: '🔧 Status', value: 'In Development', inline: true },
            { name: '📊 MAL Cards', value: '0 (Test Phase)', inline: true },
            { name: '🎨 Versions', value: 'v1, v2, v3 System Ready', inline: true }
          )
          .setFooter({ text: 'Use /mdrop to test MAL card generation!' });
        
        await interaction.editReply({ embeds: [embed] });
        
        debug().info('COMMAND', 'MAL collection placeholder shown');
        
      } catch (error) {
        debug().error('COMMAND', 'mcollection failed', { error: error.message });
        await interaction.editReply('❌ Failed to load MAL collection');
      }
    }
    
  } catch (error) {
    console.error('Error handling command:', error);
    if (interaction.deferred) {
      await interaction.editReply('❌ An error occurred while processing your command.');
    } else {
      await interaction.reply('❌ An error occurred while processing your command.');
    }
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onibot')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
      
