const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

class AIBattleSystem {
  constructor() {
    this.activeBattles = new Map();
    this.battleUpdateInterval = 2000; // 2 seconds between actions
  }

  // Start an AI-optimized automatic battle
  async startAutoBattle(interaction, playerCard, enemyCard, battleType = 'mission', missionData = null) {
    const battleId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create battle state
    const battleState = {
      battleId,
      playerCard: { ...playerCard.toObject(), currentHp: playerCard.stats.hp },
      enemyCard: { ...enemyCard, currentHp: enemyCard.stats ? enemyCard.stats.hp : enemyCard.hp },
      battleLog: [],
      round: 1,
      status: 'active',
      battleType,
      missionData,
      startTime: Date.now()
    };
    
    this.activeBattles.set(battleId, battleState);
    
    // Create initial battle embed
    const initialEmbed = await this.createBattleEmbed(battleState);
    const battleImage = await this.generateBattleImage(battleState);
    
    const attachment = new AttachmentBuilder(battleImage, { name: 'battle.png' });
    
    await interaction.update({
      embeds: [initialEmbed],
      files: [attachment],
      components: [this.createBattleControls(battleId)]
    });
    
    // Start the automatic battle loop
    this.runAutoBattle(interaction, battleId);
    
    return battleId;
  }
  
  // AI-optimized battle logic
  async runAutoBattle(interaction, battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle || battle.status !== 'active') return;
    
    setTimeout(async () => {
      try {
        // AI decision making for both player and enemy
        const playerAction = this.getOptimalAction(battle.playerCard, battle.enemyCard, 'player');
        const enemyAction = this.getOptimalAction(battle.enemyCard, battle.playerCard, 'enemy');
        
        // Resolve combat round
        const roundResult = this.resolveCombatRound(battle, playerAction, enemyAction);
        
        // Update battle log
        battle.battleLog.push({
          round: battle.round,
          playerAction,
          enemyAction,
          result: roundResult,
          timestamp: Date.now()
        });
        
        battle.round++;
        
        // Check for battle end
        if (battle.playerCard.currentHp <= 0 || battle.enemyCard.currentHp <= 0) {
          await this.endBattle(interaction, battleId);
          return;
        }
        
        // Update battle display
        const updatedEmbed = await this.createBattleEmbed(battle);
        const updatedImage = await this.generateBattleImage(battle);
        const attachment = new AttachmentBuilder(updatedImage, { name: 'battle.png' });
        
        await interaction.editReply({
          embeds: [updatedEmbed],
          files: [attachment],
          components: [this.createBattleControls(battleId)]
        });
        
        // Continue battle if still active
        if (battle.status === 'active') {
          this.runAutoBattle(interaction, battleId);
        }
        
      } catch (error) {
        console.error('Error in auto battle:', error);
        battle.status = 'error';
      }
    }, this.battleUpdateInterval);
  }
  
  // AI decision making system
  getOptimalAction(attacker, defender, role) {
    const attackerHpPercentage = attacker.currentHp / (attacker.stats?.maxHp || attacker.maxHp || attacker.hp);
    const defenderHpPercentage = defender.currentHp / (defender.stats?.maxHp || defender.maxHp || defender.hp);
    
    // Strategic AI decisions based on health, stats, and situation
    const attackPower = attacker.stats?.attack || attacker.attack;
    const defenderDefense = defender.stats?.defense || defender.defense;
    const speed = attacker.stats?.speed || attacker.speed;
    
    // Calculate action weights
    let punchWeight = 40;
    let blockWeight = 30;
    let dodgeWeight = 30;
    
    // Adjust weights based on health
    if (attackerHpPercentage < 0.3) {
      // Low health - more defensive
      blockWeight += 20;
      dodgeWeight += 15;
      punchWeight -= 35;
    } else if (attackerHpPercentage > 0.7 && defenderHpPercentage < 0.5) {
      // High health vs low health enemy - aggressive
      punchWeight += 30;
      blockWeight -= 15;
      dodgeWeight -= 15;
    }
    
    // Adjust based on stats
    if (attackPower > defenderDefense * 1.5) {
      // Strong attack advantage
      punchWeight += 25;
    }
    
    if (speed > (defender.stats?.speed || defender.speed) * 1.2) {
      // Speed advantage - favor dodge
      dodgeWeight += 20;
    }
    
    // Random selection based on weights
    const totalWeight = punchWeight + blockWeight + dodgeWeight;
    const random = Math.random() * totalWeight;
    
    if (random < punchWeight) return 'punch';
    if (random < punchWeight + blockWeight) return 'block';
    return 'dodge';
  }
  
  // Combat resolution with proper damage calculation
  resolveCombatRound(battle, playerAction, enemyAction) {
    const player = battle.playerCard;
    const enemy = battle.enemyCard;
    
    let playerDamage = 0;
    let enemyDamage = 0;
    let result = '';
    
    // Calculate base damage with proper defense scaling
    const playerAttack = player.stats?.attack || player.attack;
    const playerDefense = player.stats?.defense || player.defense;
    const enemyAttack = enemy.stats?.attack || enemy.attack;
    const enemyDefense = enemy.stats?.defense || enemy.defense;
    
    // Player damage to enemy
    if (playerAction === 'punch') {
      if (enemyAction === 'block') {
        playerDamage = Math.max(1, Math.floor(playerAttack * 0.3 - enemyDefense * 0.5));
        result += `🛡️ ${enemy.name} blocks! `;
      } else if (enemyAction === 'dodge') {
        // 70% chance to hit dodging target
        if (Math.random() < 0.7) {
          playerDamage = Math.max(1, Math.floor(playerAttack * 0.8 - enemyDefense * 0.3));
          result += `💨 ${enemy.name} tries to dodge but gets hit! `;
        } else {
          playerDamage = 0;
          result += `💨 ${enemy.name} dodges successfully! `;
        }
      } else {
        // Normal punch vs punch
        playerDamage = Math.max(1, Math.floor(playerAttack - enemyDefense * 0.6));
        result += `👊 ${player.name} lands a solid hit! `;
      }
    }
    
    // Enemy damage to player
    if (enemyAction === 'punch') {
      if (playerAction === 'block') {
        enemyDamage = Math.max(1, Math.floor(enemyAttack * 0.3 - playerDefense * 0.5));
        result += `🛡️ ${player.name} blocks! `;
      } else if (playerAction === 'dodge') {
        if (Math.random() < 0.7) {
          enemyDamage = Math.max(1, Math.floor(enemyAttack * 0.8 - playerDefense * 0.3));
          result += `💨 ${player.name} tries to dodge but gets hit! `;
        } else {
          enemyDamage = 0;
          result += `💨 ${player.name} dodges successfully! `;
        }
      } else {
        enemyDamage = Math.max(1, Math.floor(enemyAttack - playerDefense * 0.6));
        result += `👊 ${enemy.name} strikes back! `;
      }
    }
    
    // Apply damage
    enemy.currentHp = Math.max(0, enemy.currentHp - playerDamage);
    player.currentHp = Math.max(0, player.currentHp - enemyDamage);
    
    return {
      description: result.trim(),
      playerDamage,
      enemyDamage,
      playerAction,
      enemyAction
    };
  }
  
  // Create dynamic battle embed with real-time updates
  async createBattleEmbed(battle) {
    const player = battle.playerCard;
    const enemy = battle.enemyCard;
    
    const playerHpBar = this.createHealthBar(player.currentHp, player.stats?.maxHp || player.maxHp || player.hp);
    const enemyHpBar = this.createHealthBar(enemy.currentHp, enemy.stats?.maxHp || enemy.maxHp || enemy.hp);
    
    // Get last round info
    const lastRound = battle.battleLog[battle.battleLog.length - 1];
    const lastAction = lastRound ? lastRound.result.description : 'Battle begins!';
    
    const embed = new EmbedBuilder()
      .setTitle('⚔️ AI Battle Arena')
      .setDescription(`**Round ${battle.round}**\n\n${lastAction}`)
      .addFields([
        {
          name: `🔥 ${player.name}`,
          value: `${playerHpBar}\n**HP:** ${player.currentHp}/${player.stats?.maxHp || player.maxHp || player.hp}`,
          inline: true
        },
        {
          name: `⚡ ${enemy.name}`,
          value: `${enemyHpBar}\n**HP:** ${enemy.currentHp}/${enemy.stats?.maxHp || enemy.maxHp || enemy.hp}`,
          inline: true
        },
        {
          name: '📊 Battle Log',
          value: this.getRecentBattleLog(battle),
          inline: false
        }
      ])
      .setColor('#e74c3c')
      .setImage('attachment://battle.png')
      .setFooter({ text: `Auto-Battle • AI Optimized • Round ${battle.round}` });
    
    return embed;
  }
  
  // Generate battle visualization
  async generateBattleImage(battle) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(0.5, '#2c2c2c');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);
    
    // Battle arena floor
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 350, 800, 50);
    
    // Character positions
    const playerX = 150;
    const enemyX = 650;
    const characterY = 200;
    
    // Draw characters (simplified representations)
    this.drawCharacter(ctx, battle.playerCard, playerX, characterY, 'player');
    this.drawCharacter(ctx, battle.enemyCard, enemyX, characterY, 'enemy');
    
    // Draw health bars above characters
    this.drawImageHealthBar(ctx, battle.playerCard, playerX - 75, characterY - 100);
    this.drawImageHealthBar(ctx, battle.enemyCard, enemyX - 75, characterY - 100);
    
    return canvas.toBuffer();
  }
  
  // Draw character representation
  drawCharacter(ctx, character, x, y, type) {
    // Character circle
    ctx.fillStyle = type === 'player' ? '#3498db' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    ctx.fill();
    
    // Character name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(character.name, x, y + 80);
    
    // Level indicator
    ctx.font = '12px Arial';
    ctx.fillText(`Lv.${character.level || 1}`, x, y + 100);
  }
  
  // Draw health bar in image
  drawImageHealthBar(ctx, character, x, y) {
    const currentHp = character.currentHp;
    const maxHp = character.stats?.maxHp || character.maxHp || character.hp;
    const percentage = currentHp / maxHp;
    
    const width = 150;
    const height = 20;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, width, height);
    
    // Health fill
    ctx.fillStyle = percentage > 0.6 ? '#2ecc71' : percentage > 0.3 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(x, y, width * percentage, height);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentHp}/${maxHp}`, x + width/2, y + 14);
  }
  
  // Create health bar text
  createHealthBar(current, max) {
    const percentage = current / max;
    const barLength = 10;
    const filled = Math.round(percentage * barLength);
    const empty = barLength - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const color = percentage > 0.6 ? '🟢' : percentage > 0.3 ? '🟡' : '🔴';
    
    return `${color} \`${bar}\` ${Math.round(percentage * 100)}%`;
  }
  
  // Get recent battle log for display
  getRecentBattleLog(battle) {
    const recentRounds = battle.battleLog.slice(-3);
    if (recentRounds.length === 0) return 'Battle starting...';
    
    return recentRounds.map(round => {
      const playerIcon = this.getActionIcon(round.result.playerAction);
      const enemyIcon = this.getActionIcon(round.result.enemyAction);
      return `**R${round.round}:** ${playerIcon} vs ${enemyIcon} - ${round.result.description}`;
    }).join('\n');
  }
  
  // Get action icon
  getActionIcon(action) {
    switch(action) {
      case 'punch': return '👊';
      case 'block': return '🛡️';
      case 'dodge': return '💨';
      default: return '❓';
    }
  }
  
  // Create battle control buttons
  createBattleControls(battleId) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_speed_${battleId}`)
        .setLabel('⚡ 2x Speed')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`battle_pause_${battleId}`)
        .setLabel('⏸️ Pause')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`battle_log_${battleId}`)
        .setLabel('📜 Full Log')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  // End battle and determine winner
  async endBattle(interaction, battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;
    
    battle.status = 'completed';
    const winner = battle.playerCard.currentHp > 0 ? 'player' : 'enemy';
    
    const finalEmbed = new EmbedBuilder()
      .setTitle(winner === 'player' ? '🏆 Victory!' : '💀 Defeat!')
      .setDescription(`**${winner === 'player' ? battle.playerCard.name : battle.enemyCard.name}** wins the battle!`)
      .addFields([
        {
          name: '📊 Battle Summary',
          value: `**Rounds:** ${battle.round - 1}\n**Duration:** ${Math.round((Date.now() - battle.startTime) / 1000)}s`,
          inline: true
        },
        {
          name: '🏥 Final Health',
          value: `**${battle.playerCard.name}:** ${battle.playerCard.currentHp} HP\n**${battle.enemyCard.name}:** ${battle.enemyCard.currentHp} HP`,
          inline: true
        }
      ])
      .setColor(winner === 'player' ? '#2ecc71' : '#e74c3c');
    
    await interaction.editReply({
      embeds: [finalEmbed],
      components: []
    });
    
    // Handle mission progression if applicable
    if (battle.battleType === 'mission' && winner === 'player') {
      await this.handleMissionVictory(interaction, battle);
    }
    
    this.activeBattles.delete(battleId);
  }
  
  // Handle mission victory progression
  async handleMissionVictory(interaction, battle) {
    const mission = battle.missionData;
    if (!mission) return;
    
    // Award XP and currency for stage completion
    const stageReward = mission.currentStage * 50;
    
    // Check if mission is complete
    if (mission.currentStage >= mission.stages.length) {
      // Mission completed!
      const completionBonus = mission.stages.length * 100;
      const totalReward = stageReward + completionBonus;
      
      const embed = new EmbedBuilder()
        .setTitle('🏆 Mission Complete!')
        .setDescription(`**${mission.universe} Adventure Complete!**\n\nYou have successfully conquered all stages!`)
        .addFields([
          { name: '💰 Total Rewards', value: `+${totalReward} ✨ Lumens\n+${mission.stages.length * 10} XP`, inline: true },
          { name: '📊 Mission Stats', value: `**Universe:** ${mission.universe}\n**Difficulty:** ${mission.difficulty}\n**Stages:** ${mission.stages.length}`, inline: true }
        ])
        .setColor('#f1c40f');
      
      await interaction.followUp({ embeds: [embed] });
      
    } else {
      // Continue to next stage
      mission.currentStage++;
      
      const embed = new EmbedBuilder()
        .setTitle('⚡ Stage Complete!')
        .setDescription(`Stage ${mission.currentStage - 1} cleared! Prepare for the next challenge.`)
        .addFields([
          { name: '💰 Stage Reward', value: `+${stageReward} ✨ Lumens`, inline: true },
          { name: '📈 Progress', value: `${mission.currentStage}/${mission.stages.length} Stages`, inline: true }
        ])
        .setColor('#2ecc71');
      
      const continueButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`mission_continue_auto`)
          .setLabel('➡️ Continue Mission')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`mission_abandon_auto`)
          .setLabel('🚪 Tap Out')
          .setStyle(ButtonStyle.Danger)
      );
      
      await interaction.followUp({ embeds: [embed], components: [continueButton] });
    }
  }
}

module.exports = AIBattleSystem;