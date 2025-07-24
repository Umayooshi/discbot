const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

// New Battle System with 22 Abilities and Smart AI
class NewBattleSystem {
  constructor() {
    this.activeLineups = new Map(); // userId -> [cardId1, cardId2, cardId3, cardId4, cardId5]
    this.activeBattles = new Map(); // battleId -> battleState
    
    // New Ability System - 22 Total Abilities
    this.abilities = {
      // Damage Abilities (6)
      'power_strike': {
        name: 'Power Strike',
        type: 'damage',
        classes: ['Damage'],
        cooldown: 2,
        effect: { type: 'damage', multiplier: 1.5 },
        description: 'Deals 150% attack damage'
      },
      'berserker_rage': {
        name: 'Berserker Rage', 
        type: 'damage',
        classes: ['Damage'],
        cooldown: 3,
        effect: { type: 'multi_hit', hits: 3, multiplier: 0.6 },
        description: '3 hits at 60% attack each (180% total)'
      },
      'critical_strike': {
        name: 'Critical Strike',
        type: 'damage', 
        classes: ['Damage'],
        cooldown: 2,
        effect: { type: 'critical', multiplier: 2.0, chance: 0.3 },
        description: '200% attack (30% chance, otherwise 100%)'
      },
      'life_steal': {
        name: 'Life Steal',
        type: 'damage',
        classes: ['Damage'],
        cooldown: 2,
        effect: { type: 'drain', multiplier: 1.2, heal_ratio: 0.5 },
        description: '120% attack + heal for 50% of damage dealt'
      },
      'execute': {
        name: 'Execute',
        type: 'damage',
        classes: ['Damage'],
        cooldown: 3,
        effect: { type: 'execute', multiplier: 1.0, bonus_threshold: 0.25 },
        description: '100% attack + 100% bonus if target <25% HP'
      },
      'rampage': {
        name: 'Rampage',
        type: 'damage',
        classes: ['Damage'],
        cooldown: 2,
        effect: { type: 'rampage', multiplier: 1.0, kill_bonus: 0.25 },
        description: '100% attack + 25% per previous kill this battle'
      },
      
      // Tank Abilities (6)
      'taunt': {
        name: 'Taunt',
        type: 'control',
        classes: ['Tank'],
        cooldown: 3,
        effect: { type: 'force_target', duration: 2 },
        description: 'Forces enemies to target this card for 2 turns'
      },
      'shield': {
        name: 'Shield',
        type: 'buff',
        classes: ['Tank'],
        cooldown: 3,
        effect: { type: 'buff_defense', multiplier: 1.5, duration: 3 },
        description: '+50% defense for 3 turns'
      },
      'regenerate': {
        name: 'Regenerate',
        type: 'healing',
        classes: ['Tank'],
        cooldown: 2,
        effect: { type: 'heal_self', multiplier: 0.25 },
        description: 'Heal 25% of max HP'
      },
      'counter': {
        name: 'Counter',
        type: 'special',
        classes: ['Tank'],
        cooldown: 3,
        effect: { type: 'reflect', multiplier: 0.75, duration: 2 },
        description: 'Reflect 75% of received damage for 2 turns'
      },
      'guardian': {
        name: 'Guardian',
        type: 'special',
        classes: ['Tank'],
        cooldown: 2,
        effect: { type: 'redirect', duration: 1 },
        description: 'Redirect next ally damage to self'
      },
      'fortify': {
        name: 'Fortify',
        type: 'buff',
        classes: ['Tank'],
        cooldown: 4,
        effect: { type: 'immunity', duration: 3 },
        description: 'Immunity to debuffs for 3 turns'
      },
      
      // Support Abilities (4)
      'heal': {
        name: 'Heal',
        type: 'healing',
        classes: ['Support'],
        cooldown: 2,
        effect: { type: 'heal_target', multiplier: 0.4 },
        description: 'Restore 40% of target max HP'
      },
      'power_boost': {
        name: 'Power Boost',
        type: 'buff',
        classes: ['Support'],
        cooldown: 3,
        effect: { type: 'buff_attack', multiplier: 1.4, duration: 3 },
        description: '+40% attack for 3 turns'
      },
      'barrier': {
        name: 'Barrier',
        type: 'protection',
        classes: ['Support'],
        cooldown: 3,
        effect: { type: 'damage_shield', base: 300, hp_ratio: 0.3, duration: 3 },
        description: 'Absorb next 300 + 30% max HP damage'
      },
      'sacrifice': {
        name: 'Sacrifice',
        type: 'healing',
        classes: ['Support'],
        cooldown: 4,
        effect: { type: 'sacrifice_heal', self_cost: 0.5 },
        description: 'Lose 50% current HP, ally heals to full'
      },
      
      // Intel Abilities (6)
      'stun_lock': {
        name: 'Stun Lock',
        type: 'control',
        classes: ['Intel'],
        cooldown: 3,
        effect: { type: 'stun', duration: 1 },
        description: 'Target skips next turn'
      },
      'freeze': {
        name: 'Freeze',
        type: 'control',
        classes: ['Intel'],
        cooldown: 3,
        effect: { type: 'stun', duration: 1 },
        description: 'Target skips next turn'
      },
      'confuse': {
        name: 'Confuse',
        type: 'debuff',
        classes: ['Intel'],
        cooldown: 2,
        effect: { type: 'debuff_accuracy', multiplier: 0.5, duration: 2 },
        description: '-50% accuracy for 2 turns'
      },
      'weaken': {
        name: 'Weaken',
        type: 'debuff',
        classes: ['Intel'],
        cooldown: 2,
        effect: { type: 'debuff_attack', multiplier: 0.6, duration: 3 },
        description: '-40% attack for 3 turns'
      },
      'armor_break': {
        name: 'Armor Break',
        type: 'debuff',
        classes: ['Intel'],
        cooldown: 2,
        effect: { type: 'debuff_defense', multiplier: 0.5, duration: 3 },
        description: '-50% defense for 3 turns'
      },
      'slow': {
        name: 'Slow',
        type: 'debuff',
        classes: ['Intel'],
        cooldown: 2,
        effect: { type: 'debuff_speed', multiplier: 0.6, duration: 2 },
        description: '-40% speed for 2 turns'
      }
    };
  }

  // Set user's 5-card lineup
  setLineup(userId, cardIds) {
    if (cardIds.length !== 5) {
      throw new Error('Lineup must contain exactly 5 cards');
    }
    this.activeLineups.set(userId, cardIds);
    return true;
  }

  // Get user's current lineup
  getLineup(userId) {
    return this.activeLineups.get(userId) || [];
  }

  // Set lineup 
  setLineup(userId, cardIds) {
    this.activeLineups.set(userId, [...cardIds]);
  }

  // Clear lineup
  clearLineup(userId) {
    this.activeLineups.delete(userId);
  }

  // Add card to lineup
  addToLineup(userId, cardId) {
    const lineup = this.getLineup(userId);
    if (lineup.length >= 5) {
      return { success: false, message: 'Lineup is already full (5 cards maximum)!' };
    }
    if (lineup.includes(cardId)) {
      return { success: false, message: 'This card is already in your lineup!' };
    }
    lineup.push(cardId);
    this.activeLineups.set(userId, lineup);
    return { success: true, message: 'Card added to lineup!' };
  }

  // Remove card from lineup
  removeFromLineup(userId, position) {
    const lineup = this.getLineup(userId);
    const index = position - 1;
    if (index < 0 || index >= lineup.length) {
      return { success: false, message: 'Invalid position!' };
    }
    lineup.splice(index, 1);
    this.activeLineups.set(userId, lineup);
    return { success: true, message: 'Card removed from lineup!' };
  }

  // Assign abilities to cards based on character and class
  assignAbility(card) {
    const characterAbilities = {
      // Popular characters with specific abilities
      'Zoro': 'critical_strike',
      'Light Yagami': 'weaken',
      'Naruto Uzumaki': 'berserker_rage',
      'Itachi Uchiha': 'stun_lock',
      'Sakura Haruno': 'heal',
      'Goku': 'power_strike',
      'Levi Ackerman': 'critical_strike',
      'Edward Elric': 'armor_break',
      'Makima': 'confuse',
      'Douma': 'freeze'
    };

    // Check for specific character assignment first
    if (characterAbilities[card.name]) {
      return characterAbilities[card.name];
    }

    // Default class-based assignment
    const classAbilities = {
      'Damage': ['power_strike', 'berserker_rage', 'critical_strike', 'life_steal', 'execute', 'rampage'],
      'Tank': ['taunt', 'shield', 'regenerate', 'counter', 'guardian', 'fortify'],
      'Support': ['heal', 'power_boost', 'barrier', 'sacrifice'],
      'Intel': ['stun_lock', 'freeze', 'confuse', 'weaken', 'armor_break', 'slow']
    };

    const availableAbilities = classAbilities[card.class] || [];
    return availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
  }

  // Create AI opponent team
  async generateAITeam(playerCards) {
    // Use the mongoose models from index.js
    const mongoose = require('mongoose');
    const Card = mongoose.model('Card');
    const classSystem = require('./classSystem');
    
    // Get random cards from database
    const allCards = await Card.aggregate([{ $sample: { size: 20 } }]);
    
    // Select 5 cards with balanced composition
    const aiTeam = [];
    const desiredClasses = ['Tank', 'Damage', 'Damage', 'Support', 'Intel'];
    
    for (const desiredClass of desiredClasses) {
      const classCard = allCards.find(card => card.class === desiredClass && !aiTeam.includes(card));
      if (classCard) {
        // Assign ability to AI card
        classCard.assignedAbility = this.assignAbility(classCard);
        aiTeam.push(classCard);
      }
    }
    
    // Fill remaining slots if needed
    while (aiTeam.length < 5 && allCards.length > aiTeam.length) {
      const card = allCards[aiTeam.length];
      card.assignedAbility = this.assignAbility(card);
      aiTeam.push(card);
    }
    
    return aiTeam.slice(0, 5);
  }

  // Start a new battle
  async startBattle(userId, playerCards) {
    const battleId = `${userId}_${Date.now()}`;
    const aiTeam = await this.generateAITeam(playerCards);
    
    // Assign abilities to player cards
    playerCards.forEach(card => {
      card.assignedAbility = this.assignAbility(card);
    });
    
    // Create battle state
    const battleState = {
      id: battleId,
      playerTeam: playerCards.map(card => this.createBattleCard(card, 'player')),
      aiTeam: aiTeam.map(card => this.createBattleCard(card, 'ai')),
      turn: 1,
      phase: 'active',
      turnOrder: [],
      winner: null,
      battleLog: []
    };
    
    // Calculate turn order by speed
    const allCombatants = [...battleState.playerTeam, ...battleState.aiTeam];
    battleState.turnOrder = allCombatants.sort((a, b) => b.stats.speed - a.stats.speed);
    
    this.activeBattles.set(battleId, battleState);
    return battleState;
  }

  // Create battle-ready card object
  createBattleCard(card, team) {
    return {
      id: card._id || card.cardId,
      name: card.name,
      class: card.class,
      team: team,
      assignedAbility: card.assignedAbility,
      stats: {
        hp: card.stats.hp,
        maxHp: card.stats.maxHp || card.stats.hp,
        attack: card.stats.attack,
        defense: card.stats.defense,
        speed: card.stats.speed
      },
      effects: [], // Active buffs/debuffs
      abilityCooldowns: {},
      isAlive: true,
      killCount: 0
    };
  }

  // Format team display with health bars and clean layout
  formatTeamDisplay(team) {
    return team.map(card => {
      const healthBar = this.createHealthBar(card.stats.hp, card.stats.maxHp);
      const statusIcon = card.isAlive ? '⚔️' : '💀';
      return `${statusIcon} **${card.name}** - ${healthBar} ${card.stats.hp}/${card.stats.maxHp} HP\n📋 ${card.class} - ${card.assignedAbility}`;
    }).join('\n\n');
  }

  // Create visual health bar using green and white squares
  createHealthBar(currentHP, maxHP) {
    const percentage = Math.max(0, currentHP / maxHP);
    const totalBars = 10;
    const filledBars = Math.floor(percentage * totalBars);
    const emptyBars = totalBars - filledBars;
    
    // Use green squares for health, white squares for missing health
    const greenSquares = '🟩'.repeat(filledBars);
    const whiteSquares = '⬜'.repeat(emptyBars);
    return greenSquares + whiteSquares;
  }

  // Process a single turn in battle
  async processTurn(battleState) {
    const currentIndex = (battleState.turn - 1) % battleState.turnOrder.length;
    const currentCard = battleState.turnOrder[currentIndex];
    
    if (!currentCard.isAlive) {
      battleState.turn++;
      return this.checkBattleEnd(battleState);
    }
    
    // AI Decision Making
    const action = this.makeAIDecision(currentCard, battleState);
    const result = await this.executeAction(currentCard, action, battleState);
    
    // Update cooldowns and effects
    this.updateEffects(battleState);
    
    battleState.turn++;
    return this.checkBattleEnd(battleState);
  }

  // AI decision making
  makeAIDecision(card, battleState) {
    const ability = this.abilities[card.assignedAbility];
    const canUseAbility = !card.abilityCooldowns[card.assignedAbility] || card.abilityCooldowns[card.assignedAbility] <= 0;
    
    if (!canUseAbility) {
      return { type: 'basic_attack', target: this.selectTarget(card, battleState) };
    }
    
    // Smart ability usage based on situation
    const shouldUseAbility = this.shouldUseAbility(card, ability, battleState);
    
    if (shouldUseAbility) {
      const target = this.selectAbilityTarget(card, ability, battleState);
      return { type: 'ability', ability: card.assignedAbility, target: target };
    } else {
      return { type: 'basic_attack', target: this.selectTarget(card, battleState) };
    }
  }

  // Smart ability usage decision
  shouldUseAbility(card, ability, battleState) {
    const enemyTeam = card.team === 'player' ? battleState.aiTeam : battleState.playerTeam;
    const allyTeam = card.team === 'player' ? battleState.playerTeam : battleState.aiTeam;
    
    switch (ability.type) {
      case 'healing':
        // Use healing if any ally is below 60% HP
        return allyTeam.some(ally => ally.isAlive && ally.stats.hp / ally.stats.maxHp < 0.6);
      
      case 'control':
        // Use control abilities on high-threat enemies
        return enemyTeam.some(enemy => enemy.isAlive && (enemy.class === 'Damage' || enemy.stats.hp > enemy.stats.maxHp * 0.8));
      
      case 'buff':
        // Use buffs early in battle or when allies need boost
        return battleState.turn < 10 || allyTeam.some(ally => ally.isAlive && ally.stats.hp > ally.stats.maxHp * 0.7);
      
      case 'debuff':
        // Use debuffs on strong enemies
        return enemyTeam.some(enemy => enemy.isAlive && enemy.stats.attack > card.stats.attack);
      
      default:
        return Math.random() < 0.7; // 70% chance to use damage abilities
    }
  }

  // Select target for abilities
  selectAbilityTarget(card, ability, battleState) {
    const enemyTeam = card.team === 'player' ? battleState.aiTeam : battleState.playerTeam;
    const allyTeam = card.team === 'player' ? battleState.playerTeam : battleState.aiTeam;
    
    if (ability.type === 'healing' || ability.type === 'buff' || ability.type === 'protection') {
      // Target weakest ally for healing, strongest for buffs
      const aliveAllies = allyTeam.filter(ally => ally.isAlive);
      if (aliveAllies.length === 0) return null;
      
      if (ability.type === 'healing') {
        return aliveAllies.sort((a, b) => a.stats.hp - b.stats.hp)[0];
      } else {
        return aliveAllies.sort((a, b) => b.stats.attack - a.stats.attack)[0];
      }
    } else {
      // Target enemies - prioritize low HP or high threat
      const aliveEnemies = enemyTeam.filter(enemy => enemy.isAlive);
      if (aliveEnemies.length === 0) return null;
      
      return aliveEnemies.sort((a, b) => {
        const aScore = (a.stats.hp / a.stats.maxHp) + (a.class === 'Damage' ? -0.3 : 0);
        const bScore = (b.stats.hp / b.stats.maxHp) + (b.class === 'Damage' ? -0.3 : 0);
        return aScore - bScore;
      })[0];
    }
  }

  // Select target for basic attacks
  selectTarget(card, battleState) {
    const enemyTeam = card.team === 'player' ? battleState.aiTeam : battleState.playerTeam;
    const aliveEnemies = enemyTeam.filter(enemy => enemy.isAlive);
    
    if (aliveEnemies.length === 0) {
      return null; // No valid targets
    }
    
    // Prioritize low HP enemies or damage dealers
    return aliveEnemies.sort((a, b) => {
      const aScore = (a.stats.hp / a.stats.maxHp) + (a.class === 'Damage' ? -0.2 : 0);
      const bScore = (b.stats.hp / b.stats.maxHp) + (b.class === 'Damage' ? -0.2 : 0);
      return aScore - bScore;
    })[0];
  }

  // Execute action and return result
  async executeAction(actor, action, battleState) {
    let result = {
      actor: actor.name,
      action: action.type,
      target: action.target?.name,
      damage: 0,
      healing: 0,
      effects: [],
      message: ''
    };

    // Don't attack dead targets
    if (action.target && !action.target.isAlive) {
      result.message = `${actor.name} tries to attack ${action.target.name}, but they're already defeated!`;
      battleState.battleLog.push(result);
      return result;
    }

    if (action.type === 'basic_attack') {
      const damage = this.calculateBasicDamage(actor, action.target);
      action.target.stats.hp -= damage;
      result.damage = damage;
      result.message = `${actor.name} attacks ${action.target.name} for ${damage} damage!`;
    } else if (action.type === 'ability') {
      result = await this.executeAbility(actor, action.ability, action.target, battleState);
      actor.abilityCooldowns[action.ability] = 3; // Fixed 3-turn cooldown
    }

    // Check if target died and prevent negative HP
    if (action.target && action.target.stats.hp <= 0 && action.target.isAlive) {
      action.target.stats.hp = 0; // Cap at 0, no negative HP
      action.target.isAlive = false;
      actor.killCount++;
      result.message += ` ${action.target.name} is defeated!`;
    }

    battleState.battleLog.push(result);
    return result;
  }

  // Calculate basic attack damage
  calculateBasicDamage(attacker, defender) {
    const baseDamage = attacker.stats.attack;
    const defense = defender.stats.defense;
    const damage = Math.max(1, Math.floor(baseDamage - (defense * 0.3)));
    return damage;
  }

  // Execute ability effects
  async executeAbility(actor, abilityKey, target, battleState) {
    const ability = this.abilities[abilityKey];
    const effect = ability.effect;
    
    let result = {
      actor: actor.name,
      action: 'ability',
      ability: ability.name,
      target: target?.name,
      damage: 0,
      healing: 0,
      effects: [],
      message: `${actor.name} uses ${ability.name}!`
    };

    switch (effect.type) {
      case 'damage':
        if (!target.isAlive) {
          result.message += ` But ${target.name} is already defeated!`;
          break;
        }
        result.damage = Math.floor(actor.stats.attack * effect.multiplier);
        target.stats.hp -= result.damage;
        result.message += ` ${target.name} takes ${result.damage} damage!`;
        break;
        
      case 'multi_hit':
        if (!target.isAlive) {
          result.message += ` But ${target.name} is already defeated!`;
          break;
        }
        const totalDamage = effect.hits * Math.floor(actor.stats.attack * effect.multiplier);
        result.damage = totalDamage;
        target.stats.hp -= totalDamage;
        result.message += ` ${target.name} takes ${totalDamage} damage from ${effect.hits} hits!`;
        break;
        
      case 'critical':
        if (!target.isAlive) {
          result.message += ` But ${target.name} is already defeated!`;
          break;
        }
        const isCrit = Math.random() < effect.chance;
        const multiplier = isCrit ? effect.multiplier : 1.0;
        result.damage = Math.floor(actor.stats.attack * multiplier);
        target.stats.hp -= result.damage;
        result.message += ` ${target.name} takes ${result.damage} ${isCrit ? 'CRITICAL' : ''} damage!`;
        break;
        
      case 'execute':
        if (!target.isAlive) {
          result.message += ` But ${target.name} is already defeated!`;
          break;
        }
        const isExecute = target.stats.hp / target.stats.maxHp < effect.bonus_threshold;
        const executeDamage = Math.floor(actor.stats.attack * effect.multiplier * (isExecute ? 2 : 1));
        result.damage = executeDamage;
        target.stats.hp -= executeDamage;
        result.message += ` ${target.name} takes ${executeDamage} ${isExecute ? 'EXECUTE' : ''} damage!`;
        break;
        
      case 'rampage':
        if (!target.isAlive) {
          result.message += ` But ${target.name} is already defeated!`;
          break;
        }
        const rampageDamage = Math.floor(actor.stats.attack * (effect.multiplier + (actor.killCount * effect.kill_bonus)));
        result.damage = rampageDamage;
        target.stats.hp -= rampageDamage;
        result.message += ` ${target.name} takes ${rampageDamage} rampage damage!`;
        break;
        
      case 'drain':
        if (!target.isAlive) {
          result.message += ` But ${target.name} is already defeated!`;
          break;
        }
        const drainDamage = Math.floor(actor.stats.attack * effect.multiplier);
        const healing = Math.floor(drainDamage * effect.heal_ratio);
        result.damage = drainDamage;
        result.healing = healing;
        target.stats.hp -= drainDamage;
        actor.stats.hp = Math.min(actor.stats.maxHp, actor.stats.hp + healing);
        result.message += ` ${target.name} takes ${drainDamage} damage! ${actor.name} heals ${healing} HP!`;
        break;
        
      case 'heal_self':
        const selfHeal = Math.floor(actor.stats.maxHp * effect.multiplier);
        result.healing = selfHeal;
        actor.stats.hp = Math.min(actor.stats.maxHp, actor.stats.hp + selfHeal);
        result.message += ` ${actor.name} heals ${selfHeal} HP!`;
        break;
        
      case 'heal_target':
        const targetHeal = Math.floor(target.stats.maxHp * effect.multiplier);
        result.healing = targetHeal;
        target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + targetHeal);
        result.message += ` ${target.name} heals ${targetHeal} HP!`;
        break;
        
      case 'buff_attack':
      case 'buff_defense':
      case 'buff_speed':
      case 'debuff_attack':
      case 'debuff_defense':
      case 'debuff_speed':
        this.applyStatusEffect(target, effect);
        result.message += ` ${target.name} is affected by ${ability.name}!`;
        break;
        
      case 'stun':
        this.applyStatusEffect(target, { type: 'stun', duration: effect.duration });
        result.message += ` ${target.name} is stunned!`;
        break;
    }

    return result;
  }

  // Apply status effects
  applyStatusEffect(target, effect) {
    target.effects.push({
      type: effect.type,
      duration: effect.duration || 1,
      multiplier: effect.multiplier || 1,
      turnsRemaining: effect.duration || 1
    });
  }

  // Update effects and cooldowns
  updateEffects(battleState) {
    const allCards = [...battleState.playerTeam, ...battleState.aiTeam];
    
    allCards.forEach(card => {
      // Update cooldowns
      Object.keys(card.abilityCooldowns).forEach(ability => {
        if (card.abilityCooldowns[ability] > 0) {
          card.abilityCooldowns[ability]--;
        }
      });
      
      // Update status effects
      card.effects = card.effects.filter(effect => {
        effect.turnsRemaining--;
        return effect.turnsRemaining > 0;
      });
    });
  }

  // Check if battle has ended
  checkBattleEnd(battleState) {
    const playerAlive = battleState.playerTeam.some(card => card.isAlive);
    const aiAlive = battleState.aiTeam.some(card => card.isAlive);
    
    if (!playerAlive) {
      battleState.phase = 'ended';
      battleState.winner = 'ai';
      console.log('Battle ended - all player cards defeated');
    } else if (!aiAlive) {
      battleState.phase = 'ended';
      battleState.winner = 'player';
      console.log('Battle ended - all AI cards defeated');
    } else if (battleState.turn > 50) {
      battleState.phase = 'ended';
      battleState.winner = 'draw';
      console.log('Battle ended - turn limit reached');
    }
    
    return battleState;
  }

  // Generate battle visual
  async generateBattleImage(battleState) {
    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Turn ${battleState.turn} - ${battleState.phase}`, 600, 50);
    
    // Player team (left side)
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Your Team', 50, 100);
    
    battleState.playerTeam.forEach((card, index) => {
      const y = 150 + (index * 120);
      const color = card.isAlive ? '#ffffff' : '#666666';
      
      ctx.fillStyle = color;
      ctx.font = '18px Arial';
      ctx.fillText(card.name, 50, y);
      ctx.fillText(`${card.class} - ${card.assignedAbility}`, 50, y + 20);
      ctx.fillText(`HP: ${card.stats.hp}/${card.stats.maxHp}`, 50, y + 40);
      ctx.fillText(`ATK: ${card.stats.attack} DEF: ${card.stats.defense} SPD: ${card.stats.speed}`, 50, y + 60);
      
      // HP bar
      const hpPercent = card.stats.hp / card.stats.maxHp;
      ctx.fillStyle = '#333333';
      ctx.fillRect(50, y + 70, 200, 20);
      ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(50, y + 70, 200 * hpPercent, 20);
    });
    
    // AI team (right side)
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('AI Team', 1150, 100);
    
    battleState.aiTeam.forEach((card, index) => {
      const y = 150 + (index * 120);
      const color = card.isAlive ? '#ffffff' : '#666666';
      
      ctx.fillStyle = color;
      ctx.font = '18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(card.name, 1150, y);
      ctx.fillText(`${card.class} - ${card.assignedAbility}`, 1150, y + 20);
      ctx.fillText(`HP: ${card.stats.hp}/${card.stats.maxHp}`, 1150, y + 40);
      ctx.fillText(`ATK: ${card.stats.attack} DEF: ${card.stats.defense} SPD: ${card.stats.speed}`, 1150, y + 60);
      
      // HP bar
      const hpPercent = card.stats.hp / card.stats.maxHp;
      ctx.fillStyle = '#333333';
      ctx.fillRect(950, y + 70, 200, 20);
      ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(950, y + 70, 200 * hpPercent, 20);
    });
    
    return canvas.toBuffer();
  }
}

module.exports = NewBattleSystem;