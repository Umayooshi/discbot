const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

class CleanMissionSystem {
  constructor() {
    this.universes = {
      'Naruto': {
        name: 'Naruto',
        background: './attached_assets/battle_1753038247270.webp',
        color: '#FF6B00',
        enemies: {
          easy: ['Rogue Ninja', 'Bandit Leader', 'Missing-nin'],
          medium: ['Akatsuki Member', 'Sound Four Ninja', 'Chunin Exam Proctor'],
          hard: ['Legendary Sannin', 'Tailed Beast', 'Otsutsuki Clan Member']
        }
      },
      'One Piece': {
        name: 'One Piece',
        background: 'https://i.imgur.com/kVNpGdj.jpeg',
        color: '#1E90FF',
        enemies: {
          easy: ['Marine Soldier', 'Pirate Rookie', 'Bounty Hunter'],
          medium: ['Shichibukai', 'Marine Captain', 'Supernova'],
          hard: ['Admiral', 'Yonko Commander', 'Revolutionary Army Leader']
        }
      },
      'Bleach': {
        name: 'Bleach',
        background: 'https://i.imgur.com/h7AjVfn.png',
        color: '#4B0082',
        enemies: {
          easy: ['Hollow', 'Soul Reaper', 'Quincy Initiate'],
          medium: ['Espada', 'Captain', 'Fullbringer'],
          hard: ['Soul King Guard', 'Quincy Elite', 'Transcendent Being']
        }
      },
      'Jujutsu Kaisen': {
        name: 'Jujutsu Kaisen',
        background: 'https://i.imgur.com/YbQo4mV.png',
        color: '#8B0000',
        enemies: {
          easy: ['Cursed Spirit', 'Grade 3 Sorcerer', 'Curse User'],
          medium: ['Special Grade Spirit', 'Grade 1 Sorcerer', 'Death Painting'],
          hard: ['King of Curses', 'Six Eyes User', 'Disaster Curse']
        }
      },
      'Attack on Titan': {
        name: 'Attack on Titan',
        background: 'https://i.imgur.com/e5T9mkg.jpeg',
        color: '#A0522D',
        enemies: {
          easy: ['Pure Titan', 'Garrison Soldier', 'Military Police'],
          medium: ['Abnormal Titan', 'Survey Corps Elite', 'Warrior Candidate'],
          hard: ['Nine Titans', 'Ackerman', 'Founding Titan']
        }
      },
      'Dragon Ball': {
        name: 'Dragon Ball',
        background: 'https://i.imgur.com/rBdbyhl.jpeg',
        color: '#FFD700',
        enemies: {
          easy: ['Saibamen', 'Red Ribbon Soldier', 'Tournament Fighter'],
          medium: ['Ginyu Force', 'Android', 'Frieza Force Elite'],
          hard: ['God of Destruction', 'Angel', 'Ultra Instinct Master']
        }
      },
      'My Hero Academia': {
        name: 'My Hero Academia',
        background: 'https://i.imgur.com/Oyftwzy.png',
        color: '#32CD32',
        enemies: {
          easy: ['Villain Thug', 'Pro Hero Sidekick', 'UA Student'],
          medium: ['League of Villains', 'Pro Hero', 'Nomu'],
          hard: ['All For One', 'One For All User', 'High-End Nomu']
        }
      }
    };

    this.activeMissions = new Map();
    this.battleSessions = new Map();
  }

  // Create a new mission with proper card stats and enemies
  createMission(playerCard, difficulty) {
    // Import class system for proper stats
    const classSystem = require('./classSystem');
    
    // Ensure player card has proper stats
    if (!playerCard.stats || playerCard.stats.attack < 100) {
      const baseStats = classSystem.getBaseStats(playerCard.class);
      
      playerCard.stats = {
        hp: baseStats.hp + (playerCard.level - 1) * classSystem.getStatGrowth(playerCard.class).hp,
        maxHp: baseStats.hp + (playerCard.level - 1) * classSystem.getStatGrowth(playerCard.class).hp,
        attack: baseStats.attack + (playerCard.level - 1) * classSystem.getStatGrowth(playerCard.class).attack,
        defense: baseStats.defense + (playerCard.level - 1) * classSystem.getStatGrowth(playerCard.class).defense,
        speed: baseStats.speed + (playerCard.level - 1) * classSystem.getStatGrowth(playerCard.class).speed
      };
      
      playerCard.currentHp = playerCard.stats.hp;
    }

    // Select random universe
    const universes = Object.keys(this.universes);
    const selectedUniverse = universes[Math.floor(Math.random() * universes.length)];
    const universeData = this.universes[selectedUniverse];

    // Determine stages based on difficulty
    const stageCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

    // Create enemies for each stage with proper stats
    const enemies = [];
    for (let i = 0; i < stageCount; i++) {
      const enemyNames = universeData.enemies[difficulty];
      const enemyName = enemyNames[Math.floor(Math.random() * enemyNames.length)];
      
      // Create enemy with proper class-based stats
      const enemyClass = ['Tank', 'Damage', 'Support', 'Intel'][Math.floor(Math.random() * 4)];
      const enemyBaseStats = classSystem.getBaseStats(enemyClass);
      const enemyLevel = playerCard.level + (difficulty === 'easy' ? 0 : difficulty === 'medium' ? 2 : 5);
      
      const enemy = {
        name: enemyName,
        level: enemyLevel,
        class: enemyClass,
        stats: {
          hp: enemyBaseStats.hp + (enemyLevel - 1) * classSystem.getStatGrowth(enemyClass).hp,
          maxHp: enemyBaseStats.hp + (enemyLevel - 1) * classSystem.getStatGrowth(enemyClass).hp,
          attack: enemyBaseStats.attack + (enemyLevel - 1) * classSystem.getStatGrowth(enemyClass).attack,
          defense: enemyBaseStats.defense + (enemyLevel - 1) * classSystem.getStatGrowth(enemyClass).defense,
          speed: enemyBaseStats.speed + (enemyLevel - 1) * classSystem.getStatGrowth(enemyClass).speed
        },
        imageUrl: `https://via.placeholder.com/150x200/2c3e50/ffffff?text=${encodeURIComponent(enemyName.replace(/\s+/g, '+'))}`
      };
      
      enemy.currentHp = enemy.stats.hp;
      enemies.push(enemy);
    }

    // Create mission object
    const mission = {
      id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerCard: playerCard,
      universe: selectedUniverse,
      difficulty: difficulty,
      currentStage: 1,
      totalStages: stageCount,
      enemies: enemies,
      storyline: this.generateStoryline(selectedUniverse, difficulty, playerCard.name),
      rewards: this.calculateRewards(difficulty)
    };

    return mission;
  }

  // Start the automated mission battle
  async startMissionBattle(interaction, mission) {
    // Store mission in active missions
    this.activeMissions.set(mission.id, mission);
    
    const currentEnemy = mission.enemies[mission.currentStage - 1];
    const universeData = this.universes[mission.universe];
    
    // Create initial battle embed
    const battleEmbed = new EmbedBuilder()
      .setTitle(`⚔️ ${mission.universe} Universe Battle - Round 1`)
      .setDescription(`**Stage ${mission.currentStage}**\n\n${mission.storyline}\n\nBoth fighters study each other carefully...`)
      .addFields([
        {
          name: `🛡️ ${mission.playerCard.name} (Your Card)`,
          value: `**Level:** ${mission.playerCard.level}\n**HP:** 🟥${'🟥'.repeat(Math.floor(mission.playerCard.currentHp / mission.playerCard.stats.maxHp * 10))}${'⬜'.repeat(10 - Math.floor(mission.playerCard.currentHp / mission.playerCard.stats.maxHp * 10))} ${mission.playerCard.currentHp}/${mission.playerCard.stats.maxHp}\n**Last Action:** 🏁 READY`,
          inline: false
        },
        {
          name: `⚡ ${currentEnemy.name} (Enemy)`,
          value: `**Level:** ${currentEnemy.level}\n**HP:** 🟥${'🟥'.repeat(Math.floor(currentEnemy.currentHp / currentEnemy.stats.maxHp * 10))}${'⬜'.repeat(10 - Math.floor(currentEnemy.currentHp / currentEnemy.stats.maxHp * 10))} ${currentEnemy.currentHp}/${currentEnemy.stats.maxHp}\n**Last Action:** 🛡️ READY`,
          inline: false
        },
        {
          name: '🎲 Battle Progress',
          value: `**Round 1:** 👊 vs 🛡️ - Status: Battle continues...`,
          inline: false
        }
      ])
      .setColor(universeData.color)
      .setFooter({ text: `Clean Mission System • Round 1 • ${mission.universe} Universe` });

    // Generate battle image if available
    let battleAttachment = null;
    try {
      battleAttachment = await this.generateBattleImage(mission.playerCard, currentEnemy, mission.universe, 1);
    } catch (error) {
      console.error('Failed to generate battle image:', error);
    }

    const editData = { embeds: [battleEmbed] };
    if (battleAttachment) {
      editData.files = [battleAttachment];
    }

    await interaction.editReply(editData);

    // Start automated battle loop
    await this.runAutomatedBattle(interaction, mission);
  }

  // Run automated battle with 2.5 second delays
  async runAutomatedBattle(interaction, mission) {
    const currentEnemy = mission.enemies[mission.currentStage - 1];
    const universeData = this.universes[mission.universe];
    let round = 1;

    while (mission.playerCard.currentHp > 0 && currentEnemy.currentHp > 0 && round <= 20) {
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 second delay

      // Determine actions (random for automated battle)
      const playerAction = ['punch', 'block', 'dodge'][Math.floor(Math.random() * 3)];
      const enemyAction = ['punch', 'block', 'dodge'][Math.floor(Math.random() * 3)];
      
      // Calculate damage using proper combat mechanics
      const battleResult = this.calculateCombatResult(
        mission.playerCard, currentEnemy, playerAction, enemyAction
      );

      // Apply damage
      mission.playerCard.currentHp = Math.max(0, mission.playerCard.currentHp - battleResult.playerDamage);
      currentEnemy.currentHp = Math.max(0, currentEnemy.currentHp - battleResult.enemyDamage);

      round++;

      // Create round summary
      const roundSummary = `**Round ${round - 1}:** ${this.getActionEmoji(playerAction)} vs ${this.getActionEmoji(enemyAction)} - ${battleResult.description}`;

      // Update battle embed
      const battleEmbed = new EmbedBuilder()
        .setTitle(`⚔️ ${mission.universe} Universe Battle - Round ${round - 1}`)
        .setDescription(`**Stage ${mission.currentStage}**\n\n${battleResult.narration}`)
        .addFields([
          {
            name: `🛡️ ${mission.playerCard.name} (Your Card)`,
            value: `**Level:** ${mission.playerCard.level}\n**HP:** 🟥${'🟥'.repeat(Math.floor(mission.playerCard.currentHp / mission.playerCard.stats.maxHp * 10))}${'⬜'.repeat(10 - Math.floor(mission.playerCard.currentHp / mission.playerCard.stats.maxHp * 10))} ${mission.playerCard.currentHp}/${mission.playerCard.stats.maxHp}\n**Last Action:** ${this.getActionEmoji(playerAction)} ${playerAction.toUpperCase()}`,
            inline: false
          },
          {
            name: `⚡ ${currentEnemy.name} (Enemy)`,
            value: `**Level:** ${currentEnemy.level}\n**HP:** 🟥${'🟥'.repeat(Math.floor(currentEnemy.currentHp / currentEnemy.stats.maxHp * 10))}${'⬜'.repeat(10 - Math.floor(currentEnemy.currentHp / currentEnemy.stats.maxHp * 10))} ${currentEnemy.currentHp}/${currentEnemy.stats.maxHp}\n**Last Action:** ${this.getActionEmoji(enemyAction)} ${enemyAction.toUpperCase()}`,
            inline: false
          },
          {
            name: '🎲 Battle Progress',
            value: roundSummary,
            inline: false
          }
        ])
        .setColor(universeData.color)
        .setFooter({ text: `Clean Mission System • Round ${round - 1} • ${mission.universe} Universe` });

      // Generate battle image
      let battleAttachment = null;
      try {
        battleAttachment = await this.generateBattleImage(mission.playerCard, currentEnemy, mission.universe, round - 1);
      } catch (error) {
        console.error('Failed to generate battle image:', error);
      }

      const editData = { embeds: [battleEmbed] };
      if (battleAttachment) {
        editData.files = [battleAttachment];
      }

      await interaction.editReply(editData);

      // Check for battle end
      if (mission.playerCard.currentHp <= 0 || currentEnemy.currentHp <= 0) {
        break;
      }
    }

    // Handle battle conclusion
    await this.concludeBattle(interaction, mission, currentEnemy);
  }

  // Generate mission with proper storyline
  generateMission(difficulty, universe, playerCard) {
    const universeData = this.universes[universe];
    const enemyPool = universeData.enemies[difficulty];
    const stageCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    
    const mission = {
      id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      universe: universe,
      difficulty: difficulty,
      totalStages: stageCount,
      currentStage: 1,
      playerCard: playerCard,
      enemies: [],
      storyline: this.generateStoryline(universe, difficulty, playerCard.name),
      battleLog: [],
      status: 'active',
      rewards: this.calculateRewards(difficulty)
    };

    // Generate enemies for each stage
    for (let i = 0; i < stageCount; i++) {
      const enemyType = enemyPool[Math.floor(Math.random() * enemyPool.length)];
      const enemy = this.createEnemy(enemyType, universe, i + 1, stageCount);
      mission.enemies.push(enemy);
    }

    return mission;
  }

  // Create balanced enemy based on player's card
  createEnemy(enemyType, universe, stage, totalStages) {
    const baseLevel = 10 + (stage * 5) + (totalStages * 2);
    const statMultiplier = 0.8 + (stage * 0.1) + (totalStages * 0.05);
    
    return {
      name: `${enemyType}`,
      universe: universe,
      level: baseLevel,
      stats: {
        hp: Math.floor(800 * statMultiplier),
        maxHp: Math.floor(800 * statMultiplier),
        attack: Math.floor(120 * statMultiplier),
        defense: Math.floor(80 * statMultiplier),
        speed: Math.floor(60 * statMultiplier)
      },
      currentHp: Math.floor(800 * statMultiplier),
      imageUrl: `https://via.placeholder.com/400x600/333333/ffffff?text=${encodeURIComponent(enemyType)}`,
      isMissionEnemy: true
    };
  }

  // Generate contextual storylines
  generateStoryline(universe, difficulty, playerName) {
    const storylines = {
      'Naruto': {
        easy: `${playerName} has been assigned a C-rank mission to eliminate bandits threatening a village on the outskirts of the Land of Fire.`,
        medium: `${playerName} must infiltrate a secret hideout where rogue ninja are planning an attack on the Hidden Leaf Village.`,
        hard: `${playerName} faces a legendary threat that could destroy the balance of the ninja world. The fate of all shinobi rests in your hands.`
      },
      'One Piece': {
        easy: `${playerName} encounters marine patrol ships while sailing through calm waters. A skirmish is inevitable.`,
        medium: `${playerName} has discovered a treasure map, but powerful pirates and marines both want to claim it first.`,
        hard: `${playerName} must face the Grand Line's most dangerous adversaries in a battle that will determine the future of piracy.`
      },
      'Bleach': {
        easy: `${playerName} is on hollow patrol duty when a spiritual disturbance alerts them to incoming threats.`,
        medium: `${playerName} has been called to investigate unusual spiritual pressure readings in the human world.`,
        hard: `${playerName} must protect the Soul Society from an existential threat that could destroy the balance between worlds.`
      },
      'Jujutsu Kaisen': {
        easy: `${playerName} has been assigned to exorcise cursed spirits that have been terrorizing a local school.`,
        medium: `${playerName} must investigate a special grade curse that has created a dangerous domain expansion.`,
        hard: `${playerName} faces the King of Curses' influence spreading across Japan. Only the strongest can hope to survive.`
      },
      'Attack on Titan': {
        easy: `${playerName} is on wall patrol when titans are spotted approaching the outer districts.`,
        medium: `${playerName} must lead a dangerous expedition beyond the walls to reclaim territory from the titans.`,
        hard: `${playerName} faces the ultimate truth about the titans and must fight for humanity's survival against impossible odds.`
      },
      'Dragon Ball': {
        easy: `${playerName} encounters alien invaders who have landed on Earth seeking the Dragon Balls.`,
        medium: `${playerName} must compete in a universal tournament where only the strongest fighters can participate.`,
        hard: `${playerName} faces cosmic-level threats that could erase entire universes from existence.`
      },
      'My Hero Academia': {
        easy: `${playerName} is on hero patrol when villains attack innocent civilians in the city.`,
        medium: `${playerName} must stop a coordinated villain attack on a major hero agency.`,
        hard: `${playerName} faces the ultimate villain threat that could destroy hero society and plunge the world into chaos.`
      }
    };

    return storylines[universe]?.[difficulty] || `${playerName} embarks on a ${difficulty} mission in the ${universe} universe.`;
  }

  // Calculate mission rewards
  calculateRewards(difficulty) {
    const baseRewards = {
      easy: { lumens: 1000, xp: 500, novaGems: 10 },
      medium: { lumens: 2500, xp: 1200, novaGems: 25 },
      hard: { lumens: 5000, xp: 2500, novaGems: 50 }
    };
    
    return baseRewards[difficulty] || baseRewards.easy;
  }

  // AI decision making with strategic weights (from our existing system)
  getOptimalAIAction(attacker, defender) {
    const attackerHpPercent = attacker.currentHp / (attacker.stats?.maxHp || attacker.stats?.hp || attacker.hp);
    const defenderHpPercent = defender.currentHp / (defender.stats?.maxHp || defender.stats?.hp || defender.hp);
    
    const attackPower = attacker.stats?.attack || attacker.attack;
    const defenderDefense = defender.stats?.defense || defender.defense;
    
    let punchWeight = 40;
    let blockWeight = 30;
    let dodgeWeight = 30;
    
    // Adjust weights based on health and stats
    if (attackerHpPercent < 0.3) {
      blockWeight += 20;
      dodgeWeight += 15;
      punchWeight -= 35;
    } else if (attackerHpPercent > 0.7 && defenderHpPercent < 0.5) {
      punchWeight += 30;
      blockWeight -= 15;
      dodgeWeight -= 15;
    }
    
    if (attackPower > defenderDefense * 1.5) {
      punchWeight += 25;
    }
    
    const totalWeight = punchWeight + blockWeight + dodgeWeight;
    const random = Math.random() * totalWeight;
    
    if (random < punchWeight) return 'punch';
    if (random < punchWeight + blockWeight) return 'block';
    return 'dodge';
  }

  // Combat resolution with our established mechanics
  resolveRound(playerCard, enemyCard, playerAction, enemyAction) {
    let playerDamage = 0;
    let enemyDamage = 0;
    let result = '';
    
    // Calculate base damage values
    const playerBaseDamage = playerCard.stats.attack;
    const enemyBaseDamage = enemyCard.stats.attack;
    
    // Action descriptions
    const actionDescriptions = {
      punch: '👊 delivers a powerful punch',
      block: '🛡️ raises their guard defensively', 
      dodge: '💨 attempts to evade'
    };
    
    if (playerAction === 'punch') {
      if (enemyAction === 'punch') {
        // Both punch - clash, both take damage
        result = `💥 **CLASH!** Both fighters strike simultaneously!`;
        playerDamage = Math.floor(enemyBaseDamage * (0.6 + Math.random() * 0.3));
        enemyDamage = Math.floor(playerBaseDamage * (0.6 + Math.random() * 0.3));
      } else if (enemyAction === 'block') {
        // Punch vs Block - reduced damage to enemy
        result = `🛡️ **BLOCKED!** Attack partially deflected!`;
        enemyDamage = Math.floor(playerBaseDamage * (0.3 + Math.random() * 0.2));
        playerDamage = 0;
      } else if (enemyAction === 'dodge') {
        // Punch vs Dodge - 70% chance to hit for critical
        if (Math.random() > 0.3) {
          result = `🎯 **CRITICAL HIT!** Dodge failed, devastating punch lands!`;
          enemyDamage = Math.floor(playerBaseDamage * (1.2 + Math.random() * 0.3));
          playerDamage = 0;
        } else {
          result = `💨 **DODGED!** Attack completely avoided!`;
          enemyDamage = 0;
          playerDamage = 0;
        }
      }
    } else if (playerAction === 'block') {
      if (enemyAction === 'punch') {
        // Block vs Punch - greatly reduced damage to player
        result = `🛡️ **DEFENDED!** Attack successfully blocked!`;
        playerDamage = Math.floor(enemyBaseDamage * (0.2 + Math.random() * 0.1));
        enemyDamage = 0;
      } else if (enemyAction === 'block') {
        // Both block - stalemate
        result = `⚔️ **STALEMATE!** Both fighters defend cautiously!`;
        playerDamage = 0;
        enemyDamage = 0;
      } else if (enemyAction === 'dodge') {
        // Block vs Dodge - no damage, positioning
        result = `🔄 **REPOSITIONING!** Both fighters maneuver carefully!`;
        playerDamage = 0;
        enemyDamage = 0;
      }
    } else if (playerAction === 'dodge') {
      if (enemyAction === 'punch') {
        // Dodge vs Punch - 30% chance to avoid completely
        if (Math.random() < 0.3) {
          result = `💨 **PERFECT DODGE!** Attack completely avoided!`;
          playerDamage = 0;
          enemyDamage = 0;
        } else {
          result = `👊 **CAUGHT!** Failed to dodge the punch!`;
          playerDamage = Math.floor(enemyBaseDamage * (1.1 + Math.random() * 0.2));
          enemyDamage = 0;
        }
      } else if (enemyAction === 'block') {
        // Dodge vs Block - no damage exchange
        result = `🔄 **CAUTIOUS EXCHANGE!** Both fighters stay defensive!`;
        playerDamage = 0;
        enemyDamage = 0;
      } else if (enemyAction === 'dodge') {
        // Both dodge - no damage
        result = `💨 **DOUBLE EVASION!** Both fighters dance around each other!`;
        playerDamage = 0;
        enemyDamage = 0;
      }
    }
    
    // Apply damage with minimum caps
    playerDamage = Math.max(0, Math.min(playerDamage, 200)); // Cap damage
    enemyDamage = Math.max(0, Math.min(enemyDamage, 200));
    
    return {
      playerDamage,
      enemyDamage,
      result,
      playerAction,
      enemyAction,
      actionDescriptions
    };
  }

  // Generate battle image with cards positioned left/right
  async generateBattleImage(playerCard, enemyCard, universe) {
    try {
      const canvas = createCanvas(800, 500);
      const ctx = canvas.getContext('2d');

      // Load universe background
      const universeData = this.universes[universe];
      try {
        const backgroundImage = await loadImage(universeData.background);
        ctx.drawImage(backgroundImage, 0, 0, 800, 500);
        
        // Add color tint overlay
        ctx.fillStyle = universeData.color + '20';
        ctx.fillRect(0, 0, 800, 500);
      } catch (error) {
        // Fallback gradient background
        const gradient = ctx.createLinearGradient(0, 0, 800, 500);
        gradient.addColorStop(0, universeData.color);
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 500);
      }

      // Generate player card (left side)
      const playerCardImage = await this.generateMiniCard(playerCard, false);
      if (playerCardImage) {
        const playerImg = await loadImage(playerCardImage);
        ctx.drawImage(playerImg, 50, 50, 150, 225);
      }

      // Generate enemy card (right side)
      const enemyCardImage = await this.generateMiniCard(enemyCard, true);
      if (enemyCardImage) {
        const enemyImg = await loadImage(enemyCardImage);
        ctx.drawImage(enemyImg, 600, 50, 150, 225);
      }

      // Draw VS in center
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 5;
      ctx.fillText('VS', 400, 170);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating battle image:', error);
      return null;
    }
  }

  // Generate mini card for battle display
  async generateMiniCard(card, isEnemy = false) {
    try {
      const canvas = createCanvas(150, 225);
      const ctx = canvas.getContext('2d');

      // Card background
      const gradient = ctx.createLinearGradient(0, 0, 150, 225);
      gradient.addColorStop(0, isEnemy ? '#8B0000' : '#4A90E2');
      gradient.addColorStop(1, isEnemy ? '#2C0000' : '#1A4480');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 150, 225);

      // Card border
      ctx.strokeStyle = isEnemy ? '#FF0000' : '#00BFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 150, 225);

      // Character image
      if (card.imageUrl || card.image) {
        try {
          const charImage = await loadImage(card.imageUrl || card.image);
          ctx.save();
          ctx.beginPath();
          ctx.rect(10, 10, 130, 150);
          ctx.clip();
          ctx.drawImage(charImage, 10, 10, 130, 150);
          ctx.restore();
        } catch (error) {
          // Placeholder if image fails
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('No Image', 75, 85);
        }
      }

      // Card name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      const cardName = (card.name || 'Unknown').substring(0, 15);
      ctx.strokeText(cardName, 75, 180);
      ctx.fillText(cardName, 75, 180);

      // Level and HP
      ctx.font = '10px Arial';
      ctx.fillText(`Lv.${card.level || 1}`, 75, 195);
      ctx.fillText(`${card.currentHp || card.stats?.hp || 100}/${card.stats?.maxHp || card.stats?.hp || 100} HP`, 75, 210);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating mini card:', error);
      return null;
    }
  }

  // Start an automated mission battle
  async startMissionBattle(interaction, mission) {
    const currentEnemy = mission.enemies[mission.currentStage - 1];
    let round = 1;
    const battleLog = [];

    // Create initial battle embed with background image
    const battleImage = await this.generateBattleImage(mission.playerCard, currentEnemy, mission.universe);
    
    const initialEmbed = new EmbedBuilder()
      .setTitle(`⚔️ ${mission.universe} Battle - Stage ${mission.currentStage}/${mission.totalStages}`)
      .setDescription(`${mission.storyline}\n\n**${currentEnemy.name}** appears before you!`)
      .addFields([
        {
          name: `🛡️ ${mission.playerCard.name}`,
          value: `**HP:** ${mission.playerCard.currentHp}/${mission.playerCard.stats.maxHp}\n**ATK:** ${mission.playerCard.stats.attack} | **DEF:** ${mission.playerCard.stats.defense}`,
          inline: true
        },
        {
          name: `⚡ ${currentEnemy.name}`,
          value: `**HP:** ${currentEnemy.currentHp}/${currentEnemy.stats.maxHp}\n**ATK:** ${currentEnemy.stats.attack} | **DEF:** ${currentEnemy.stats.defense}`,
          inline: true
        },
        {
          name: '📊 Battle Log',
          value: '*Battle commencing... AI analyzing strategies...*',
          inline: false
        }
      ])
      .setColor('#FF6B35')
      .setFooter({ text: `Round ${round} • ${mission.universe} Universe • Automated Battle` });

    if (battleImage) {
      const attachment = new AttachmentBuilder(battleImage, { name: 'battle.png' });
      initialEmbed.setImage('attachment://battle.png');
      await interaction.update({ embeds: [initialEmbed], files: [attachment], components: [] });
    } else {
      await interaction.update({ embeds: [initialEmbed], components: [] });
    }

    // Start automated battle progression
    const progressBattle = async () => {
      while (mission.playerCard.currentHp > 0 && currentEnemy.currentHp > 0 && round <= 20) {
        await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 second delay between rounds

        // AI chooses actions for both
        const playerAction = this.getOptimalAIAction(mission.playerCard, currentEnemy);
        const enemyAction = this.getOptimalAIAction(currentEnemy, mission.playerCard);

        // Resolve the round
        const roundResult = this.resolveRound(mission.playerCard, currentEnemy, playerAction, enemyAction);

        // Apply damage
        mission.playerCard.currentHp = Math.max(0, mission.playerCard.currentHp - roundResult.playerDamage);
        currentEnemy.currentHp = Math.max(0, currentEnemy.currentHp - roundResult.enemyDamage);

        // Add to battle log
        const logEntry = `**Round ${round}:** ${mission.playerCard.name} ${roundResult.actionDescriptions[playerAction]} while ${currentEnemy.name} ${roundResult.actionDescriptions[enemyAction]}. ${roundResult.result}`;
        battleLog.push(logEntry);

        // Keep only last 4 log entries
        if (battleLog.length > 4) battleLog.shift();

        // Create health bars
        const createHealthBar = (current, max) => {
          const percentage = Math.max(0, Math.min(100, (current / max) * 100));
          const filledBars = Math.floor(percentage / 10);
          const emptyBars = 10 - filledBars;
          return '🟥'.repeat(filledBars) + '⬜'.repeat(emptyBars);
        };

        // Update embed
        const updateEmbed = new EmbedBuilder()
          .setTitle(`⚔️ ${mission.universe} Battle - Stage ${mission.currentStage}/${mission.totalStages}`)
          .setDescription(`${mission.storyline}\n\n**${currentEnemy.name}** fights with determination!`)
          .addFields([
            {
              name: `🛡️ ${mission.playerCard.name}`,
              value: `**HP:** ${createHealthBar(mission.playerCard.currentHp, mission.playerCard.stats.maxHp)} ${mission.playerCard.currentHp}/${mission.playerCard.stats.maxHp}\n**Last Action:** ${roundResult.actionDescriptions[playerAction]}`,
              inline: true
            },
            {
              name: `⚡ ${currentEnemy.name}`,
              value: `**HP:** ${createHealthBar(currentEnemy.currentHp, currentEnemy.stats.maxHp)} ${currentEnemy.currentHp}/${currentEnemy.stats.maxHp}\n**Last Action:** ${roundResult.actionDescriptions[enemyAction]}`,
              inline: true
            },
            {
              name: '📊 Battle Log',
              value: battleLog.join('\n') || '*No actions yet...*',
              inline: false
            }
          ])
          .setColor('#FF6B35')
          .setFooter({ text: `Round ${round} • ${mission.universe} Universe • Automated Battle` });

        if (battleImage) {
          updateEmbed.setImage('attachment://battle.png');
          await interaction.editReply({ embeds: [updateEmbed] });
        } else {
          await interaction.editReply({ embeds: [updateEmbed] });
        }

        round++;

        // Check for battle end
        if (mission.playerCard.currentHp <= 0 || currentEnemy.currentHp <= 0) {
          break;
        }
      }

      // Battle conclusion
      await this.finalizeBattle(interaction, mission, currentEnemy, battleLog);
    };

    // Start the automated battle
    setTimeout(progressBattle, 3000);
  }

  // Handle battle conclusion and rewards
  async finalizeBattle(interaction, mission, enemy, battleLog) {
    const playerWon = mission.playerCard.currentHp > 0;
    
    if (playerWon) {
      // Player won this stage
      if (mission.currentStage < mission.totalStages) {
        // More stages remaining - offer continue or tap out
        const embed = new EmbedBuilder()
          .setTitle(`🎉 Stage ${mission.currentStage} Complete!`)
          .setDescription(`**Victory!** You defeated ${enemy.name}!\n\n**Your HP:** ${mission.playerCard.currentHp}/${mission.playerCard.stats.maxHp}`)
          .addFields([
            {
              name: '🎯 Mission Progress',
              value: `**Completed:** ${mission.currentStage}/${mission.totalStages} stages\n**Next:** Stage ${mission.currentStage + 1}\n**Remaining HP:** ${mission.playerCard.currentHp}`,
              inline: true
            },
            {
              name: '💰 Current Rewards',
              value: `**Lumens:** ${Math.floor(mission.rewards.lumens * (mission.currentStage / mission.totalStages))}\n**XP:** ${Math.floor(mission.rewards.xp * (mission.currentStage / mission.totalStages))}`,
              inline: true
            }
          ])
          .setColor('#00FF00')
          .setFooter({ text: 'Remember: No healing between stages!' });

        const continueButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`mission_continue_${mission.id}`)
            .setLabel('⚔️ Continue Mission')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`mission_tapout_${mission.id}`)
            .setLabel('🚪 Tap Out (Keep Rewards)')
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.editReply({ embeds: [embed], components: [continueButtons] });
      } else {
        // Mission complete!
        await this.completeMission(interaction, mission);
      }
    } else {
      // Player lost
      const embed = new EmbedBuilder()
        .setTitle(`💀 Mission Failed`)
        .setDescription(`**Defeat!** ${enemy.name} has bested you in combat.\n\nBetter luck next time, warrior.`)
        .addFields([
          {
            name: '📊 Final Battle Log',
            value: battleLog.slice(-3).join('\n') || '*Battle concluded...*',
            inline: false
          }
        ])
        .setColor('#FF0000')
        .setFooter({ text: 'Try again with a stronger card or different strategy!' });

      await interaction.editReply({ embeds: [embed], components: [] });
    }
  }

  // Complete mission and award rewards
  async completeMission(interaction, mission) {
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Mission Complete!`)
      .setDescription(`**Congratulations!** You've successfully completed the ${mission.difficulty} ${mission.universe} mission!`)
      .addFields([
        {
          name: '🎁 Rewards Earned',
          value: `**${mission.rewards.lumens} Lumens**\n**${mission.rewards.xp} XP**\n**${mission.rewards.novaGems} Nova Gems**`,
          inline: true
        },
        {
          name: '📈 Mission Stats',
          value: `**Difficulty:** ${mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}\n**Stages:** ${mission.totalStages}\n**Universe:** ${mission.universe}`,
          inline: true
        }
      ])
      .setColor('#FFD700')
      .setFooter({ text: 'Mission rewards have been added to your account!' });

    await interaction.editReply({ embeds: [embed], components: [] });

    // TODO: Actually award the rewards to player's account
    // This would integrate with the existing player/currency system
  }

  // Calculate combat result using established mechanics
  calculateCombatResult(playerCard, enemy, playerAction, enemyAction) {
    let playerDamage = 0;
    let enemyDamage = 0;
    let description = '';
    let narration = '';

    // Punch vs Block vs Dodge mechanics
    if (playerAction === 'punch' && enemyAction === 'dodge') {
      // Punch beats Dodge
      enemyDamage = Math.floor(playerCard.stats.attack * 0.8 - enemy.stats.defense * 0.3);
      enemyDamage = Math.max(enemyDamage, 50); // Minimum damage
      description = `${playerCard.name} lands a solid punch!`;
      narration = `${playerCard.name} outmaneuvers ${enemy.name}'s dodge and connects with a powerful strike!`;
    } else if (playerAction === 'dodge' && enemyAction === 'block') {
      // Dodge beats Block
      enemyDamage = Math.floor(playerCard.stats.attack * 0.6);
      enemyDamage = Math.max(enemyDamage, 30);
      description = `${playerCard.name} finds an opening!`;
      narration = `${playerCard.name} dances around ${enemy.name}'s guard and strikes from an unexpected angle!`;
    } else if (playerAction === 'block' && enemyAction === 'punch') {
      // Block beats Punch
      playerDamage = Math.floor(enemy.stats.attack * 0.4 - playerCard.stats.defense * 0.5);
      playerDamage = Math.max(playerDamage, 10); // Reduced damage when blocking
      description = `${playerCard.name} blocks but takes some damage!`;
      narration = `${playerCard.name} successfully blocks ${enemy.name}'s attack, reducing the impact significantly!`;
    } else if (enemyAction === 'punch' && playerAction === 'dodge') {
      // Enemy Punch beats Player Dodge
      playerDamage = Math.floor(enemy.stats.attack * 0.8 - playerCard.stats.defense * 0.3);
      playerDamage = Math.max(playerDamage, 50);
      description = `${enemy.name} lands a solid punch!`;
      narration = `${enemy.name} outmaneuvers ${playerCard.name}'s dodge and connects with a powerful strike!`;
    } else if (enemyAction === 'dodge' && playerAction === 'block') {
      // Enemy Dodge beats Player Block
      playerDamage = Math.floor(enemy.stats.attack * 0.6);
      playerDamage = Math.max(playerDamage, 30);
      description = `${enemy.name} finds an opening!`;
      narration = `${enemy.name} dances around ${playerCard.name}'s guard and strikes from an unexpected angle!`;
    } else if (enemyAction === 'block' && playerAction === 'punch') {
      // Enemy Block beats Player Punch
      enemyDamage = Math.floor(playerCard.stats.attack * 0.4 - enemy.stats.defense * 0.5);
      enemyDamage = Math.max(enemyDamage, 10);
      description = `${enemy.name} blocks but takes some damage!`;
      narration = `${enemy.name} successfully blocks ${playerCard.name}'s attack, reducing the impact significantly!`;
    } else {
      // Same actions - mutual damage
      playerDamage = Math.floor(enemy.stats.attack * 0.5);
      enemyDamage = Math.floor(playerCard.stats.attack * 0.5);
      description = `Both fighters clash evenly!`;
      narration = `${playerCard.name} and ${enemy.name} mirror each other's moves, resulting in a mutual exchange!`;
    }

    return {
      playerDamage: Math.max(0, playerDamage),
      enemyDamage: Math.max(0, enemyDamage),
      description,
      narration
    };
  }

  // Get action emoji
  getActionEmoji(action) {
    switch (action) {
      case 'punch': return '👊';
      case 'block': return '🛡️';
      case 'dodge': return '💨';
      default: return '❓';
    }
  }

  // Generate battle image
  async generateBattleImage(playerCard, enemy, universe, round) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Use universe background or solid color
    const universeData = this.universes[universe];
    ctx.fillStyle = universeData.color;
    ctx.fillRect(0, 0, 800, 400);

    // Add battle title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${universe} Universe Battle - Round ${round}`, 400, 50);

    // Add player card info (left side)
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(playerCard.name, 50, 100);
    ctx.font = '14px Arial';
    ctx.fillText(`Level ${playerCard.level}`, 50, 120);
    ctx.fillText(`HP: ${playerCard.currentHp}/${playerCard.stats.maxHp}`, 50, 140);

    // Add enemy info (right side)
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(enemy.name, 750, 100);
    ctx.font = '14px Arial';
    ctx.fillText(`Level ${enemy.level}`, 750, 120);
    ctx.fillText(`HP: ${enemy.currentHp}/${enemy.stats.maxHp}`, 750, 140);

    // Add health bars
    this.drawHealthBar(ctx, 50, 160, 200, 20, playerCard.currentHp, playerCard.stats.maxHp);
    this.drawHealthBar(ctx, 550, 160, 200, 20, enemy.currentHp, enemy.stats.maxHp);

    return new AttachmentBuilder(canvas.toBuffer(), { name: `battle_round_${round}.png` });
  }

  // Draw health bar
  drawHealthBar(ctx, x, y, width, height, currentHp, maxHp) {
    const hpPercentage = currentHp / maxHp;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, width, height);
    
    // Health bar
    ctx.fillStyle = hpPercentage > 0.5 ? '#4CAF50' : hpPercentage > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(x, y, width * hpPercentage, height);
    
    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  }

  // Conclude battle and handle rewards
  async concludeBattle(interaction, mission, enemy) {
    const playerWon = mission.playerCard.currentHp > 0;
    const universeData = this.universes[mission.universe];

    if (playerWon) {
      // Player wins this stage
      const embed = new EmbedBuilder()
        .setTitle(`🎉 Victory in ${mission.universe}!`)
        .setDescription(`${mission.playerCard.name} has defeated ${enemy.name}!\n\nStage ${mission.currentStage}/${mission.totalStages} complete!`)
        .addFields([
          {
            name: '🏆 Rewards Earned',
            value: `**XP:** ${mission.rewards.perStage.xp}\n**Lumens:** ${mission.rewards.perStage.currency}`,
            inline: true
          },
          {
            name: '📊 Final Stats',
            value: `**Your HP:** ${mission.playerCard.currentHp}/${mission.playerCard.stats.maxHp}\n**Enemy HP:** 0/${enemy.stats.maxHp}`,
            inline: true
          }
        ])
        .setColor('#4CAF50')
        .setFooter({ text: `Mission Complete! Clean Mission System` });

      await interaction.editReply({ embeds: [embed], components: [] });

      // Award rewards (implement in future)
      // await this.awardMissionRewards(interaction.user.id, mission.rewards.perStage);

    } else {
      // Player loses
      const embed = new EmbedBuilder()
        .setTitle(`💀 Defeat in ${mission.universe}`)
        .setDescription(`${mission.playerCard.name} has been defeated by ${enemy.name}...\n\nMission failed. Try again with better strategy!`)
        .setColor('#F44336')
        .setFooter({ text: `Mission Failed! Clean Mission System` });

      await interaction.editReply({ embeds: [embed], components: [] });
    }

    // Clean up mission
    this.activeMissions.delete(mission.id);
  }
}

module.exports = new CleanMissionSystem();