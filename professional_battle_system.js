const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');

class ProfessionalBattleSystem {
  constructor() {
    this.activeBattles = new Map();
  }

  async startBattle(userId, playerCards) {
    // Only use first 3 cards for 3v3 battles
    const selectedPlayerCards = playerCards.slice(0, 3);
    
    // Create AI team with similar power level
    const aiCards = await this.generateAITeam(selectedPlayerCards);
    
    // Initialize battle state
    const battleState = {
      id: `battle_${userId}_${Date.now()}`,
      userId: userId,
      playerTeam: selectedPlayerCards.map(card => this.initializeCard(card, 'player')),
      aiTeam: aiCards.map(card => this.initializeCard(card, 'ai')),
      turn: 1,
      phase: 'active',
      battleLog: [],
      winner: null
    };
    
    // Store battle
    this.activeBattles.set(userId, battleState);
    
    return battleState;
  }

  initializeCard(card, team) {
    const classStats = this.getClassStats(card.class);
    return {
      name: card.name,
      class: card.class,
      series: card.series,
      cardId: card.cardId,
      team: team,
      isAlive: true,
      stats: {
        hp: classStats.hp,
        maxHp: classStats.hp,
        attack: classStats.attack,
        defense: classStats.defense,
        speed: classStats.speed
      },
      abilityCooldown: 0
    };
  }

  getClassStats(cardClass) {
    const stats = {
      'Tank': { hp: 400, attack: 80, defense: 100, speed: 60 },
      'Damage': { hp: 250, attack: 120, defense: 60, speed: 90 },
      'Support': { hp: 200, attack: 70, defense: 70, speed: 85 },
      'Intel': { hp: 220, attack: 100, defense: 50, speed: 110 }
    };
    return stats[cardClass] || stats['Damage'];
  }

  async generateAITeam(playerCards) {
    const aniListCharacterSystem = require('./anilist_character_system');
    const classSystem = require('./classSystem');
    const aiTeam = [];
    
    // Create AniList system instance
    const aniList = new (require('./anilist_character_system'))();
    
    // Get 3 random characters from AniList
    const characters = await aniList.getRandomCharacters(3);
    
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      const classes = ['Tank', 'Damage', 'Support', 'Intel'];
      const randomClass = classes[Math.floor(Math.random() * classes.length)];
      
      aiTeam.push({
        name: character.name || `AI Character ${i + 1}`,
        class: randomClass,
        series: character.anime || 'Unknown Series',
        cardId: `ai_${Date.now()}_${i}`,
        imageUrl: character.imageUrl || null
      });
    }
    
    return aiTeam;
  }

  // Generate professional battle image using Copilot's approach
  async generateBattleImage(battleState) {
    const canvas = createCanvas(900, 600);
    const ctx = canvas.getContext('2d');

    // Base Discord background
    ctx.fillStyle = '#2f3136';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Sections
    ctx.fillStyle = '#43b581';
    ctx.fillRect(20, 20, 860, 30);
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('🟢 Your Team', 40, 42);

    ctx.fillStyle = '#f04747';
    ctx.fillRect(20, 300, 860, 30);
    ctx.fillStyle = 'white';
    ctx.fillText('🔴 Enemy Team', 40, 322);

    // Card rendering function
    const drawCard = async (card, x, y) => {
      // Portrait placeholder (class colored)
      ctx.fillStyle = this.getClassColor(card.class);
      ctx.fillRect(x, y, 64, 64);
      
      // Class icon in portrait
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(this.getClassIcon(card.class), x + 24, y + 38);

      // HP Bar background
      ctx.fillStyle = '#4f545c';
      ctx.fillRect(x + 70, y + 10, 200, 20);

      // HP Fill with color based on percentage
      const pct = Math.max(0, card.stats.hp / card.stats.maxHp);
      ctx.fillStyle = pct > 0.5 ? '#3ba55d' : pct > 0.25 ? '#faa61a' : '#f04747';
      ctx.fillRect(x + 70, y + 10, 200 * pct, 20);

      // Name & Class
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(`${card.name} - ${card.class}`, x + 70, y + 40);
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`HP: ${card.stats.hp}/${card.stats.maxHp}`, x + 70, y + 60);

      // Death overlay
      if (!card.isAlive) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(x, y, 270, 64);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('💀 DEFEATED', x + 280, y + 38);
      }
    };

    // Render Player Team
    for (let i = 0; i < battleState.playerTeam.length; i++) {
      const y = 70 + i * 80;
      await drawCard(battleState.playerTeam[i], 40, y);
    }

    // Render AI Team
    for (let i = 0; i < battleState.aiTeam.length; i++) {
      const y = 350 + i * 80;
      await drawCard(battleState.aiTeam[i], 40, y);
    }

    // Battle Logs
    if (battleState.battleLog.length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(20, 540, 860, 50);
      
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('⚔️ Battle Logs', 40, 560);
      
      const recentLogs = battleState.battleLog.slice(-2);
      let logX = 200;
      
      for (const log of recentLogs) {
        if (log.type === 'damage') {
          ctx.fillStyle = '#ff6b6b';
        } else if (log.type === 'heal') {
          ctx.fillStyle = '#51cf66';
        } else {
          ctx.fillStyle = '#74c0fc';
        }
        
        ctx.font = '12px Arial';
        ctx.fillText(`• ${log.message}`, logX, 575);
        logX += 300;
      }
    }

    return canvas.toBuffer('image/png');
  }



  getClassColor(cardClass) {
    const colors = {
      'Tank': '#4A90E2',
      'Damage': '#E74C3C', 
      'Support': '#2ECC71',
      'Intel': '#9B59B6'
    };
    return colors[cardClass] || '#74c0fc';
  }

  getClassIcon(cardClass) {
    const icons = {
      'Tank': '🛡️',
      'Damage': '⚔️',
      'Support': '💚',
      'Intel': '🧠'
    };
    return icons[cardClass] || '⚡';
  }

  // Process battle turn with combat logic
  async processTurn(battleState) {
    if (battleState.phase === 'ended') return;

    // Get all alive characters sorted by speed
    const allCharacters = [...battleState.playerTeam, ...battleState.aiTeam]
      .filter(card => card.isAlive)
      .sort((a, b) => b.stats.speed - a.stats.speed);

    if (allCharacters.length === 0) {
      battleState.phase = 'ended';
      battleState.winner = 'draw';
      return;
    }

    // Process each character's turn
    for (const currentCard of allCharacters) {
      if (!currentCard.isAlive) continue;

      // Reduce ability cooldown
      if (currentCard.abilityCooldown > 0) {
        currentCard.abilityCooldown--;
      }

      // Get targets (opposite team)
      const targets = currentCard.team === 'player' ? 
        battleState.aiTeam.filter(card => card.isAlive) : 
        battleState.playerTeam.filter(card => card.isAlive);

      if (targets.length === 0) {
        battleState.phase = 'ended';
        battleState.winner = currentCard.team === 'player' ? 'player' : 'ai';
        return;
      }

      // Choose random target
      const target = targets[Math.floor(Math.random() * targets.length)];

      // Calculate damage
      const damage = Math.max(1, currentCard.stats.attack - target.stats.defense + Math.random() * 20);
      target.stats.hp = Math.max(0, target.stats.hp - damage);

      // Log the action
      battleState.battleLog.push({
        type: 'damage',
        message: `${currentCard.name} deals ${Math.floor(damage)} damage to ${target.name}`
      });

      // Check if target dies
      if (target.stats.hp <= 0) {
        target.isAlive = false;
        battleState.battleLog.push({
          type: 'death',
          message: `${target.name} has been defeated!`
        });
      }
    }

    // Check win conditions
    const playerAlive = battleState.playerTeam.some(card => card.isAlive);
    const aiAlive = battleState.aiTeam.some(card => card.isAlive);

    if (!playerAlive && !aiAlive) {
      battleState.phase = 'ended';
      battleState.winner = 'draw';
    } else if (!playerAlive) {
      battleState.phase = 'ended';
      battleState.winner = 'ai';
    } else if (!aiAlive) {
      battleState.phase = 'ended';
      battleState.winner = 'player';
    }

    battleState.turn++;
  }

  // Create battle embed with Professional Battle Interface
  async createBattleEmbed(battleState) {
    const ProfessionalBattleInterface = require('./professional_battle_interface.js');
    const battleInterface = new ProfessionalBattleInterface();
    
    return await battleInterface.createBattleEmbed(battleState);
  }

  // End battle cleanup
  endBattle(userId) {
    this.activeBattles.delete(userId);
  }
}

module.exports = new ProfessionalBattleSystem();