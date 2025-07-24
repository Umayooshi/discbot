const { EmbedBuilder } = require('discord.js');

class AiAutomaticBattleSystem {
  constructor() {
    this.turnDelay = 3000; // 3 seconds between turns
    this.abilityCooldown = 3; // 3 turns before ability can be used again
  }

  // Start automated battle with turn-based progression
  async startAutomatedBattle(battleState, battleMessage) {
    battleState.battleLog = [];
    battleState.turn = 1;
    battleState.isActive = true;
    
    // Initialize ability cooldowns for all cards
    [...battleState.userTeam, ...battleState.enemyTeam].forEach(card => {
      card.abilityCooldowns = {};
      card.isAlive = card.stats.hp > 0;
    });

    // Add initial battle log
    battleState.battleLog.push({
      type: 'status',
      message: 'Battle begins! Turn order determined by speed stats.'
    });

    // Start the automated battle loop
    this.processBattleLoop(battleState, battleMessage);
  }

  // Main battle processing loop
  async processBattleLoop(battleState, battleMessage) {
    while (battleState.isActive && battleState.turn <= 50) {
      await new Promise(resolve => setTimeout(resolve, this.turnDelay));

      try {
        // Get current active character from turn order
        const currentTurnIndex = (battleState.turn - 1) % battleState.turnOrder.length;
        const currentTurn = battleState.turnOrder[currentTurnIndex];
        
        // Find the actual card object
        const currentCard = this.findCardById(battleState, currentTurn.cardId);
        if (!currentCard || !currentCard.isAlive) {
          battleState.turn++;
          continue;
        }

        // Process the turn
        console.log(`Turn ${battleState.turn}: ${currentCard.name} (${currentCard.class}) taking action...`);
        await this.processTurn(battleState, currentCard, currentTurn.isUser);

        // Update battle display
        await this.updateBattleDisplay(battleState, battleMessage);
        console.log(`Turn ${battleState.turn} completed. Battle log entries: ${battleState.battleLog.length}`);

        // Check for battle end conditions
        if (this.checkBattleEnd(battleState)) {
          battleState.isActive = false;
          await this.endBattle(battleState, battleMessage);
          break;
        }

        battleState.turn++;

      } catch (error) {
        console.error('Error in battle loop:', error);
        battleState.isActive = false;
        break;
      }
    }

    // Handle turn limit
    if (battleState.turn > 50 && battleState.isActive) {
      battleState.winner = 'draw';
      battleState.isActive = false;
      await this.endBattle(battleState, battleMessage);
    }
  }

  // Process individual turn with AI decision making
  async processTurn(battleState, currentCard, isUserCard) {
    const abilities = require('./abilities');
    
    // Reduce ability cooldowns
    Object.keys(currentCard.abilityCooldowns).forEach(abilityName => {
      currentCard.abilityCooldowns[abilityName]--;
      if (currentCard.abilityCooldowns[abilityName] <= 0) {
        delete currentCard.abilityCooldowns[abilityName];
      }
    });

    // AI decision making
    const decision = this.makeAIDecision(battleState, currentCard, isUserCard);
    
    if (decision.action === 'ability' && currentCard.abilities && currentCard.abilities.length > 0) {
      const abilityKey = currentCard.abilities[0];
      const abilityData = abilities.getAbilityByName(abilityKey);
      
      if (abilityData && !currentCard.abilityCooldowns[abilityKey]) {
        // Use ability
        await this.executeAbility(battleState, currentCard, abilityData, isUserCard);
        currentCard.abilityCooldowns[abilityKey] = this.abilityCooldown;
      } else {
        // Fallback to basic attack
        await this.executeBasicAttack(battleState, currentCard, isUserCard);
      }
    } else if (decision.action === 'defend') {
      // Defensive stance - reduce incoming damage for 1 turn
      currentCard.defendingThisTurn = true;
      battleState.battleLog.push({
        type: 'status',
        message: `${currentCard.name} takes a defensive stance`
      });
    } else {
      // Basic attack
      await this.executeBasicAttack(battleState, currentCard, isUserCard);
    }

    // Clear defending status at end of turn
    [...battleState.userTeam, ...battleState.enemyTeam].forEach(card => {
      card.defendingThisTurn = false;
    });
  }

  // AI decision making based on battlefield conditions
  makeAIDecision(battleState, currentCard, isUserCard) {
    const enemyTeam = isUserCard ? battleState.enemyTeam : battleState.userTeam;
    const allyTeam = isUserCard ? battleState.userTeam : battleState.enemyTeam;
    
    // Calculate team health percentages
    const allyHealthPercent = this.getTeamHealthPercent(allyTeam);
    const enemyHealthPercent = this.getTeamHealthPercent(enemyTeam);
    
    // Strategic decision making
    if (currentCard.class === 'Support' && allyHealthPercent < 0.6) {
      return { action: 'ability', priority: 'heal' };
    }
    
    if (currentCard.class === 'Tank' && allyHealthPercent < 0.4) {
      return { action: 'defend', priority: 'protect' };
    }
    
    if (currentCard.class === 'Intel' && enemyHealthPercent > 0.7) {
      return { action: 'ability', priority: 'debuff' };
    }
    
    // Increased ability usage for more exciting battles
    const abilityChance = {
      'Damage': 0.6,  // Increased from 0.4
      'Tank': 0.5,    // Increased from 0.3
      'Support': 0.7, // Increased from 0.5
      'Intel': 0.8    // Increased from 0.6
    }[currentCard.class] || 0.5;
    
    if (Math.random() < abilityChance && currentCard.abilities && currentCard.abilities.length > 0) {
      const abilityKey = currentCard.abilities[0];
      if (!currentCard.abilityCooldowns[abilityKey]) {
        return { action: 'ability', priority: 'damage' };
      }
    }
    
    // Default to basic attack
    return { action: 'attack', priority: 'damage' };
  }

  // Execute ability with proper targeting and effects
  async executeAbility(battleState, caster, abilityData, isUserCard) {
    const enemyTeam = isUserCard ? battleState.enemyTeam : battleState.userTeam;
    const allyTeam = isUserCard ? battleState.userTeam : battleState.enemyTeam;
    
    // Determine targets based on ability type
    let targets = [];
    
    // Check ability type for targeting
    if (abilityData.type === 'damage' || abilityData.type === 'control' || abilityData.type === 'debuff') {
      targets = enemyTeam.filter(card => card.isAlive);
    } else if (abilityData.type === 'heal' || abilityData.type === 'buff') {
      targets = allyTeam.filter(card => card.isAlive);
    } else {
      targets = [caster]; // Self-target for special abilities
    }
    
    if (targets.length === 0) return;
    
    // Select target based on ability type
    let target;
    if (abilityData.type === 'heal') {
      target = targets.reduce((lowest, card) => 
        (card.stats.hp / card.stats.maxHp) < (lowest.stats.hp / lowest.stats.maxHp) ? card : lowest
      );
    } else {
      target = targets[Math.floor(Math.random() * targets.length)];
    }
    
    // Calculate and apply ability effect based on baseEffect
    if (abilityData.baseEffect === 'direct_damage' || abilityData.baseEffect === 'multi_hit' || abilityData.baseEffect === 'critical_damage') {
      const baseDamage = Math.floor(caster.stats.attack * (abilityData.multiplier || 1.2) * 0.9); // Increased ability damage
      const variance = Math.floor(baseDamage * (0.8 + Math.random() * 0.4)); // Better variance
      const finalDamage = Math.max(50, variance - (target.defendingThisTurn ? target.stats.defense * 0.5 : target.stats.defense * 0.25));
      
      target.stats.hp = Math.max(0, target.stats.hp - finalDamage);
      
      if (target.stats.hp <= 0) {
        target.isAlive = false;
        battleState.battleLog.push({
          type: 'status',
          message: `${target.name} has been defeated!`
        });
      }
      
      battleState.battleLog.push({
        type: 'damage',
        attacker: caster.name,
        damage: finalDamage,
        ability: abilityData.name
      });
      
    } else if (abilityData.baseEffect === 'heal_self' || abilityData.baseEffect === 'heal_target') {
      const healAmount = Math.floor(caster.stats.attack * 1.2); // Increased healing effectiveness
      const actualHeal = Math.min(healAmount, target.stats.maxHp - target.stats.hp);
      target.stats.hp += actualHeal;
      
      battleState.battleLog.push({
        type: 'heal',
        healer: caster.name,
        amount: actualHeal,
        ability: abilityData.name
      });
      
    } else {
      // Other ability effects (control, debuff, etc.)
      battleState.battleLog.push({
        type: 'ability',
        user: caster.name,
        ability: abilityData.name
      });
    }
  }

  // Execute basic attack
  async executeBasicAttack(battleState, attacker, isUserCard) {
    const enemyTeam = isUserCard ? battleState.enemyTeam : battleState.userTeam;
    const aliveEnemies = enemyTeam.filter(card => card.isAlive);
    
    if (aliveEnemies.length === 0) return;
    
    // Select random target
    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    
    // Calculate balanced damage (sweet spot between too high and too low)
    const baseDamage = attacker.stats.attack * 0.85; // Increased from 0.6 to 0.85
    const defense = target.defendingThisTurn ? target.stats.defense * 1.5 : target.stats.defense;
    const finalDamage = Math.max(40, Math.floor(baseDamage * (0.8 + Math.random() * 0.4) - defense * 0.35));
    
    target.stats.hp = Math.max(0, target.stats.hp - finalDamage);
    
    if (target.stats.hp <= 0) {
      target.isAlive = false;
      battleState.battleLog.push({
        type: 'status',
        message: `${target.name} has been defeated!`
      });
    }
    
    battleState.battleLog.push({
      type: 'damage',
      attacker: attacker.name,
      damage: finalDamage,
      ability: 'Basic Attack',
      target: target.name
    });
  }

  // This function is now handled within executeAbility

  // Update battle display with health visualizer
  async updateBattleDisplay(battleState, battleMessage) {
    const AdvancedHealthVisualizer = require('./advanced_health_visualizer');
    
    try {
      // COMPREHENSIVE IMAGE PRESERVATION SYSTEM
      const currentEmbed = battleMessage.embeds[0];
      let imageUrl = null;
      
      // Try multiple methods to preserve image URL
      if (currentEmbed && currentEmbed.image) {
        imageUrl = currentEmbed.image.url;
        console.log('🖼️ Found image URL in current embed:', imageUrl);
      }
      
      // Store image URL in battleState as backup
      if (!battleState.originalImageUrl && imageUrl) {
        battleState.originalImageUrl = imageUrl;
        console.log('💾 Storing original image URL as backup:', imageUrl);
      } else if (!imageUrl && battleState.originalImageUrl) {
        imageUrl = battleState.originalImageUrl;
        console.log('🔄 Using backup image URL:', imageUrl);
      }
      
      // Create updated health display WITH image preservation
      const healthEmbed = AdvancedHealthVisualizer.createHealthDisplay(
        battleState.userTeam, 
        battleState.enemyTeam, 
        battleState,
        imageUrl // Pass image URL directly to health visualizer
      );
      
      if (!imageUrl) {
        console.log('❌ ERROR: No image URL available - image will be lost!');
        console.log('Current embed structure:', JSON.stringify(currentEmbed, null, 2));
      }
      
      // Update message with comprehensive error catching
      const updateResult = await battleMessage.edit({ 
        embeds: [healthEmbed],
        files: [] // Explicitly empty files array prevents Discord from adding attachments
      });
      
      // Verify image is still there after update
      setTimeout(async () => {
        try {
          const verifyMessage = await battleMessage.fetch();
          const verifyEmbed = verifyMessage.embeds[0];
          if (verifyEmbed && verifyEmbed.image && verifyEmbed.image.url) {
            console.log('✅ Image verification successful:', verifyEmbed.image.url);
          } else {
            console.log('❌ IMAGE LOST AFTER UPDATE! Embed structure:', JSON.stringify(verifyEmbed, null, 2));
            console.log('🔧 Attempting recovery with backup URL:', battleState.originalImageUrl);
            
            // Attempt immediate recovery
            if (battleState.originalImageUrl) {
              const recoveryEmbed = AdvancedHealthVisualizer.createHealthDisplay(
                battleState.userTeam, 
                battleState.enemyTeam, 
                battleState,
                battleState.originalImageUrl // Pass backup URL directly
              );
              await battleMessage.edit({ embeds: [recoveryEmbed], files: [] });
              console.log('🔧 Recovery attempt completed');
              
              // Verify recovery worked
              setTimeout(async () => {
                const doubleCheck = await battleMessage.fetch();
                const doubleCheckEmbed = doubleCheck.embeds[0];
                if (doubleCheckEmbed && doubleCheckEmbed.image) {
                  console.log('✅ Recovery successful!');
                } else {
                  console.log('❌ Recovery failed - image still missing');
                }
              }, 1000);
            } else {
              console.log('❌ No backup URL available for recovery');
            }
          }
        } catch (verifyError) {
          console.error('Image verification failed:', verifyError);
        }
      }, 1000); // Increased delay to 1000ms for better verification
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in updateBattleDisplay:', error);
      console.error('Error stack:', error.stack);
    }
  }

  // Check if battle should end
  checkBattleEnd(battleState) {
    const userAlive = battleState.userTeam.some(card => card.isAlive);
    const enemyAlive = battleState.enemyTeam.some(card => card.isAlive);
    
    if (!userAlive) {
      battleState.winner = 'enemy';
      return true;
    }
    
    if (!enemyAlive) {
      battleState.winner = 'user';
      return true;
    }
    
    return false;
  }

  // End battle with results
  async endBattle(battleState, battleMessage) {
    const AdvancedHealthVisualizer = require('./advanced_health_visualizer');
    
    let resultMessage = '';
    if (battleState.winner === 'user') {
      resultMessage = '🎉 **VICTORY!** Your team emerged triumphant!';
    } else if (battleState.winner === 'enemy') {
      resultMessage = '💀 **DEFEAT!** The enemy team proved too strong.';
    } else {
      resultMessage = '⏱️ **DRAW!** Battle ended due to turn limit.';
    }
    
    battleState.battleLog.push({
      type: 'status',
      message: resultMessage
    });
    
    // Create final battle display
    const finalEmbed = AdvancedHealthVisualizer.createHealthDisplay(
      battleState.userTeam, 
      battleState.enemyTeam, 
      battleState
    );
    
    finalEmbed.setTitle('⚔️ BATTLE COMPLETE!');
    finalEmbed.setDescription(resultMessage);
    finalEmbed.setColor(battleState.winner === 'user' ? '#00ff00' : battleState.winner === 'enemy' ? '#ff0000' : '#ffff00');
    
    // Keep the battle arena image URL without duplicating
    const currentEmbed = battleMessage.embeds[0];
    if (currentEmbed && currentEmbed.image && currentEmbed.image.url) {
      console.log('Preserving battle image URL in final embed:', currentEmbed.image.url);
      finalEmbed.setImage(currentEmbed.image.url);
    }
    
    // Only update embed, don't send new attachments
    await battleMessage.edit({ 
      embeds: [finalEmbed],
      files: [] // Explicitly empty to prevent attachment issues
    });
  }

  // Helper functions
  findCardById(battleState, cardId) {
    return [...battleState.userTeam, ...battleState.enemyTeam].find(card => card.cardId === cardId);
  }

  getTeamHealthPercent(team) {
    const totalMaxHp = team.reduce((sum, card) => sum + card.stats.maxHp, 0);
    const totalCurrentHp = team.reduce((sum, card) => sum + card.stats.hp, 0);
    return totalCurrentHp / totalMaxHp;
  }
}

module.exports = AiAutomaticBattleSystem;