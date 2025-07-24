const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');

class ProfessionalBattleSystem {
  constructor() {
    this.activeBattles = new Map();
    
    // Add roundRect method to canvas context after creation
    this.addRoundRectSupport();
  }

  addRoundRectSupport() {
    // This will be called when canvas is created
    const { CanvasRenderingContext2D } = require('canvas');
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
      };
    }
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
      const cardClass = classSystem.assignClass(character.name);
      
      aiTeam.push({
        name: character.name,
        image: character.image || 'https://via.placeholder.com/150x200/4a90e2/ffffff?text=AI',
        class: cardClass,
        series: character.series || 'Unknown',
        cardId: `ai_${character.name}_${Date.now()}_${i}`
      });
    }
    
    return aiTeam;
  }

  // Generate professional battle image with card portraits and enhanced styling
  async generateBattleImage(battleState) {
    const width = 800;
    const height = 700; // Increased for battle logs
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Dark Discord background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2f3136');
    gradient.addColorStop(1, '#23262a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Your Team section with enhanced styling
    ctx.fillStyle = '#43b581';
    ctx.roundRect(20, 20, width - 40, 35, 8);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('🟢 Your Team', 35, 43);

    let yPos = 75;
    for (let i = 0; i < battleState.playerTeam.length; i++) {
      const card = battleState.playerTeam[i];
      await this.drawCard(ctx, card, 30, yPos, true);
      yPos += 90;
    }

    // AI Team section
    yPos += 20;
    ctx.fillStyle = '#f04747';
    ctx.roundRect(20, yPos, width - 40, 35, 8);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('🔴 AI Team', 35, yPos + 23);

    yPos += 50;
    for (let i = 0; i < battleState.aiTeam.length; i++) {
      const card = battleState.aiTeam[i];
      await this.drawCard(ctx, card, 30, yPos, false);
      yPos += 90;
    }

    // Battle Logs section on canvas
    if (battleState.battleLog.length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.roundRect(20, height - 120, width - 40, 100, 8);
      ctx.fill();
      
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('⚔️ Battle Logs', 35, height - 95);
      
      const recentLogs = battleState.battleLog.slice(-4);
      let logY = height - 70;
      
      for (const log of recentLogs) {
        if (log.type === 'damage') {
          ctx.fillStyle = '#ff6b6b';
        } else if (log.type === 'heal') {
          ctx.fillStyle = '#51cf66';
        } else {
          ctx.fillStyle = '#74c0fc';
        }
        
        ctx.font = '13px Arial';
        ctx.fillText(`• ${log.message}`, 35, logY);
        logY += 18;
      }
    }

    return canvas.toBuffer('image/png');
  }

  // Draw individual card with portrait and enhanced HP bar
  async drawCard(ctx, card, x, y, isPlayer) {
    // Card background
    ctx.fillStyle = card.isAlive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 0, 0, 0.2)';
    ctx.roundRect(x, y, 720, 75, 8);
    ctx.fill();

    // Card portrait placeholder (64x64)
    ctx.fillStyle = this.getClassColor(card.class);
    ctx.roundRect(x + 10, y + 5, 64, 64, 8);
    ctx.fill();
    
    // Class icon in portrait
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    const classIcon = this.getClassIcon(card.class);
    ctx.fillText(classIcon, x + 32, y + 42);

    // Card name and class
    ctx.fillStyle = card.isAlive ? 'white' : '#888';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(card.name, x + 85, y + 25);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = this.getClassColor(card.class);
    ctx.fillText(card.class, x + 85, y + 45);

    // Enhanced HP bar with gradient
    const hpPercentage = card.stats.hp / card.stats.maxHp;
    const barWidth = 200;
    const barHeight = 20;
    const barX = x + 85;
    const barY = y + 50;

    // HP bar background
    ctx.fillStyle = '#4f545c';
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fill();

    // HP bar fill with color based on percentage
    const hpGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    if (hpPercentage > 0.6) {
      hpGradient.addColorStop(0, '#51cf66');
      hpGradient.addColorStop(1, '#37b24d');
    } else if (hpPercentage > 0.3) {
      hpGradient.addColorStop(0, '#ffd43b');
      hpGradient.addColorStop(1, '#fab005');
    } else {
      hpGradient.addColorStop(0, '#ff6b6b');
      hpGradient.addColorStop(1, '#e03131');
    }

    ctx.fillStyle = hpGradient;
    ctx.roundRect(barX, barY, barWidth * hpPercentage, barHeight, 10);
    ctx.fill();

    // HP text with shadow
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${card.stats.hp}/${card.stats.maxHp}`, barX + barWidth + 15, barY + 15);
    
    ctx.fillStyle = 'white';
    ctx.fillText(`${card.stats.hp}/${card.stats.maxHp}`, barX + barWidth + 14, barY + 14);

    // Death overlay
    if (!card.isAlive) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.roundRect(x, y, 720, 75, 8);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('💀 DEFEATED', x + 300, y + 42);
    }
  }

  // Get class color for styling
  getClassColor(cardClass) {
    const colors = {
      'Tank': '#4A90E2',
      'Damage': '#E74C3C', 
      'Support': '#2ECC71',
      'Intel': '#9B59B6'
    };
    return colors[cardClass] || '#74c0fc';
  }

  // Get class icon
  getClassIcon(cardClass) {
    const icons = {
      'Tank': '🛡️',
      'Damage': '⚔️',
      'Support': '💚',
      'Intel': '🧠'
    };
    return icons[cardClass] || '⚡';
  }

  // Process battle turn with full combat logic
  async processTurn(battleState) {
    if (battleState.phase === 'ended') return;

    // Get all alive characters and sort by speed (fastest first)
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
        // No targets left, battle ends
        battleState.phase = 'ended';
        battleState.winner = currentCard.team === 'player' ? 'player' : 'ai';
        return;
      }

      // Choose target randomly
      const target = targets[Math.floor(Math.random() * targets.length)];

      // Basic attack for now (can be expanded with abilities)
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

  // End battle and cleanup
  endBattle(userId) {
    this.activeBattles.delete(userId);
  }

  // Create battle embed with image like professional system
  async createBattleEmbed(battleState) {
    const embed = new EmbedBuilder()
      .setTitle('⚔️ 3v3 Battle Arena')
      .setColor('#5865f2');

    // Battle logs section exactly like the professional image
    if (battleState.battleLog.length > 0) {
      const logs = battleState.battleLog.slice(-6).map(log => {
        if (log.type === 'damage') {
          return `🔴 ${log.message}`;
        } else if (log.type === 'heal') {
          return `🟢 ${log.message}`;
        } else {
          return `⚪ ${log.message}`;
        }
      }).join('\n');
      
      embed.addFields([{
        name: '⚔️ Battle Logs',
        value: logs || 'Battle starting...',
        inline: false
      }]);
    }

    embed.setFooter({ text: `Turn ${battleState.turn} • Professional 3v3 Battle System` });
    
    // Generate the professional battle image
    const battleImage = await this.generateBattleImage(battleState);
    const attachment = new AttachmentBuilder(battleImage, { name: 'professional_battle.png' });
    
    return { embed, attachment };
  }

  async processTurn(battleState) {
    if (battleState.phase === 'ended') return battleState;

    // Check win conditions
    const playerAlive = battleState.playerTeam.filter(card => card.isAlive).length;
    const aiAlive = battleState.aiTeam.filter(card => card.isAlive).length;

    if (playerAlive === 0) {
      battleState.phase = 'ended';
      battleState.winner = 'ai';
      return battleState;
    }
    
    if (aiAlive === 0) {
      battleState.phase = 'ended';
      battleState.winner = 'player';
      return battleState;
    }

    // Turn limit check (reduced for 3v3)
    if (battleState.turn > 30) {
      battleState.phase = 'ended';
      battleState.winner = 'draw';
      return battleState;
    }

    // Process combat turn
    await this.executeCombatRound(battleState);
    battleState.turn++;

    return battleState;
  }

  async executeCombatRound(battleState) {
    // Player team attacks
    for (const playerCard of battleState.playerTeam) {
      if (!playerCard.isAlive) continue;
      
      const target = this.selectRandomTarget(battleState.aiTeam);
      if (target) {
        const damage = this.calculateDamage(playerCard, target);
        target.stats.hp = Math.max(0, target.stats.hp - damage);
        
        if (target.stats.hp === 0) {
          target.isAlive = false;
        }
        
        battleState.battleLog.push({
          type: 'damage',
          message: `${playerCard.name} dealt ${damage} damage to ${target.name}`
        });
      }
    }

    // AI team attacks
    for (const aiCard of battleState.aiTeam) {
      if (!aiCard.isAlive) continue;
      
      const target = this.selectRandomTarget(battleState.playerTeam);
      if (target) {
        const damage = this.calculateDamage(aiCard, target);
        target.stats.hp = Math.max(0, target.stats.hp - damage);
        
        if (target.stats.hp === 0) {
          target.isAlive = false;
        }
        
        battleState.battleLog.push({
          type: 'damage',
          message: `${aiCard.name} dealt ${damage} damage to ${target.name}`
        });
      }
    }
  }

  selectRandomTarget(team) {
    const aliveTargets = team.filter(card => card.isAlive);
    if (aliveTargets.length === 0) return null;
    return aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
  }

  calculateDamage(attacker, target) {
    const baseDamage = attacker.stats.attack;
    const defense = target.stats.defense;
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
    
    return Math.floor((baseDamage - defense * 0.3) * randomFactor);
  }

  getBattle(userId) {
    return this.activeBattles.get(userId);
  }

  endBattle(userId) {
    this.activeBattles.delete(userId);
  }
}

module.exports = new ProfessionalBattleSystem();