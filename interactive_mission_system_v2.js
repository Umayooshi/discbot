const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class InteractiveMissionSystemV2 {
  constructor() {
    this.activeMissions = new Map(); // userId -> mission data
    this.missionTimeout = 2 * 60 * 60 * 1000; // 2 hours timeout
    
    // Import character expansion system
    const { AnimeCharacterExpansion } = require('./anime_character_expansion');
    this.characterExpansion = new AnimeCharacterExpansion();
    
    this.universes = [
      { name: 'Naruto', color: '#FFA500', enemies: ['Orochimaru', 'Pain', 'Madara Uchiha', 'Sasuke Uchiha', 'Itachi Uchiha'] },
      { name: 'One Piece', color: '#FF4500', enemies: ['Blackbeard', 'Kaido', 'Big Mom', 'Doflamingo', 'Crocodile'] },
      { name: 'Attack on Titan', color: '#8B0000', enemies: ['Levi Ackerman', 'Eren Yeager', 'Reiner Braun', 'Annie Leonhart', 'Zeke Yeager'] },
      { name: 'Dragon Ball', color: '#FFD700', enemies: ['Frieza', 'Cell', 'Majin Buu', 'Vegeta', 'Beerus'] },
      { name: 'My Hero Academia', color: '#4169E1', enemies: ['All For One', 'Shigaraki', 'Overhaul', 'Stain', 'Dabi'] },
      { name: 'Jujutsu Kaisen', color: '#8B0000', enemies: ['Sukuna', 'Mahito', 'Jogo', 'Hanami', 'Suguru Geto'] },
      { name: 'Bleach', color: '#4B0082', enemies: ['Sosuke Aizen', 'Ulquiorra Cifer', 'Grimmjow Jaegerjaquez', 'Gin Ichimaru', 'Kaname Tosen'] }
    ];
  }

  // Start a mission with a specific card
  async startMission(interaction, cardId) {
    const userId = interaction.user.id;
    
    // Check if user already has an active mission
    if (this.activeMissions.has(userId)) {
      const existingMission = this.activeMissions.get(userId);
      
      // Check if mission has expired (2 hours)
      if (Date.now() - existingMission.startTime > this.missionTimeout) {
        // Mission expired, remove it
        this.activeMissions.delete(userId);
      } else {
        if (!interaction.replied && !interaction.deferred) {
          return interaction.reply({
            content: `You already have an active mission! Use the buttons below to continue or abandon it.`,
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`mission_continue_${userId}`)
                  .setLabel('Continue Mission')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(`mission_abandon_${userId}`)
                  .setLabel('Abandon Mission')
                  .setStyle(ButtonStyle.Danger)
              )
            ],
            ephemeral: true
          });
        }
        return;
      }
    }

    // Find the card using mongoose - get the model properly
    const mongoose = require('mongoose');
    
    // Card schema definition (should match what's in index.js)
    let Card;
    try {
      Card = mongoose.model('Card');
    } catch (error) {
      // Define the Card schema if it doesn't exist
      const cardSchema = new mongoose.Schema({
        cardId: { type: String, required: true, unique: true },
        ownerId: { type: String, required: true },
        name: { type: String, required: true },
        image: String,
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        printNumber: { type: Number, required: true },
        class: String,
        dyeColor: { type: String, default: 'default' },
        appliedFrame: String,
        appliedAura: String,
        stats: {
          hp: { type: Number, default: 100 },
          maxHp: { type: Number, default: 100 },
          attack: { type: Number, default: 10 },
          defense: { type: Number, default: 10 },
          speed: { type: Number, default: 10 }
        },
        abilities: [String],
        currentAbility: String,
        inRiver: { type: Boolean, default: false },
        riverTime: Date,
        inTraining: { type: Boolean, default: false },
        trainingStartTime: Date,
        trainingEndTime: Date
      }, { timestamps: true });
      
      Card = mongoose.model('Card', cardSchema);
    }
    
    const card = await Card.findOne({ cardId: cardId, ownerId: userId });
    
    if (!card) {
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: `❌ Card not found or not owned by you!`, ephemeral: true });
      }
      return;
    }

    // Check if card is healthy enough for mission
    if (card.stats.hp <= 0) {
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: `❌ **${card.name}** needs healing before going on a mission!`, ephemeral: true });
      }
      return;
    }

    // Create new mission
    const universe = this.universes[Math.floor(Math.random() * this.universes.length)];
    const difficulty = ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)];
    const stagesCount = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3;
    
    const mission = {
      userId: userId,
      cardId: cardId,
      card: card,
      universe: universe,
      difficulty: difficulty,
      totalStages: stagesCount,
      currentStage: 1,
      startTime: Date.now(),
      completed: false,
      rewards: {
        currency: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200,
        xp: difficulty === 'Easy' ? 100 : difficulty === 'Medium' ? 200 : 400
      }
    };

    this.activeMissions.set(userId, mission);

    // Create mission start embed
    const embed = new EmbedBuilder()
      .setTitle(`🌟 ${universe.name} Mission Started!`)
      .setDescription(`**${card.name}** has entered a ${difficulty} mission in the ${universe.name} universe!\n\n**Mission Details:**\n• **Stages:** ${stagesCount}\n• **Rewards:** ${mission.rewards.currency} 🔥 + ${mission.rewards.xp} XP\n• **No healing between stages!**\n\nReady to begin the first battle?`)
      .setColor(universe.color)
      .setThumbnail(card.imageUrl || card.image)
      .setFooter({ text: `Mission will auto-expire in 2 hours if not completed` });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mission_battle_${userId}`)
        .setLabel('⚔️ Start Battle')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`mission_abandon_${userId}`)
        .setLabel('🚪 Abandon Mission')
        .setStyle(ButtonStyle.Secondary)
    );

    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ embeds: [embed], components: [buttons] });
    } else {
      return interaction.editReply({ embeds: [embed], components: [buttons] });
    }
  }

  // Handle mission interactions
  async handleMissionInteraction(interaction) {
    const userId = interaction.user.id;
    const action = interaction.customId.split('_')[1];

    const mission = this.activeMissions.get(userId);
    if (!mission) {
      return interaction.reply({ content: `❌ No active mission found!`, ephemeral: true });
    }

    // Check if mission expired
    if (Date.now() - mission.startTime > this.missionTimeout) {
      this.activeMissions.delete(userId);
      return interaction.reply({ content: `❌ Mission has expired after 2 hours of inactivity.`, ephemeral: true });
    }

    switch (action) {
      case 'continue':
        return this.showMissionStatus(interaction, mission);
      
      case 'abandon':
        this.activeMissions.delete(userId);
        return interaction.update({
          content: `🚪 **${mission.card.name}** has abandoned the ${mission.universe.name} mission.`,
          embeds: [],
          components: []
        });
      
      case 'battle':
        return this.startMissionBattle(interaction, mission);
        
      default:
        return interaction.reply({ content: `❌ Unknown mission action.`, ephemeral: true });
    }
  }

  async showMissionStatus(interaction, mission) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 ${mission.universe.name} Mission Status`)
      .setDescription(`**${mission.card.name}** is on a ${mission.difficulty} mission!\n\n**Progress:** Stage ${mission.currentStage}/${mission.totalStages}\n**Health:** ${mission.card.stats.hp}/${mission.card.stats.maxHp} HP`)
      .setColor(mission.universe.color)
      .setFooter({ text: `Started ${new Date(mission.startTime).toLocaleTimeString()}` });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mission_battle_${mission.userId}`)
        .setLabel('⚔️ Continue Battle')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`mission_abandon_${mission.userId}`)
        .setLabel('🚪 Abandon Mission')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.update({ embeds: [embed], components: [buttons] });
  }

  async startMissionBattle(interaction, mission) {
    // Generate enemy for this stage
    const enemy = this.generateMissionEnemy(mission.universe, mission.currentStage);
    
    // Create battle session
    const battleId = `mission_${mission.userId}_${Date.now()}`;
    
    const battleSessions = require('./index.js').battleSessions;
    battleSessions.set(battleId, {
      sessionId: battleId,
      type: 'mission',
      player: mission.userId,
      playerCard: mission.card,
      enemyCard: enemy,
      missionData: mission,
      currentTurn: 'player',
      round: 1,
      universe: mission.universe.name.toLowerCase().replace(' ', '_')
    });

    // Generate battle image
    const VisualBattleSystem = require('./visual_battle_system.js');
    const visualBattleSystem = new VisualBattleSystem();
    
    const battleInfo = {
      universe: mission.universe.name,
      stage: mission.currentStage,
      round: 1
    };
    
    const battleImage = await visualBattleSystem.generateBattleImage(mission.card, enemy, battleInfo);
    
    // Create rich mission battle embed with story
    const storyText = this.generateMissionStory(mission.universe.name, mission.currentStage, mission.card.name, enemy.name);
    
    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${mission.universe.name} Battle - Stage ${mission.currentStage}`)
      .setDescription(storyText)
      .addFields(
        { 
          name: `🛡️ ${mission.card.name} (Your Card)`, 
          value: `**Level:** ${mission.card.level}\n**HP:** ${mission.card.stats.hp}/${mission.card.stats.maxHp}\n**ATK:** ${mission.card.stats.attack} | **DEF:** ${mission.card.stats.defense}`, 
          inline: true 
        },
        { 
          name: `⚡ ${enemy.name} (Enemy)`, 
          value: `**Level:** ${enemy.level}\n**HP:** ${enemy.stats.hp}/${enemy.stats.maxHp}\n**ATK:** ${enemy.stats.attack} | **DEF:** ${enemy.stats.defense}`, 
          inline: true 
        },
        { 
          name: '🎯 Mission Progress', 
          value: `**Stage:** ${mission.currentStage}/${mission.totalStages}\n**Difficulty:** ${mission.difficulty}\n**Rewards:** ${mission.rewards.currency} 🔥 + ${mission.rewards.xp} XP`, 
          inline: false 
        }
      )
      .setColor('#000000')
      .setFooter({ text: 'Choose your battle action! No healing between stages.' });
    
    // Add battle image if generated
    if (battleImage) {
      const attachment = new (require('discord.js')).AttachmentBuilder(battleImage, { name: 'battle.png' });
      embed.setImage('attachment://battle.png');
      
      const battleButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_${battleId}_punch`)
          .setLabel('👊 Punch')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`battle_${battleId}_block`)
          .setLabel('🛡️ Block')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`battle_${battleId}_dodge`)
          .setLabel('💨 Dodge')
          .setStyle(ButtonStyle.Success)
      );
      
      return interaction.update({ 
        embeds: [embed], 
        files: [attachment], 
        components: [battleButtons] 
      });
    } else {
      const battleButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_${battleId}_punch`)
          .setLabel('👊 Punch')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`battle_${battleId}_block`)
          .setLabel('🛡️ Block')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`battle_${battleId}_dodge`)
          .setLabel('💨 Dodge')
          .setStyle(ButtonStyle.Success)
      );
      
      return interaction.update({ 
        embeds: [embed], 
        components: [battleButtons] 
      });
    }
  }

  generateMissionStory(universe, stage, playerName, enemyName) {
    const stories = {
      'Naruto': [
        `🍃 **Hidden Leaf Village** - ${playerName} encounters ${enemyName} during a stealth mission! The enemy has spotted you - prepare for combat!`,
        `🌪️ **Forest of Death** - ${playerName} faces ${enemyName} in the dangerous training grounds! This battle will test your ninja skills!`,
        `🏔️ **Valley of the End** - The final confrontation! ${playerName} must defeat ${enemyName} to complete the mission!`
      ],
      'One Piece': [
        `🏴‍☠️ **Grand Line Adventure** - ${playerName} encounters the fearsome ${enemyName} while searching for treasure!`,
        `🌊 **Stormy Seas Battle** - ${playerName} faces ${enemyName} aboard a pirate ship during a fierce sea battle!`,
        `🏝️ **Final Island Showdown** - ${playerName} confronts ${enemyName} in the ultimate pirate duel for the treasure!`
      ],
      'My Hero Academia': [
        `🏢 **Hero Training** - ${playerName} faces ${enemyName} during intense hero training exercises!`,
        `🏙️ **City Patrol** - ${playerName} encounters the villain ${enemyName} while protecting civilians!`,
        `⚡ **Final Exam Battle** - ${playerName} must defeat ${enemyName} to prove their worth as a hero!`
      ],
      'Attack on Titan': [
        `🏰 **Wall Defense** - ${playerName} encounters ${enemyName} during the defense of the walls!`,
        `🌲 **Expedition Battle** - ${playerName} faces ${enemyName} during a dangerous expedition outside the walls!`,
        `⚔️ **Final Confrontation** - ${playerName} must defeat ${enemyName} to save humanity!`
      ],
      'Dragon Ball': [
        `🌍 **Earth Defense** - ${playerName} encounters ${enemyName} threatening the planet!`,
        `🥊 **Tournament Fight** - ${playerName} faces ${enemyName} in an epic martial arts tournament!`,
        `💫 **Final Battle** - ${playerName} confronts ${enemyName} in a battle that will shake the universe!`
      ],
      'Jujutsu Kaisen': [
        `👹 **Curse Investigation** - ${playerName} encounters the cursed ${enemyName} during a dangerous investigation!`,
        `🏫 **School Defense** - ${playerName} faces ${enemyName} while protecting the jujutsu school!`,
        `⚡ **Final Exorcism** - ${playerName} must defeat ${enemyName} to complete the ultimate curse exorcism!`
      ],
      'Bleach': [
        `⚔️ **Soul Society** - ${playerName} encounters ${enemyName} in the spiritual realm!`,
        `🌙 **Hollow Hunt** - ${playerName} faces ${enemyName} during a dangerous hollow extermination!`,
        `✨ **Final Bankai** - ${playerName} unleashes their ultimate power against ${enemyName}!`
      ]
    };
    
    const universeStories = stories[universe] || stories['Naruto'];
    return universeStories[Math.min(stage - 1, universeStories.length - 1)];
  }

  generateMissionEnemy(universe, stage) {
    const enemyName = universe.enemies[Math.floor(Math.random() * universe.enemies.length)];
    const baseHp = 80 + (stage * 20); // Increase HP per stage
    const baseAttack = 40 + (stage * 10); // Increase attack per stage
    
    // Try to find the character in our expanded database
    let characterImage = null;
    try {
      const fs = require('fs');
      const cacheData = fs.readFileSync('./anilist_characters_cache.json', 'utf8');
      const cache = JSON.parse(cacheData);
      const foundCharacter = cache.characters.find(char => 
        char.name.toLowerCase().includes(enemyName.toLowerCase()) ||
        enemyName.toLowerCase().includes(char.name.toLowerCase())
      );
      
      if (foundCharacter) {
        characterImage = foundCharacter.image;
      }
    } catch (error) {
      console.log('Could not load character cache for enemy image');
    }
    
    return {
      name: enemyName,
      image: characterImage,
      imageUrl: characterImage || `https://via.placeholder.com/400x600/333333/ffffff?text=${encodeURIComponent(enemyName)}`,
      level: Math.max(1, stage * 5),
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAttack,
      defense: 30 + (stage * 5),
      speed: 50 + (stage * 10),
      stats: {
        hp: baseHp,
        maxHp: baseHp,
        attack: baseAttack,
        defense: 30 + (stage * 5),
        speed: 50 + (stage * 10)
      },
      universe: universe.name,
      isEnemy: true,
      isMissionEnemy: true
    };
  }

  // Complete a mission stage
  async completeMissionStage(userId) {
    const mission = this.activeMissions.get(userId);
    if (!mission) return null;

    mission.currentStage++;
    
    if (mission.currentStage > mission.totalStages) {
      // Mission completed!
      this.activeMissions.delete(userId);
      mission.completed = true;
      
      // Award rewards
      const Player = require('./index.js').Player;
      const player = await Player.findOne({ userId: userId });
      if (player) {
        player.oniFlames += mission.rewards.currency;
        await player.save();
      }
      
      // Award XP to card
      if (mission.card) {
        mission.card.xp += mission.rewards.xp;
        await mission.card.save();
      }
      
      return { type: 'completed', mission: mission };
    } else {
      return { type: 'nextStage', mission: mission };
    }
  }

  // Get active mission for a user
  getActiveMission(userId) {
    const mission = this.activeMissions.get(userId);
    if (mission && Date.now() - mission.startTime > this.missionTimeout) {
      this.activeMissions.delete(userId);
      return null;
    }
    return mission;
  }

  // Clean up expired missions
  cleanupExpiredMissions() {
    const now = Date.now();
    for (const [userId, mission] of this.activeMissions.entries()) {
      if (now - mission.startTime > this.missionTimeout) {
        this.activeMissions.delete(userId);
      }
    }
  }
}

module.exports = InteractiveMissionSystemV2;