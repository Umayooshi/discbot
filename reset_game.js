// Game reset script to clear all data and restart fresh
const mongoose = require('mongoose');
require('dotenv').config();

// Import the same models from index.js
const cardSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  series: { type: String, required: true },
  imageUrl: { type: String, required: true },
  type: { type: String, default: 'character' },
  printNumber: { type: Number, default: 1 },
  version: { type: Number, default: 1 },
  versionFormatted: { type: String, default: '#1' },
  rarity: {
    tier: { type: String, default: 'Common' },
    value: { type: Number, default: 1 }
  },
  class: { type: String, required: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  stats: {
    hp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    speed: { type: Number, required: true }
  },
  abilities: [{ type: String }],
  ownerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // Card customization options
  dyeColor: { type: String, default: null },
  frameType: { type: String, default: 'default' },
  auraType: { type: String, default: null }
});

const characterPrintsSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  series: { type: String, required: true },
  currentPrint: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  
  // Currency system
  lumens: { type: Number, default: 1000 },
  novaGems: { type: Number, default: 50 },
  mythicShards: { type: Number, default: 10 },
  
  // Player stats
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  totalBattles: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  
  // Mission progress
  activeMissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }],
  completedMissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }],
  
  createdAt: { type: Date, default: Date.now }
});

const Card = mongoose.model('Card', cardSchema);
const CharacterPrints = mongoose.model('CharacterPrints', characterPrintsSchema);
const Player = mongoose.model('Player', playerSchema);

async function resetGame() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onibot');
    console.log('Connected to MongoDB');

    console.log('🗑️ Clearing all card collections...');
    const deletedCards = await Card.deleteMany({});
    console.log(`Deleted ${deletedCards.deletedCount} cards`);

    console.log('🗑️ Clearing all character print records...');
    const deletedPrints = await CharacterPrints.deleteMany({});
    console.log(`Deleted ${deletedPrints.deletedCount} character print records`);

    console.log('🗑️ Clearing all player inventories...');
    await Player.updateMany({}, { 
      $set: { 
        cards: [],
        lumens: 1000,
        novaGems: 50,
        mythicShards: 10,
        level: 1,
        xp: 0,
        totalBattles: 0,
        wins: 0,
        activeMissions: [],
        completedMissions: []
      }
    });
    console.log('Player inventories cleared and currencies reset');

    console.log('✅ Game reset complete! All cards are now fresh #1 prints.');
    console.log('📊 Reset Summary:');
    console.log(`   - ${deletedCards.deletedCount} cards removed`);
    console.log(`   - ${deletedPrints.deletedCount} print records cleared`);
    console.log('   - All player inventories cleared');
    console.log('   - All print numbers reset to #1');
    console.log('   - Player currencies reset to starting amounts');

    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error resetting game:', error);
    process.exit(1);
  }
}

resetGame();