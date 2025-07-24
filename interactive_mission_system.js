const mongoose = require('mongoose');

// Enhanced Mission schema for interactive storylines
const interactiveMissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  universe: { type: String, required: true }, // Naruto, One Piece, etc.
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  title: { type: String, required: true },
  storyline: { type: String, required: true },
  currentStage: { type: Number, default: 1 },
  totalStages: { type: Number, required: true },
  enemies: [{
    stage: Number,
    name: String,
    level: Number,
    class: String,
    stats: {
      hp: Number,
      maxHp: Number,
      attack: Number,
      defense: Number,
      speed: Number
    },
    imageUrl: String,
    series: String,
    defeated: { type: Boolean, default: false }
  }],
  rewards: {
    perStage: { xp: Number, currency: Number },
    completion: { xp: Number, currency: Number }
  },
  status: { type: String, enum: ['active', 'completed', 'failed', 'abandoned'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const InteractiveMission = mongoose.model('InteractiveMission', interactiveMissionSchema);

class InteractiveMissionSystem {
  constructor() {
    // Universe-specific storylines that respect character personalities
    this.universeTemplates = {
      'Naruto': {
        enemies: ['Naruto Uzumaki', 'Sasuke Uchiha', 'Kakashi Hatake', 'Itachi Uchiha', 'Gaara', 'Neji Hyuga', 'Rock Lee'],
        storylines: {
          easy: [
            "You arrive at the Hidden Leaf Village during the Chunin Exams. {enemy1} challenges you to test your ninja skills!"
          ],
          medium: [
            "The village is under attack by rogue ninja! First you must face {enemy1}, then help {enemy2} defend the gates!",
            "You're on a mission to retrieve stolen scrolls. {enemy1} blocks your path, and {enemy2} guards the hideout!"
          ],
          hard: [
            "The Fourth Great Ninja War has begun! You must prove yourself by defeating {enemy1}, then {enemy2}, and finally face the legendary {enemy3}!",
            "A dangerous S-rank mission requires you to infiltrate enemy territory. Face {enemy1} at the border, {enemy2} in the compound, then {enemy3} who guards the target!"
          ]
        }
      },
      'One Piece': {
        enemies: ['Monkey D. Luffy', 'Roronoa Zoro', 'Sanji', 'Portgas D. Ace', 'Crocodile', 'Doflamingo', 'Katakuri'],
        storylines: {
          easy: [
            "Your crew lands on a mysterious island where {enemy1} challenges you to a friendly duel to test your strength!"
          ],
          medium: [
            "A rival pirate crew attacks your ship! First defeat {enemy1} on deck, then face their captain {enemy2} in the final showdown!",
            "You're competing in a tournament on a Grand Line island. Beat {enemy1} in the semifinals, then {enemy2} for the championship!"
          ],
          hard: [
            "Your crew has been captured by a powerful pirate alliance! Fight {enemy1} to escape your cell, defeat {enemy2} to reach your crew, then face {enemy3} to secure your freedom!",
            "A Marine Admiral is hunting your crew! Survive against {enemy1} at the port, {enemy2} in the city, then the Admiral {enemy3} for your escape!"
          ]
        }
      },
      'Attack on Titan': {
        enemies: ['Eren Yeager', 'Mikasa Ackerman', 'Levi Ackerman', 'Annie Leonhart', 'Reiner Braun', 'Zeke Yeager'],
        storylines: {
          easy: [
            "During training in the 104th Cadet Corps, {enemy1} challenges you to a sparring match to test your ODM gear skills!"
          ],
          medium: [
            "Titans have breached Wall Rose! Fight alongside {enemy1} to clear the area, then face {enemy2} who's been affected by titan power!",
            "You're on an expedition beyond the walls. {enemy1} tests your combat skills, then you must face {enemy2} when things go wrong!"
          ],
          hard: [
            "The truth about the titans has been revealed! Face {enemy1} who disagrees with your path, then {enemy2} who stands in your way, and finally {enemy3} in an epic final battle!",
            "Marley has launched their attack! Defend against {enemy1} at the port, {enemy2} in the city, then face {enemy3} to protect your people!"
          ]
        }
      },
      'Dragon Ball': {
        enemies: ['Goku', 'Vegeta', 'Piccolo', 'Gohan', 'Frieza', 'Cell', 'Majin Buu'],
        storylines: {
          easy: [
            "You've come to train with the Z-fighters! {enemy1} wants to test your power level in a friendly sparring match!"
          ],
          medium: [
            "A new threat approaches Earth! Prove your strength by facing {enemy1}, then team up to defeat the villain {enemy2}!",
            "The World Martial Arts Tournament has begun! Defeat {enemy1} in the quarter-finals, then {enemy2} in the semi-finals!"
          ],
          hard: [
            "A universal crisis threatens all existence! Face {enemy1} to prove your worth, then {enemy2} to gain their trust, and finally {enemy3} in the ultimate battle!",
            "Multiple timelines are colliding! Fight {enemy1} from an alternate timeline, then {enemy2} from the future, and finally {enemy3} to restore balance!"
          ]
        }
      },
      'My Hero Academia': {
        enemies: ['Izuku Midoriya', 'Katsuki Bakugo', 'Shoto Todoroki', 'All Might', 'Endeavor', 'Hawks'],
        storylines: {
          easy: [
            "U.A. High School is holding special training exercises! {enemy1} challenges you to test your Quirk abilities!"
          ],
          medium: [
            "Villains are attacking the city! Team up with {enemy1} to stop the threat, then face {enemy2} who's been corrupted by villain influence!",
            "The Sports Festival competition is intense! Defeat {enemy1} in your bracket, then face {enemy2} in the championship match!"
          ],
          hard: [
            "A League of Villains plot threatens society! Fight {enemy1} to gather intel, then {enemy2} to stop their plan, and finally {enemy3} in the climactic battle!",
            "A crisis at U.A. requires heroes to unite! Face {enemy1} who's testing your resolve, then {enemy2} who challenges your methods, and finally {enemy3} to save everyone!"
          ]
        }
      }
    };

    this.difficultySettings = {
      easy: { stages: 1, levelMod: [-1, 1], rewardMod: 1.0 },
      medium: { stages: 2, levelMod: [0, 2], rewardMod: 1.5 },
      hard: { stages: 3, levelMod: [1, 4], rewardMod: 2.5 }
    };
  }

  // Generate a new interactive mission
  async generateMission(userId, cardId) {
    try {
      const Card = mongoose.model('Card');
      const card = await Card.findById(cardId);
      
      if (!card) {
        return { success: false, message: 'Card not found' };
      }
      
      if (card.ownerId !== userId) {
        return { success: false, message: 'You do not own this card' };
      }

      // Check if card is knocked out
      if (card.stats.hp <= 0) {
        return { success: false, message: 'Card is knocked out and cannot undertake missions' };
      }

      // Check if card is already on a mission
      const existingMission = await InteractiveMission.findOne({
        userId: userId,
        cardId: cardId,
        status: 'active'
      });

      if (existingMission) {
        return { success: false, message: 'Card is already on a mission' };
      }

      // Determine difficulty based on card level
      let difficulty = 'easy';
      if (card.level >= 10) difficulty = 'hard';
      else if (card.level >= 5) difficulty = 'medium';

      // Select random universe
      const universes = Object.keys(this.universeTemplates);
      const selectedUniverse = universes[Math.floor(Math.random() * universes.length)];
      const universeData = this.universeTemplates[selectedUniverse];

      // Generate mission data
      const missionData = this.createMissionStoryline(selectedUniverse, difficulty, card.level);
      
      // Create the mission
      const mission = new InteractiveMission({
        userId: userId,
        cardId: cardId,
        universe: selectedUniverse,
        difficulty: difficulty,
        title: missionData.title,
        storyline: missionData.storyline,
        totalStages: missionData.enemies.length,
        enemies: missionData.enemies,
        rewards: missionData.rewards
      });

      await mission.save();

      return {
        success: true,
        mission: mission
      };

    } catch (error) {
      console.error('Error generating interactive mission:', error);
      return { success: false, message: 'Error generating mission' };
    }
  }

  // Create storyline with enemies for each stage
  createMissionStoryline(universe, difficulty, cardLevel) {
    const universeData = this.universeTemplates[universe];
    const difficultyData = this.difficultySettings[difficulty];
    const storylines = universeData.storylines[difficulty];
    
    // Select random storyline template
    const storylineTemplate = storylines[Math.floor(Math.random() * storylines.length)];
    
    // Select random enemies for each stage
    const selectedEnemies = [];
    const availableEnemies = [...universeData.enemies];
    
    for (let i = 0; i < difficultyData.stages; i++) {
      const enemyIndex = Math.floor(Math.random() * availableEnemies.length);
      const enemyName = availableEnemies.splice(enemyIndex, 1)[0];
      
      // Calculate enemy level based on card level and difficulty
      const levelRange = difficultyData.levelMod;
      const enemyLevel = Math.max(1, cardLevel + Math.floor(Math.random() * (levelRange[1] - levelRange[0] + 1)) + levelRange[0]);
      
      selectedEnemies.push({
        stage: i + 1,
        name: enemyName,
        level: enemyLevel,
        class: this.assignEnemyClass(enemyName),
        stats: this.generateEnemyStats(enemyLevel, enemyName),
        imageUrl: `https://i.imgur.com/placeholder.jpg`, // Will be replaced with actual character images
        series: universe
      });
    }

    // Replace enemy placeholders in storyline
    let storyline = storylineTemplate;
    selectedEnemies.forEach((enemy, index) => {
      storyline = storyline.replace(`{enemy${index + 1}}`, enemy.name);
    });

    // Calculate rewards
    const baseXP = 100 + (cardLevel * 15);
    const baseCurrency = 25 + (cardLevel * 10);
    
    const rewards = {
      perStage: {
        xp: Math.floor(baseXP * 0.4 * difficultyData.rewardMod),
        currency: Math.floor(baseCurrency * 0.4 * difficultyData.rewardMod)
      },
      completion: {
        xp: Math.floor(baseXP * 0.6 * difficultyData.rewardMod),
        currency: Math.floor(baseCurrency * 0.6 * difficultyData.rewardMod)
      }
    };

    return {
      title: `${universe} Mission: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty`,
      storyline: storyline,
      enemies: selectedEnemies,
      rewards: rewards
    };
  }

  // Assign class to enemy based on name
  assignEnemyClass(enemyName) {
    const classSystem = require('./classSystem');
    return classSystem.assignClass(enemyName, 'Unknown');
  }

  // Generate enemy stats
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

  // Get active missions for a user
  async getActiveMissions(userId) {
    try {
      return await InteractiveMission.find({
        userId: userId,
        status: 'active'
      }).populate('cardId');
    } catch (error) {
      console.error('Error fetching active missions:', error);
      return [];
    }
  }

  // Complete a mission stage
  async completeStage(missionId, stageNumber) {
    try {
      const mission = await InteractiveMission.findById(missionId);
      if (!mission) return { success: false, message: 'Mission not found' };

      // Mark enemy as defeated
      const enemy = mission.enemies.find(e => e.stage === stageNumber);
      if (enemy) {
        enemy.defeated = true;
      }

      // Check if mission is complete
      const allDefeated = mission.enemies.every(e => e.defeated);
      if (allDefeated) {
        mission.status = 'completed';
        mission.completedAt = new Date();
      } else {
        mission.currentStage = Math.min(mission.currentStage + 1, mission.totalStages);
      }

      await mission.save();

      return {
        success: true,
        mission: mission,
        stageComplete: true,
        missionComplete: allDefeated
      };
    } catch (error) {
      console.error('Error completing mission stage:', error);
      return { success: false, message: 'Error updating mission progress' };
    }
  }

  // Abandon mission (tap out)
  async abandonMission(missionId) {
    try {
      const mission = await InteractiveMission.findById(missionId);
      if (!mission) return { success: false, message: 'Mission not found' };

      mission.status = 'abandoned';
      await mission.save();

      // Calculate partial rewards based on completed stages
      const completedStages = mission.enemies.filter(e => e.defeated).length;
      const partialRewards = {
        xp: mission.rewards.perStage.xp * completedStages,
        currency: mission.rewards.perStage.currency * completedStages
      };

      return {
        success: true,
        partialRewards: partialRewards,
        completedStages: completedStages
      };
    } catch (error) {
      console.error('Error abandoning mission:', error);
      return { success: false, message: 'Error abandoning mission' };
    }
  }

  // Get difficulty emoji
  getDifficultyEmoji(difficulty) {
    const emojis = {
      easy: '🟢',
      medium: '🟡', 
      hard: '🔴'
    };
    return emojis[difficulty] || '⚪';
  }

  // Get class emoji
  getClassEmoji(characterClass) {
    const emojis = {
      Tank: '🛡️',
      Damage: '⚔️',
      Support: '💚',
      Intel: '🧠'
    };
    return emojis[characterClass] || '❓';
  }
  // Start a battle in an interactive mission
  async startBattle(interaction, mission) {
    const currentEnemy = mission.enemies[mission.currentStage - 1];
    
    // Create battle session
    const battleId = `imission_${mission._id}_${Date.now()}`;
    const battleSessions = require('./index.js').battleSessions || new Map();
    
    // Get the player's card
    const Card = require('./index.js').Card;
    const playerCard = await Card.findById(mission.cardId);
    
    if (!playerCard) {
      return interaction.reply({ content: '❌ Player card not found!', ephemeral: true });
    }
    
    battleSessions.set(battleId, {
      sessionId: battleId,
      type: 'imission',
      missionId: mission._id,
      player: mission.userId,
      playerCard: playerCard,
      enemyCard: currentEnemy,
      currentTurn: 'player',
      round: 1,
      universe: mission.universe.toLowerCase()
    });
    
    // Start AI-optimized automatic battle
    const AIBattleSystem = require('./ai_battle_system.js');
    const aiBattleSystem = new AIBattleSystem();
    
    try {
      await aiBattleSystem.startAutoBattle(interaction, playerCard, currentEnemy, 'mission', mission);
    } catch (error) {
      console.error('Error starting auto battle:', error);
      
      // Fallback to simple battle completion for now
      const battleResult = Math.random() > 0.3; // 70% win rate
      
      if (battleResult) {
        // Player wins
        const embed = new EmbedBuilder()
          .setTitle('🏆 Victory!')
          .setDescription(`**${playerCard.name}** defeats **${currentEnemy.name}** in an epic auto-battle!\n\n*${mission.storyline}*`)
          .addFields([
            { name: '⚔️ Battle Result', value: 'Your card used superior tactics to claim victory!', inline: false },
            { name: '📈 Progress', value: `Stage ${mission.currentStage}/${mission.stages.length} Complete`, inline: true }
          ])
          .setColor('#2ecc71')
          .setThumbnail(playerCard.imageUrl);
        
        const continueButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`mission_continue_${battleId}`)
            .setLabel(mission.currentStage < mission.stages.length ? '➡️ Next Stage' : '🏆 Complete Mission')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`mission_abandon_${battleId}`)
            .setLabel('🚪 Tap Out')
            .setStyle(ButtonStyle.Danger)
        );
        
        await interaction.update({ embeds: [embed], components: [continueButton] });
        
      } else {
        // Player loses
        const embed = new EmbedBuilder()
          .setTitle('💀 Defeat!')
          .setDescription(`**${currentEnemy.name}** overwhelms **${playerCard.name}** in battle!\n\n*The mission ends here...*`)
          .addFields([
            { name: '⚔️ Battle Result', value: 'Your opponent proved too strong this time.', inline: false },
            { name: '💰 Consolation Rewards', value: `+${mission.currentStage * 25} ✨ Lumens`, inline: true }
          ])
          .setColor('#e74c3c')
          .setThumbnail(currentEnemy.imageUrl);
        
        // Award consolation prize
        const player = await this.Player.findOne({ userId: interaction.user.id });
        if (player) {
          player.lumens += mission.currentStage * 25;
          await player.save();
        }
        
        await interaction.update({ embeds: [embed], components: [] });
        
        // Clean up mission
        delete this.activeMissions[interaction.user.id];
      }
    }
  }
}

module.exports = InteractiveMissionSystem;