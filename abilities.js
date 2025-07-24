// Base abilities system with 20 core abilities
const abilities = {
  // Damage abilities
  'power_strike': {
    name: 'Power Strike',
    type: 'damage',
    classes: ['Damage', 'Tank'],
    baseEffect: 'direct_damage',
    multiplier: 1.2,
    description: 'Deals 120% attack damage'
  },
  
  'quick_attack': {
    name: 'Quick Attack',
    type: 'damage',
    classes: ['Damage', 'Intel'],
    baseEffect: 'direct_damage',
    multiplier: 0.8,
    description: 'Deals 80% attack damage with priority'
  },
  
  'berserker_rage': {
    name: 'Berserker Rage',
    type: 'damage',
    classes: ['Damage'],
    baseEffect: 'multi_hit',
    hits: 3,
    multiplier: 0.6,
    description: 'Attacks 3 times for 60% damage each'
  },
  
  'critical_strike': {
    name: 'Critical Strike',
    type: 'damage',
    classes: ['Damage', 'Intel'],
    baseEffect: 'critical_damage',
    multiplier: 2.0,
    description: 'High chance for double damage'
  },
  
  // Control abilities
  'stun_lock': {
    name: 'Stun Lock',
    type: 'control',
    classes: ['Tank', 'Intel'],
    baseEffect: 'miss_turn',
    duration: 1,
    description: 'Target misses their next turn'
  },
  
  'freeze': {
    name: 'Freeze',
    type: 'control',
    classes: ['Intel', 'Support'],
    baseEffect: 'miss_turn',
    duration: 1,
    description: 'Freezes target, causing them to miss next turn'
  },
  
  'confuse': {
    name: 'Confuse',
    type: 'control',
    classes: ['Intel'],
    baseEffect: 'debuff_accuracy',
    duration: 2,
    value: 0.5,
    description: 'Reduces target accuracy by 50% for 2 turns'
  },
  
  'taunt': {
    name: 'Taunt',
    type: 'control',
    classes: ['Tank'],
    baseEffect: 'force_target',
    duration: 2,
    description: 'Forces enemies to target this card for 2 turns'
  },
  
  // Healing/Support abilities
  'regenerate': {
    name: 'Regenerate',
    type: 'healing',
    classes: ['Tank', 'Support'],
    baseEffect: 'heal_self',
    multiplier: 0.2,
    description: 'Restores 20% of max HP'
  },
  
  'heal': {
    name: 'Heal',
    type: 'healing',
    classes: ['Support'],
    baseEffect: 'heal_target',
    multiplier: 0.3,
    description: 'Restores 30% of target\'s max HP'
  },
  
  'life_steal': {
    name: 'Life Steal',
    type: 'healing',
    classes: ['Damage', 'Support'],
    baseEffect: 'drain_hp',
    multiplier: 0.1,
    description: 'Deals damage and heals for 10% of target\'s max HP'
  },
  
  // Buff abilities
  'power_boost': {
    name: 'Power Boost',
    type: 'buff',
    classes: ['Support', 'Damage'],
    baseEffect: 'buff_attack',
    duration: 3,
    multiplier: 1.3,
    description: 'Increases attack by 30% for 3 turns'
  },
  
  'shield': {
    name: 'Shield',
    type: 'buff',
    classes: ['Tank', 'Support'],
    baseEffect: 'buff_defense',
    duration: 3,
    multiplier: 1.5,
    description: 'Increases defense by 50% for 3 turns'
  },
  
  'speed_boost': {
    name: 'Speed Boost',
    type: 'buff',
    classes: ['Intel', 'Support'],
    baseEffect: 'buff_speed',
    duration: 3,
    multiplier: 1.4,
    description: 'Increases speed by 40% for 3 turns'
  },
  
  // Debuff abilities
  'weaken': {
    name: 'Weaken',
    type: 'debuff',
    classes: ['Intel', 'Support'],
    baseEffect: 'debuff_attack',
    duration: 3,
    multiplier: 0.7,
    description: 'Reduces target attack by 30% for 3 turns'
  },
  
  'armor_break': {
    name: 'Armor Break',
    type: 'debuff',
    classes: ['Damage', 'Intel'],
    baseEffect: 'debuff_defense',
    duration: 3,
    multiplier: 0.6,
    description: 'Reduces target defense by 40% for 3 turns'
  },
  
  'slow': {
    name: 'Slow',
    type: 'debuff',
    classes: ['Intel', 'Support'],
    baseEffect: 'debuff_speed',
    duration: 3,
    multiplier: 0.6,
    description: 'Reduces target speed by 40% for 3 turns'
  },
  
  // Special abilities
  'analyze': {
    name: 'Analyze',
    type: 'special',
    classes: ['Intel'],
    baseEffect: 'reveal_stats',
    description: 'Reveals enemy stats and abilities'
  },
  
  'counter': {
    name: 'Counter',
    type: 'special',
    classes: ['Tank', 'Intel'],
    baseEffect: 'reflect_damage',
    multiplier: 0.5,
    description: 'Reflects 50% of received damage back to attacker'
  },
  
  'sacrifice': {
    name: 'Sacrifice',
    type: 'special',
    classes: ['Support'],
    baseEffect: 'sacrifice_heal',
    multiplier: 0.5,
    description: 'Sacrifices 50% current HP to fully heal ally'
  }
};

// Character-specific ability flavors
const characterFlavors = {
  'Itachi Uchiha': {
    'stun_lock': 'Itachi casts Tsukuyomi, trapping you in an endless nightmare. You miss your next turn.',
    'analyze': 'Itachi\'s Sharingan sees through your moves, revealing your abilities.',
    'critical_strike': 'Itachi\'s precise kunai strike finds a vital point for massive damage.'
  },
  
  'Douma': {
    'freeze': 'Douma\'s Blood Demon Art freezes you in crystalline ice. You miss your next turn.',
    'life_steal': 'Douma\'s freezing breath drains your life force into his own.',
    'slow': 'The bitter cold slows your movements significantly.'
  },
  
  'Makima': {
    'life_steal': 'Makima\'s blood-sucking gaze drains your life into her veins.',
    'confuse': 'Makima\'s mind control leaves you disoriented and confused.',
    'power_boost': 'Makima commands your power to serve her purposes.'
  },
  
  'Naruto Uzumaki': {
    'berserker_rage': 'Naruto unleashes a barrage of Shadow Clone attacks!',
    'power_boost': 'Naruto taps into the Nine-Tails\' chakra, boosting his power!',
    'regenerate': 'The Nine-Tails\' healing factor restores Naruto\'s wounds.'
  },
  
  'Goku': {
    'power_strike': 'Goku charges up a devastating Kamehameha wave!',
    'speed_boost': 'Goku enters Super Saiyan mode, increasing his speed!',
    'critical_strike': 'Goku\'s fighting instincts find the perfect opening!'
  },
  
  'Light Yagami': {
    'analyze': 'Light calculates every possibility with his genius intellect.',
    'confuse': 'Light\'s psychological manipulation leaves you uncertain.',
    'stun_lock': 'Light\'s strategic planning leaves you unable to act.'
  },
  
  'Levi Ackerman': {
    'quick_attack': 'Levi\'s ODM gear allows for lightning-fast strikes!',
    'critical_strike': 'Levi\'s blade finds the perfect angle for maximum damage.',
    'counter': 'Levi\'s combat experience allows him to turn your attack against you.'
  },
  
  'Edward Elric': {
    'armor_break': 'Edward transmutes your armor into useless metal.',
    'analyze': 'Edward\'s alchemical knowledge reveals the composition of your defenses.',
    'shield': 'Edward transmutes the ground into a protective barrier.'
  }
};

// Get random ability for class
function getRandomAbilityForClass(cardClass) {
  const classAbilities = Object.keys(abilities).filter(key => 
    abilities[key].classes.includes(cardClass)
  );
  return classAbilities[Math.floor(Math.random() * classAbilities.length)];
}

// Get ability details
function getAbilityDetails(abilityKey) {
  return abilities[abilityKey];
}

// Get ability name
function getAbilityName(abilityKey) {
  return abilities[abilityKey]?.name || 'Unknown Ability';
}

// Get flavor text for character ability
function getFlavorText(characterName, abilityKey) {
  const character = characterFlavors[characterName];
  if (character && character[abilityKey]) {
    return character[abilityKey];
  }
  return abilities[abilityKey]?.description || 'Unknown effect';
}

// Get ability list for display
function getAbilityList(classFilter = null) {
  const abilityList = [];
  
  Object.keys(abilities).forEach(key => {
    const ability = abilities[key];
    if (!classFilter || ability.classes.includes(classFilter)) {
      abilityList.push({
        key,
        name: ability.name,
        description: ability.description,
        classes: ability.classes,
        type: ability.type
      });
    }
  });
  
  return abilityList;
}

// Calculate ability damage
function calculateAbilityDamage(ability, attackerStats, defenderStats) {
  const baseAttack = attackerStats.attack;
  const defense = defenderStats.defense;
  
  let damage = 0;
  
  switch (ability.baseEffect) {
    case 'direct_damage':
      damage = Math.max(1, Math.floor((baseAttack * ability.multiplier) - (defense * 0.5)));
      break;
    case 'multi_hit':
      damage = Math.max(1, Math.floor((baseAttack * ability.multiplier) - (defense * 0.3))) * ability.hits;
      break;
    case 'critical_damage':
      const critChance = Math.random();
      const multiplier = critChance < 0.3 ? ability.multiplier : 1.0;
      damage = Math.max(1, Math.floor((baseAttack * multiplier) - (defense * 0.5)));
      break;
    case 'drain_hp':
      damage = Math.floor(defenderStats.maxHp * ability.multiplier);
      break;
    default:
      damage = 0;
  }
  
  return Math.max(0, damage);
}

// Apply ability effect
function applyAbilityEffect(ability, attacker, defender) {
  const effect = {
    damage: 0,
    healing: 0,
    effects: []
  };
  
  switch (ability.baseEffect) {
    case 'direct_damage':
    case 'multi_hit':
    case 'critical_damage':
      effect.damage = calculateAbilityDamage(ability, attacker.stats, defender.stats);
      break;
      
    case 'heal_self':
      effect.healing = Math.floor(attacker.stats.maxHp * ability.multiplier);
      break;
      
    case 'heal_target':
      effect.healing = Math.floor(defender.stats.maxHp * ability.multiplier);
      break;
      
    case 'drain_hp':
      effect.damage = Math.floor(defender.stats.maxHp * ability.multiplier);
      effect.healing = effect.damage;
      break;
      
    case 'miss_turn':
      effect.effects.push({
        type: 'stun',
        duration: ability.duration || 1,
        target: 'defender'
      });
      break;
      
    case 'buff_attack':
    case 'buff_defense':
    case 'buff_speed':
      effect.effects.push({
        type: ability.baseEffect,
        duration: ability.duration,
        multiplier: ability.multiplier,
        target: 'attacker'
      });
      break;
      
    case 'debuff_attack':
    case 'debuff_defense':
    case 'debuff_speed':
      effect.effects.push({
        type: ability.baseEffect,
        duration: ability.duration,
        multiplier: ability.multiplier,
        target: 'defender'
      });
      break;
      
    case 'reflect_damage':
      effect.effects.push({
        type: 'reflect',
        multiplier: ability.multiplier,
        target: 'attacker'
      });
      break;
  }
  
  return effect;
}

// Get ability data by name (for AI battle system)
function getAbilityByName(abilityName) {
  return abilities[abilityName] || null;
}

module.exports = {
  abilities,
  characterFlavors,
  getRandomAbilityForClass,
  getAbilityDetails,
  getAbilityName,
  getFlavorText,
  getAbilityList,
  calculateAbilityDamage,
  applyAbilityEffect,
  getAbilityByName
};
