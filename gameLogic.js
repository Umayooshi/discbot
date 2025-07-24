const mongoose = require('mongoose');
const classSystem = require('./classSystem');
const abilities = require('./abilities');

// Get existing schemas - use lazy loading to avoid circular dependencies
const getCard = () => mongoose.model('Card');
const getPlayer = () => mongoose.model('Player');

// Calculate required XP for next level
function getRequiredXP(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Level up card logic
async function levelUpCard(card) {
  const requiredXP = getRequiredXP(card.level);
  if (card.xp >= requiredXP && card.level < 100) {
    card.xp -= requiredXP;
    card.level++;
    
    // Apply class-based stat increases
    const statGrowth = classSystem.getStatGrowth(card.class);
    card.stats.maxHp += statGrowth.hp;
    card.stats.hp = card.stats.maxHp; // Full heal on level up
    card.stats.attack += statGrowth.attack;
    card.stats.defense += statGrowth.defense;
    card.stats.speed += statGrowth.speed;
    
    // Unlock new abilities at milestone levels
    if (card.level === 10 || card.level === 25 || card.level === 50) {
      const newAbility = abilities.getRandomAbilityForClass(card.class);
      if (!card.abilities.includes(newAbility)) {
        card.abilities.push(newAbility);
      }
    }
    
    await card.save();
    return true;
  }
  return false;
}

// Calculate card power level (for matchmaking)
function calculatePowerLevel(card) {
  const stats = card.stats;
  const level = card.level;
  const abilities = (card.abilities || []).length;
  
  return Math.floor(
    (stats.hp * 0.3) +
    (stats.attack * 0.4) +
    (stats.defense * 0.2) +
    (stats.speed * 0.1) +
    (level * 10) +
    (abilities * 15)
  );
}

// Get card effectiveness against another card
function getTypeEffectiveness(attackerClass, defenderClass) {
  const effectiveness = {
    'Damage': { 'Support': 1.2, 'Intel': 1.1, 'Tank': 0.9, 'Damage': 1.0 },
    'Tank': { 'Damage': 1.2, 'Support': 0.9, 'Intel': 1.1, 'Tank': 1.0 },
    'Support': { 'Tank': 1.2, 'Damage': 0.9, 'Intel': 1.1, 'Support': 1.0 },
    'Intel': { 'Tank': 1.2, 'Damage': 1.1, 'Support': 0.9, 'Intel': 1.0 }
  };
  
  return effectiveness[attackerClass]?.[defenderClass] || 1.0;
}

// Apply status effects
function applyStatusEffects(card, effects) {
  let modifiedStats = { ...card.stats };
  
  effects.forEach(effect => {
    switch (effect.type) {
      case 'buff_attack':
        modifiedStats.attack = Math.floor(modifiedStats.attack * effect.multiplier);
        break;
      case 'buff_defense':
        modifiedStats.defense = Math.floor(modifiedStats.defense * effect.multiplier);
        break;
      case 'buff_speed':
        modifiedStats.speed = Math.floor(modifiedStats.speed * effect.multiplier);
        break;
      case 'debuff_attack':
        modifiedStats.attack = Math.floor(modifiedStats.attack * effect.multiplier);
        break;
      case 'debuff_defense':
        modifiedStats.defense = Math.floor(modifiedStats.defense * effect.multiplier);
        break;
      case 'debuff_speed':
        modifiedStats.speed = Math.floor(modifiedStats.speed * effect.multiplier);
        break;
    }
  });
  
  return modifiedStats;
}

// Simulate AI turn (for PvE battles)
function simulateAITurn(card, opponentCard) {
  const availableAbilities = card.abilities;
  if (availableAbilities.length === 0) return null;
  
  // Simple AI: prioritize healing if low HP, otherwise attack
  const hpPercentage = card.stats.hp / card.stats.maxHp;
  
  if (hpPercentage < 0.3) {
    // Look for healing abilities
    const healingAbilities = availableAbilities.filter(abilityKey => {
      const ability = abilities.getAbilityDetails(abilityKey);
      return ability.type === 'healing';
    });
    
    if (healingAbilities.length > 0) {
      return healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
    }
  }
  
  // Look for damage abilities
  const damageAbilities = availableAbilities.filter(abilityKey => {
    const ability = abilities.getAbilityDetails(abilityKey);
    return ability.type === 'damage';
  });
  
  if (damageAbilities.length > 0) {
    return damageAbilities[Math.floor(Math.random() * damageAbilities.length)];
  }
  
  // Random ability as fallback
  return availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
}

// Generate training rewards
function generateTrainingRewards(card) {
  const baseXP = 25;
  const levelBonus = Math.floor(card.level * 0.5);
  const randomBonus = Math.floor(Math.random() * 26); // 0-25
  
  return {
    xp: baseXP + levelBonus + randomBonus,
    currency: Math.floor(Math.random() * 10) + 5 // 5-15 currency
  };
}

// Calculate mission progress
function updateMissionProgress(player, missionType, amount = 1) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Reset daily missions if needed
  if (!player.missions.lastReset || player.missions.lastReset < today) {
    player.missions.daily = generateDailyMissions();
    player.missions.lastReset = today;
  }
  
  // Update mission progress
  player.missions.daily.forEach(mission => {
    if (mission.type === missionType && !mission.completed) {
      mission.progress += amount;
      if (mission.progress >= mission.target) {
        mission.completed = true;
        player.xp += mission.reward;
      }
    }
  });
  
  return player.missions.daily;
}

// Generate daily missions
function generateDailyMissions() {
  const missionTypes = [
    { type: 'win_battles', target: 3, reward: 150 },
    { type: 'train_cards', target: 5, reward: 100 },
    { type: 'use_abilities', target: 10, reward: 125 },
    { type: 'level_up_cards', target: 1, reward: 200 }
  ];
  
  return missionTypes.map(mission => ({
    type: mission.type,
    progress: 0,
    target: mission.target,
    completed: false,
    reward: mission.reward
  }));
}

// Check if player can afford something
function canAfford(player, cost) {
  return player.currency >= cost;
}

// Deduct currency from player
function deductCurrency(player, amount) {
  player.currency = Math.max(0, player.currency - amount);
}

// Award currency to player
function awardCurrency(player, amount) {
  player.currency += amount;
}

// Calculate battle rewards
function calculateBattleRewards(winner, loser, battleType = '1v1') {
  const baseXP = battleType === '1v1' ? 50 : 75;
  const levelDifference = winner.level - loser.level;
  
  // Bonus XP for fighting higher level opponents
  const levelBonus = Math.max(0, levelDifference * 5);
  const winnerXP = baseXP + levelBonus + Math.floor(Math.random() * 26); // +0-25 random
  const loserXP = Math.floor(baseXP * 0.4) + Math.floor(Math.random() * 16); // 40% + 0-15 random
  
  const winnerCurrency = Math.floor(Math.random() * 20) + 10; // 10-30 currency
  const loserCurrency = Math.floor(Math.random() * 10) + 5; // 5-15 currency
  
  return {
    winner: { xp: winnerXP, currency: winnerCurrency },
    loser: { xp: loserXP, currency: loserCurrency }
  };
}

// Restore card HP over time
function restoreCardHP(card, hoursElapsed) {
  if (card.stats.hp < card.stats.maxHp) {
    const hpToRestore = Math.floor(card.stats.maxHp * 0.1 * hoursElapsed); // 10% per hour
    card.stats.hp = Math.min(card.stats.maxHp, card.stats.hp + hpToRestore);
    return true;
  }
  return false;
}

// Get card rarity based on level and stats
function getCardRarity(card) {
  const powerLevel = calculatePowerLevel(card);
  
  if (powerLevel >= 2000) return 'Legendary';
  if (powerLevel >= 1500) return 'Epic';
  if (powerLevel >= 1000) return 'Rare';
  if (powerLevel >= 500) return 'Common';
  return 'Basic';
}

module.exports = {
  getRequiredXP,
  levelUpCard,
  calculatePowerLevel,
  getTypeEffectiveness,
  applyStatusEffects,
  simulateAITurn,
  generateTrainingRewards,
  updateMissionProgress,
  generateDailyMissions,
  canAfford,
  deductCurrency,
  awardCurrency,
  calculateBattleRewards,
  restoreCardHP,
  getCardRarity
};
