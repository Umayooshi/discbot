const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onibot');

// Define schemas directly since we can't import from index.js easily
const playerSchema = new mongoose.Schema({
  userId: String,
  username: String,
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  lumens: { type: Number, default: 100 },
  novaGems: { type: Number, default: 0 },
  mythicShards: { type: Number, default: 0 },
  deckSlots: [{
    slotNumber: Number,
    cardId: String
  }],
  fishing: {
    lastFished: Date,
    consecutiveDays: { type: Number, default: 0 },
    totalCatches: { type: Number, default: 0 }
  }
});

const cardSchema = new mongoose.Schema({
  cardId: String,
  name: String,
  image: String,
  imageUrl: String,
  series: String,
  rarity: String,
  level: { type: Number, default: 1 },
  printNumber: { type: Number, default: 1 },
  class: { type: String, enum: ['Tank', 'Damage', 'Support', 'Intel'], default: 'Damage' },
  stats: {
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    attack: { type: Number, default: 50 },
    defense: { type: Number, default: 50 },
    speed: { type: Number, default: 50 }
  },
  xp: { type: Number, default: 0 },
  ownerId: String,
  acquiredAt: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);
const Card = mongoose.model('Card', cardSchema);

async function clearInventory(userId) {
  try {
    console.log(`Clearing inventory for user: ${userId}`);
    
    // Delete all cards owned by the user
    const deletedCards = await Card.deleteMany({ ownerId: userId });
    console.log(`Deleted ${deletedCards.deletedCount} cards`);
    
    // Reset player data but keep basic info
    const player = await Player.findOne({ userId });
    if (player) {
      player.cards = [];
      player.lumens = 0;
      player.novaGems = 0;
      player.mythicShards = 0;
      player.deckSlots = [];
      await player.save();
      console.log('Player inventory cleared');
    }
    
    console.log('Inventory cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing inventory:', error);
    process.exit(1);
  }
}

// Usage: node cleanup_inventory.js YOUR_USER_ID
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID: node cleanup_inventory.js YOUR_USER_ID');
  process.exit(1);
}

clearInventory(userId);