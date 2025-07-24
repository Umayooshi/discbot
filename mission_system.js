const mongoose = require('mongoose');

// Mission schema
const missionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  missionType: { type: String, enum: ['story', 'challenge', 'boss'], default: 'story' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'nightmare'], default: 'medium' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  enemy: {
    name: { type: String, required: true },
    level: { type: Number, required: true },
    class: { type: String, required: true },
    stats: {
      hp: Number,
      maxHp: Number,
      attack: Number,
      defense: Number,
      speed: Number
    },
    imageUrl: String,
    series: String
  },
  rewards: {
    xp: { type: Number, default: 0 },
    currency: { type: Number, default: 0 },
    items: [{ name: String, quantity: Number }]
  },
  status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const Mission = mongoose.model('Mission', missionSchema);

class MissionSystem {
  constructor() {
    this.storyTemplates = [
      {
        setting: "Jujutsu High",
        scenarios: [
          "You arrive at Jujutsu High and encounter {enemy} in the courtyard. The cursed energy is overwhelming!",
          "During a training session at Jujutsu High, {enemy} appears and challenges you to a battle!",
          "You're exploring the abandoned wing of Jujutsu High when {enemy} emerges from the shadows!"
        ]
      },
      {
        setting: "Shibuya Incident",
        scenarios: [
          "The chaos of Shibuya has begun! You must face {enemy} to protect innocent civilians!",
          "In the midst of the Shibuya Incident, {enemy} blocks your path. Victory is your only option!",
          "The cursed spirits are running rampant in Shibuya. {enemy} stands before you, ready to fight!"
        ]
      },
      {
        setting: "Hidden Leaf Village",
        scenarios: [
          "You're on a mission for the Hidden Leaf Village when {enemy} ambushes you in the forest!",
          "The village is under attack! You must defeat {enemy} to protect your home!",
          "During your ninja training, {enemy} appears as your final test. Show them your strength!"
        ]
      },
      {
        setting: "Grand Line",
        scenarios: [
          "While sailing the Grand Line, your crew encounters {enemy} on a mysterious island!",
          "A fierce storm brings you face-to-face with {enemy}. The treasure you seek lies beyond this battle!",
          "Your adventure on the Grand Line takes a dangerous turn when {enemy} challenges you to a duel!"
        ]
      },
      {
        setting: "U.A. High School",
        scenarios: [
          "During hero training at U.A. High School, {enemy} appears as your ultimate test!",
          "The school is under attack! You must use your Quirk to defeat {enemy} and save your classmates!",
          "In the Sports Festival arena, you face off against {enemy} in an epic showdown!"
        ]
      },
      {
        setting: "Demon Slayer Corps",
        scenarios: [
          "Your mission as a Demon Slayer leads you to {enemy}. Draw your blade and fight!",
          "The moon is full and demons are active. {enemy} stands in your way - you must prevail!",
          "Your training with the Demon Slayer Corps has led to this moment. Face {enemy} with courage!"
        ]
      },
      {
        setting: "Survey Corps",
        scenarios: [
          "Beyond the walls, you encounter {enemy}. The fate of humanity depends on your victory!",
          "During an expedition outside the walls, {enemy} appears. Use your ODM gear and fight!",
          "The Survey Corps mission takes a dangerous turn when {enemy} blocks your path to freedom!"
        ]
      }
    ];

    this.difficultyModifiers = {
      easy: { levelRange: [-2, 0], rewardMultiplier: 0.8 },
      medium: { levelRange: [-1, 2], rewardMultiplier: 1.0 },
      hard: { levelRange: [1, 4], rewardMultiplier: 1.5 },
      nightmare: { levelRange: [3, 6], rewardMultiplier: 2.0 }
    };
  }

  // Generate a random mission for a card
  async generateMission(userId, cardId) {
    try {
      const Card = mongoose.model('Card');
      const card = await Card.findById(cardId);
      
      if (!card) {
        return { success: false, message: 'Card not found' };
      }
      
      if (card.ownerId !== userId) {
        console.log(`Mission ownership check failed - Card owner: ${card.ownerId}, User: ${userId}`);
        return { success: false, message: 'Card not owned by user' };
      }

      // Check if card is knocked out
      if (card.stats.hp <= 0) {
        return { success: false, message: 'Card is knocked out and cannot undertake missions' };
      }

      // Check if card is already on a mission
      const existingMission = await Mission.findOne({
        userId: userId,
        cardId: cardId,
        status: 'active'
      });

      if (existingMission) {
        return { success: false, message: 'Card is already on a mission' };
      }

      // Generate mission based on card's series and level
      const missionData = this.generateMissionData(card);
      
      // Create the mission
      const mission = new Mission({
        userId: userId,
        cardId: cardId,
        title: missionData.title,
        description: missionData.description,
        enemy: missionData.enemy,
        difficulty: missionData.difficulty,
        rewards: missionData.rewards,
        missionType: missionData.type
      });

      await mission.save();

      return {
        success: true,
        mission: mission
      };

    } catch (error) {
      console.error('Error generating mission:', error);
      return { success: false, message: 'Error generating mission' };
    }
  }

  // Generate mission data based on card
  generateMissionData(card) {
    // Use fallback characters if AniList system isn't available
    const fallbackCharacters = [
      { name: 'Shadow Warrior', image: 'https://i.imgur.com/placeholder.jpg', series: 'Dark Realm' },
      { name: 'Ice Queen', image: 'https://i.imgur.com/placeholder.jpg', series: 'Frozen Kingdom' },
      { name: 'Fire Dragon', image: 'https://i.imgur.com/placeholder.jpg', series: 'Dragon Empire' },
      { name: 'Lightning Sage', image: 'https://i.imgur.com/placeholder.jpg', series: 'Storm Academy' },
      { name: 'Dark Knight', image: 'https://i.imgur.com/placeholder.jpg', series: 'Shadow Realm' }
    ];
    
    // Select random story template
    const template = this.storyTemplates[Math.floor(Math.random() * this.storyTemplates.length)];
    const scenario = template.scenarios[Math.floor(Math.random() * template.scenarios.length)];

    // Determine difficulty based on card level
    let difficulty = 'medium';
    if (card.level <= 3) difficulty = 'easy';
    else if (card.level <= 7) difficulty = 'medium';
    else if (card.level <= 15) difficulty = 'hard';
    else difficulty = 'nightmare';

    // Get a random enemy character from fallback list
    const enemyChar = fallbackCharacters[Math.floor(Math.random() * fallbackCharacters.length)];
    
    // Calculate enemy stats based on difficulty
    const difficultyMod = this.difficultyModifiers[difficulty];
    const enemyLevelRange = difficultyMod.levelRange;
    const enemyLevel = Math.max(1, card.level + Math.floor(Math.random() * (enemyLevelRange[1] - enemyLevelRange[0] + 1)) + enemyLevelRange[0]);
    
    // Generate enemy stats
    const enemyStats = this.generateEnemyStats(enemyLevel, enemyChar.name);
    
    // Create mission description
    const description = scenario.replace('{enemy}', enemyChar.name);
    
    // Calculate rewards
    const rewards = this.calculateMissionRewards(card.level, difficulty);

    return {
      title: `${template.setting}: Face ${enemyChar.name}`,
      description: description,
      difficulty: difficulty,
      type: 'story',
      enemy: {
        name: enemyChar.name,
        level: enemyLevel,
        class: this.assignEnemyClass(enemyChar.name),
        stats: enemyStats,
        imageUrl: enemyChar.image,
        series: enemyChar.series
      },
      rewards: rewards
    };
  }

  // Generate enemy stats based on level
  generateEnemyStats(level, enemyName) {
    const classSystem = require('./classSystem');
    const enemyClass = this.assignEnemyClass(enemyName);
    const baseStats = classSystem.getBaseStats(enemyClass);
    
    // Scale stats based on level
    const levelMultiplier = 1 + (level - 1) * 0.1;
    
    return {
      hp: Math.floor(baseStats.hp * levelMultiplier),
      maxHp: Math.floor(baseStats.maxHp * levelMultiplier),
      attack: Math.floor(baseStats.attack * levelMultiplier),
      defense: Math.floor(baseStats.defense * levelMultiplier),
      speed: Math.floor(baseStats.speed * levelMultiplier)
    };
  }

  // Assign class to enemy based on name patterns
  assignEnemyClass(enemyName) {
    const classSystem = require('./classSystem');
    return classSystem.assignClass(enemyName, 'Unknown');
  }

  // Calculate mission rewards
  calculateMissionRewards(cardLevel, difficulty) {
    const difficultyMod = this.difficultyModifiers[difficulty];
    const baseXP = 75 + (cardLevel * 25);
    const baseCurrency = 15 + (cardLevel * 8);
    
    return {
      xp: Math.floor(baseXP * difficultyMod.rewardMultiplier),
      currency: Math.floor(baseCurrency * difficultyMod.rewardMultiplier),
      items: this.generateMissionItems(cardLevel, difficulty)
    };
  }

  // Generate mission reward items
  generateMissionItems(cardLevel, difficulty) {
    const items = [];
    
    // Chance for items based on difficulty
    const itemChance = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.7,
      nightmare: 0.9
    };

    if (Math.random() < itemChance[difficulty]) {
      const possibleItems = [
        { name: 'Health Potion', quantity: 1 },
        { name: 'Training Scroll', quantity: 1 },
        { name: 'Skill Fragment', quantity: Math.floor(Math.random() * 3) + 1 },
        { name: 'Mystery Box', quantity: 1 }
      ];

      if (cardLevel >= 10) {
        possibleItems.push({ name: 'Rare Gem', quantity: 1 });
      }

      if (difficulty === 'nightmare') {
        possibleItems.push({ name: 'Legendary Chest', quantity: 1 });
      }

      const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      items.push(randomItem);
    }

    return items;
  }

  // Get active missions for a user
  async getActiveMissions(userId) {
    try {
      const missions = await Mission.find({
        userId: userId,
        status: 'active'
      }).populate('cardId');

      return missions;
    } catch (error) {
      console.error('Error getting active missions:', error);
      return [];
    }
  }

  // Complete a mission (battle outcome)
  async completeMission(missionId, victory) {
    try {
      const mission = await Mission.findById(missionId).populate('cardId');
      
      if (!mission || mission.status !== 'active') {
        return { success: false, message: 'Mission not found or not active' };
      }

      const Card = mongoose.model('Card');
      const Player = mongoose.model('Player');

      if (victory) {
        // Victory - give rewards
        const card = mission.cardId;
        card.xp += mission.rewards.xp;
        
        // Check for level up
        const levelUpResult = this.checkLevelUp(card);
        if (levelUpResult.leveledUp) {
          card.level = levelUpResult.newLevel;
          const statIncrease = this.calculateStatIncrease(card.level, card.class);
          card.stats.maxHp += statIncrease.hp;
          card.stats.hp = card.stats.maxHp; // Restore full HP on level up
          card.stats.attack += statIncrease.attack;
          card.stats.defense += statIncrease.defense;
          card.stats.speed += statIncrease.speed;
        }

        await card.save();

        // Update player currency
        const player = await Player.findOne({ userId: mission.userId });
        if (player) {
          player.currency += mission.rewards.currency;
          await player.save();
        }

        mission.status = 'completed';
        mission.completedAt = new Date();
        await mission.save();

        return {
          success: true,
          victory: true,
          rewards: mission.rewards,
          levelUp: levelUpResult,
          card: card
        };
      } else {
        // Defeat - card gets knocked out
        const card = mission.cardId;
        card.stats.hp = 0; // Knock out the card
        await card.save();

        mission.status = 'failed';
        mission.completedAt = new Date();
        await mission.save();

        return {
          success: true,
          victory: false,
          card: card
        };
      }

    } catch (error) {
      console.error('Error completing mission:', error);
      return { success: false, message: 'Error completing mission' };
    }
  }

  // Check if card levels up
  checkLevelUp(card) {
    const requiredXP = this.calculateRequiredXP(card.level);
    
    if (card.xp >= requiredXP) {
      return {
        leveledUp: true,
        newLevel: card.level + 1,
        requiredXP: requiredXP
      };
    }

    return {
      leveledUp: false,
      newLevel: card.level,
      requiredXP: requiredXP
    };
  }

  // Calculate XP required for next level
  calculateRequiredXP(currentLevel) {
    return 100 + (currentLevel * 50);
  }

  // Calculate stat increases per level
  calculateStatIncrease(level, cardClass) {
    const classMultipliers = {
      'Tank': { hp: 80, attack: 20, defense: 60, speed: 5 },
      'Damage': { hp: 40, attack: 70, defense: 20, speed: 15 },
      'Support': { hp: 60, attack: 30, defense: 40, speed: 20 },
      'Intel': { hp: 50, attack: 50, defense: 30, speed: 25 }
    };

    const multiplier = classMultipliers[cardClass] || classMultipliers['Damage'];
    
    return {
      hp: multiplier.hp,
      attack: multiplier.attack,
      defense: multiplier.defense,
      speed: multiplier.speed
    };
  }

  // Get difficulty emoji
  getDifficultyEmoji(difficulty) {
    const emojis = {
      easy: '🟢',
      medium: '🟡',
      hard: '🔴',
      nightmare: '🟣'
    };
    return emojis[difficulty] || '⚪';
  }

  // Get class emoji
  getClassEmoji(cardClass) {
    const emojis = {
      'Tank': '🛡️',
      'Damage': '⚔️',
      'Support': '💚',
      'Intel': '⚡'
    };
    return emojis[cardClass] || '❓';
  }
}

module.exports = MissionSystem;