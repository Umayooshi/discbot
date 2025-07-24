// Class system for cards with balanced stats and growth
const classes = {
  'Tank': {
    name: 'Tank',
    description: 'High HP and Defense, focuses on survival and protection',
    color: '#4A90E2', // Blue
    baseStats: {
      hp: 1500,
      maxHp: 1500,
      attack: 500,
      defense: 800,
      speed: 50
    },
    statGrowth: {
      hp: 50,
      attack: 10,
      defense: 10,
      speed: 2
    },
    abilities: ['regenerate', 'shield', 'taunt', 'counter'],
    strengths: ['High survivability', 'Damage reduction', 'Team protection'],
    weaknesses: ['Low damage output', 'Slow speed']
  },
  
  'Damage': {
    name: 'Damage',
    description: 'High Attack power, focuses on dealing damage',
    color: '#E74C3C', // Red
    baseStats: {
      hp: 1000,
      maxHp: 1000,
      attack: 800,
      defense: 500,
      speed: 70
    },
    statGrowth: {
      hp: 30,
      attack: 15,
      defense: 5,
      speed: 3
    },
    abilities: ['power_strike', 'berserker_rage', 'critical_strike', 'life_steal'],
    strengths: ['High damage output', 'Good speed', 'Offensive abilities'],
    weaknesses: ['Lower HP', 'Moderate defense']
  },
  
  'Support': {
    name: 'Support',
    description: 'Balanced stats with healing and buff abilities',
    color: '#2ECC71', // Green
    baseStats: {
      hp: 1200,
      maxHp: 1200,
      attack: 600,
      defense: 600,
      speed: 60
    },
    statGrowth: {
      hp: 30,
      attack: 15,
      defense: 15,
      speed: 3
    },
    abilities: ['heal', 'power_boost', 'shield', 'sacrifice'],
    strengths: ['Team utility', 'Healing abilities', 'Balanced stats'],
    weaknesses: ['Jack of all trades', 'Master of none']
  },
  
  'Intel': {
    name: 'Intel',
    description: 'High Speed and strategic abilities, focuses on control',
    color: '#9B59B6', // Purple
    baseStats: {
      hp: 1100,
      maxHp: 1100,
      attack: 700,
      defense: 550,
      speed: 80
    },
    statGrowth: {
      hp: 20,
      attack: 20,
      defense: 10,
      speed: 20
    },
    abilities: ['analyze', 'confuse', 'stun_lock', 'quick_attack'],
    strengths: ['High speed', 'Control abilities', 'Strategic advantage'],
    weaknesses: ['Lower HP', 'Moderate defense']
  }
};

// Character class assignments based on their traits
const characterClassAssignments = {
  // Tank characters - High durability, defensive
  'Monkey D. Luffy': 'Tank',
  'Levi Ackerman': 'Tank',
  'Giorno Giovanna': 'Tank',
  'Jotaro Kujo': 'Tank',
  'Tanjiro Kamado': 'Tank',
  'Meliodas': 'Tank',
  'Asta': 'Tank',
  'Natsu Dragneel': 'Tank',
  'Rimuru Tempest': 'Tank',
  'Ainz Ooal Gown': 'Tank',
  
  // Damage characters - High attack, offensive
  'Goku': 'Damage',
  'Saitama': 'Damage',
  'Ichigo Kurosaki': 'Damage',
  'Naruto Uzumaki': 'Damage',
  'Spike Spiegel': 'Damage',
  'Yuji Itadori': 'Damage',
  'Gon Freecss': 'Damage',
  'Yusuke Urameshi': 'Damage',
  'Ken Kaneki': 'Damage',
  'Denji': 'Damage',
  
  // Support characters - Healing, buffs, utility
  'Izuku Midoriya': 'Support',
  'Shoyo Hinata': 'Support',
  'Senku Ishigami': 'Support',
  'Loid Forger': 'Support',
  'Shinji Ikari': 'Support',
  'Nezuko Kamado': 'Support',
  'Ochaco Uraraka': 'Support',
  'Sakura Haruno': 'Support',
  'Inoue Orihime': 'Support',
  'Wendy Marvell': 'Support',
  
  // Intel characters - Strategy, control, high speed
  'Light Yagami': 'Intel',
  'Edward Elric': 'Intel',
  'Shigeo Kageyama': 'Intel',
  'Gintoki Sakata': 'Intel',
  'Satoru Gojo': 'Intel',
  'Kakashi Hatake': 'Intel',
  'Itachi Uchiha': 'Intel',
  'Lelouch vi Britannia': 'Intel',
  'L': 'Intel',
  'Senku Ishigami': 'Intel'
};

// Series-based class tendencies
const seriesClassTendencies = {
  'Dragon Ball': ['Damage', 'Tank'],
  'One Piece': ['Tank', 'Damage'],
  'Naruto': ['Damage', 'Intel'],
  'Bleach': ['Damage', 'Intel'],
  'Attack on Titan': ['Tank', 'Intel'],
  'My Hero Academia': ['Support', 'Damage'],
  'Demon Slayer': ['Tank', 'Support'],
  'Jujutsu Kaisen': ['Damage', 'Intel'],
  'Death Note': ['Intel'],
  'Fullmetal Alchemist': ['Intel', 'Support'],
  'One Punch Man': ['Damage'],
  'Mob Psycho 100': ['Intel', 'Support'],
  'Hunter x Hunter': ['Intel', 'Damage'],
  'JoJo\'s Bizarre Adventure': ['Tank', 'Damage'],
  'Tokyo Ghoul': ['Damage', 'Intel'],
  'Cowboy Bebop': ['Damage', 'Intel'],
  'Neon Genesis Evangelion': ['Support', 'Intel'],
  'Spy x Family': ['Intel', 'Support'],
  'Dr. Stone': ['Intel', 'Support'],
  'Haikyuu!!': ['Support', 'Tank'],
  'Gintama': ['Intel', 'Damage']
};

// Get base stats for a class
function getBaseStats(className) {
  const classData = classes[className];
  return classData ? { ...classData.baseStats } : { ...classes['Damage'].baseStats };
}

// Get stat growth for a class
function getStatGrowth(className) {
  const classData = classes[className];
  return classData ? { ...classData.statGrowth } : { ...classes['Damage'].statGrowth };
}

// Get class color for embeds
function getClassColor(className) {
  const classData = classes[className];
  return classData ? classData.color : classes['Damage'].color;
}

// Assign class to a character
function assignClass(characterName, seriesName) {
  // Check direct character assignment first
  if (characterClassAssignments[characterName]) {
    return characterClassAssignments[characterName];
  }
  
  // Check series tendencies
  if (seriesClassTendencies[seriesName]) {
    const tendencies = seriesClassTendencies[seriesName];
    return tendencies[Math.floor(Math.random() * tendencies.length)];
  }
  
  // Default weighted random assignment to avoid too many damage classes
  const classWeights = {
    'Tank': 25,
    'Damage': 35,
    'Support': 25,
    'Intel': 15
  };
  
  const random = Math.random() * 100;
  let currentWeight = 0;
  
  for (const [className, weight] of Object.entries(classWeights)) {
    currentWeight += weight;
    if (random <= currentWeight) {
      return className;
    }
  }
  
  return 'Damage'; // Fallback
}

// Get class information
function getClassInfo(className) {
  return classes[className] || classes['Damage'];
}

// Get all available classes
function getAllClasses() {
  return Object.keys(classes);
}

// Calculate class distribution in a collection
function calculateClassDistribution(cards) {
  const distribution = {
    'Tank': 0,
    'Damage': 0,
    'Support': 0,
    'Intel': 0
  };
  
  cards.forEach(card => {
    if (distribution.hasOwnProperty(card.class)) {
      distribution[card.class]++;
    }
  });
  
  return distribution;
}

// Get recommended team composition
function getRecommendedTeamComposition() {
  return {
    'Tank': 1,
    'Damage': 2,
    'Support': 1,
    'Intel': 1
  };
}

// Check if team composition is balanced
function isTeamBalanced(team) {
  const distribution = calculateClassDistribution(team);
  const recommended = getRecommendedTeamComposition();
  
  // Check if we have at least one of each role
  return Object.keys(recommended).every(className => distribution[className] > 0);
}

// Get class effectiveness against another class
function getClassEffectiveness(attackerClass, defenderClass) {
  const effectiveness = {
    'Tank': { 'Damage': 1.2, 'Support': 0.9, 'Intel': 1.1, 'Tank': 1.0 },
    'Damage': { 'Support': 1.2, 'Intel': 1.1, 'Tank': 0.9, 'Damage': 1.0 },
    'Support': { 'Tank': 1.2, 'Damage': 0.9, 'Intel': 1.1, 'Support': 1.0 },
    'Intel': { 'Tank': 1.2, 'Damage': 1.1, 'Support': 0.9, 'Intel': 1.0 }
  };
  
  return effectiveness[attackerClass]?.[defenderClass] || 1.0;
}

// Get class description for display
function getClassDescription(className) {
  const classData = classes[className];
  if (!classData) return 'Unknown class';
  
  return `**${classData.name}**\n${classData.description}\n\n` +
         `**Base Stats:**\n` +
         `HP: ${classData.baseStats.hp}\n` +
         `ATK: ${classData.baseStats.attack}\n` +
         `DEF: ${classData.baseStats.defense}\n` +
         `SPD: ${classData.baseStats.speed}\n\n` +
         `**Strengths:** ${classData.strengths.join(', ')}\n` +
         `**Weaknesses:** ${classData.weaknesses.join(', ')}`;
}

// Suggest class for unknown character
function suggestClassForCharacter(characterName, seriesName) {
  // Analyze character name for keywords
  const name = characterName.toLowerCase();
  
  // Tank indicators
  if (name.includes('tank') || name.includes('shield') || name.includes('armor') || 
      name.includes('guard') || name.includes('defender')) {
    return 'Tank';
  }
  
  // Intel indicators
  if (name.includes('genius') || name.includes('smart') || name.includes('brain') ||
      name.includes('strategist') || name.includes('analyst')) {
    return 'Intel';
  }
  
  // Support indicators
  if (name.includes('healer') || name.includes('medic') || name.includes('support') ||
      name.includes('helper') || name.includes('cleric')) {
    return 'Support';
  }
  
  // Default to series tendency or random
  return assignClass(characterName, seriesName);
}

module.exports = {
  classes,
  characterClassAssignments,
  seriesClassTendencies,
  getBaseStats,
  getStatGrowth,
  getClassColor,
  assignClass,
  getClassInfo,
  getAllClasses,
  calculateClassDistribution,
  getRecommendedTeamComposition,
  isTeamBalanced,
  getClassEffectiveness,
  getClassDescription,
  suggestClassForCharacter
};
