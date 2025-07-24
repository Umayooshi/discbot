const mongoose = require('mongoose');

// Get existing schemas - use lazy loading to avoid circular dependencies
const getPlayer = () => mongoose.model('Player');

// Mission types and their configurations
const missionTypes = {
  'win_battles': {
    name: 'Victory Seeker',
    description: 'Win battles',
    baseTarget: 3,
    baseReward: 150,
    icon: '🏆'
  },
  'train_cards': {
    name: 'Trainer',
    description: 'Train your cards',
    baseTarget: 5,
    baseReward: 100,
    icon: '🏃'
  },
  'use_abilities': {
    name: 'Ability Master',
    description: 'Use abilities in battle',
    baseTarget: 10,
    baseReward: 125,
    icon: '⚡'
  },
  'level_up_cards': {
    name: 'Level Up',
    description: 'Level up cards',
    baseTarget: 1,
    baseReward: 200,
    icon: '📈'
  },
  'collect_cards': {
    name: 'Collector',
    description: 'Pull new cards',
    baseTarget: 5,
    baseReward: 100,
    icon: '🎴'
  },
  'deal_damage': {
    name: 'Damage Dealer',
    description: 'Deal damage in battles',
    baseTarget: 1000,
    baseReward: 125,
    icon: '💥'
  },
  'heal_damage': {
    name: 'Healer',
    description: 'Heal HP with abilities',
    baseTarget: 500,
    baseReward: 110,
    icon: '💚'
  },
  'survive_battles': {
    name: 'Survivor',
    description: 'Survive battles with low HP',
    baseTarget: 2,
    baseReward: 175,
    icon: '🛡️'
  }
};

// Generate daily missions for a player
function generateDailyMissions(playerLevel = 1) {
  const selectedMissions = [];
  const missionKeys = Object.keys(missionTypes);
  
  // Always include win_battles and train_cards
  selectedMissions.push('win_battles', 'train_cards');
  
  // Add 2-3 random missions
  const remainingMissions = missionKeys.filter(key => !selectedMissions.includes(key));
  const numAdditionalMissions = Math.floor(Math.random() * 2) + 2; // 2-3 additional missions
  
  for (let i = 0; i < numAdditionalMissions && remainingMissions.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * remainingMissions.length);
    selectedMissions.push(remainingMissions[randomIndex]);
    remainingMissions.splice(randomIndex, 1);
  }
  
  // Create mission objects with scaling based on player level
  return selectedMissions.map(missionKey => {
    const missionConfig = missionTypes[missionKey];
    const levelMultiplier = Math.max(1, Math.floor(playerLevel / 10));
    
    return {
      type: missionKey,
      name: missionConfig.name,
      description: missionConfig.description,
      progress: 0,
      target: Math.floor(missionConfig.baseTarget * levelMultiplier),
      completed: false,
      reward: Math.floor(missionConfig.baseReward * levelMultiplier),
      icon: missionConfig.icon
    };
  });
}

// Get or create daily missions for a player
async function getDailyMissions(player) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if missions need to be reset
  if (!player.missions.lastReset || player.missions.lastReset < today) {
    player.missions.daily = generateDailyMissions(player.level);
    player.missions.lastReset = today;
    await player.save();
  }
  
  return player.missions.daily;
}

// Update mission progress
async function updateMissionProgress(player, missionType, amount = 1) {
  const missions = await getDailyMissions(player);
  let updated = false;
  
  missions.forEach(mission => {
    if (mission.type === missionType && !mission.completed) {
      mission.progress += amount;
      if (mission.progress >= mission.target) {
        mission.completed = true;
        player.xp += mission.reward;
        player.currency += Math.floor(mission.reward * 0.5); // Bonus currency
      }
      updated = true;
    }
  });
  
  if (updated) {
    await player.save();
  }
  
  return missions;
}

// Complete a mission manually (for testing or special events)
async function completeMission(player, missionType) {
  const missions = await getDailyMissions(player);
  
  const mission = missions.find(m => m.type === missionType && !m.completed);
  if (mission) {
    mission.completed = true;
    mission.progress = mission.target;
    player.xp += mission.reward;
    player.currency += Math.floor(mission.reward * 0.5);
    await player.save();
    return true;
  }
  
  return false;
}

// Get mission progress summary
function getMissionSummary(missions) {
  const completed = missions.filter(m => m.completed).length;
  const total = missions.length;
  const totalRewards = missions.reduce((sum, m) => sum + (m.completed ? m.reward : 0), 0);
  
  return {
    completed,
    total,
    totalRewards,
    completionRate: Math.floor((completed / total) * 100)
  };
}

// Weekly mission system (more challenging)
const weeklyMissionTypes = {
  'weekly_wins': {
    name: 'Weekly Champion',
    description: 'Win 20 battles this week',
    target: 20,
    reward: 1000,
    icon: '👑'
  },
  'weekly_training': {
    name: 'Training Master',
    description: 'Train cards 30 times this week',
    target: 30,
    reward: 750,
    icon: '🎯'
  },
  'weekly_levels': {
    name: 'Level Grinder',
    description: 'Level up cards 10 times this week',
    target: 10,
    reward: 1250,
    icon: '🚀'
  },
  'weekly_collection': {
    name: 'Card Collector',
    description: 'Pull 25 new cards this week',
    target: 25,
    reward: 800,
    icon: '🃏'
  }
};

// Generate weekly missions
function generateWeeklyMissions(playerLevel = 1) {
  const missionKeys = Object.keys(weeklyMissionTypes);
  const selectedMissions = [];
  
  // Select 2-3 weekly missions
  const numMissions = Math.floor(Math.random() * 2) + 2;
  
  for (let i = 0; i < numMissions && missionKeys.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * missionKeys.length);
    selectedMissions.push(missionKeys[randomIndex]);
    missionKeys.splice(randomIndex, 1);
  }
  
  return selectedMissions.map(missionKey => {
    const missionConfig = weeklyMissionTypes[missionKey];
    const levelMultiplier = Math.max(1, Math.floor(playerLevel / 5));
    
    return {
      type: missionKey,
      name: missionConfig.name,
      description: missionConfig.description,
      progress: 0,
      target: Math.floor(missionConfig.target * levelMultiplier),
      completed: false,
      reward: Math.floor(missionConfig.reward * levelMultiplier),
      icon: missionConfig.icon
    };
  });
}

// Get available mission types for tracking
function getMissionTypes() {
  return Object.keys(missionTypes);
}

// Check if all daily missions are completed
function allDailyMissionsCompleted(missions) {
  return missions.length > 0 && missions.every(m => m.completed);
}

// Calculate bonus rewards for completing all missions
function calculateCompletionBonus(missions) {
  const totalReward = missions.reduce((sum, m) => sum + m.reward, 0);
  return Math.floor(totalReward * 0.5); // 50% bonus for completing all
}

module.exports = {
  generateDailyMissions,
  getDailyMissions,
  updateMissionProgress,
  completeMission,
  getMissionSummary,
  generateWeeklyMissions,
  getMissionTypes,
  allDailyMissionsCompleted,
  calculateCompletionBonus,
  missionTypes
};
