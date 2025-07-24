# Complete Battle System Architecture

## 1. CLASS SYSTEM (classSystem.js)
```javascript
const classes = {
  'Tank': {
    baseStats: { hp: 1500, attack: 500, defense: 800, speed: 50 },
    abilities: ['regenerate', 'shield', 'taunt', 'counter']
  },
  'Damage': {
    baseStats: { hp: 1000, attack: 800, defense: 500, speed: 70 },
    abilities: ['power_strike', 'berserker_rage', 'critical_strike', 'life_steal']
  },
  'Support': {
    baseStats: { hp: 1200, attack: 600, defense: 600, speed: 60 },
    abilities: ['heal', 'power_boost', 'shield', 'sacrifice']
  },
  'Intel': {
    baseStats: { hp: 1100, attack: 700, defense: 550, speed: 80 },
    abilities: ['stun', 'weaken', 'analyze', 'teleport']
  }
};
```

## 2. ABILITIES SYSTEM (abilities.js)
```javascript
// 20 Core Abilities
const abilities = {
  // DAMAGE ABILITIES
  'power_strike': { multiplier: 1.2, description: 'Deals 120% attack damage' },
  'quick_attack': { multiplier: 0.8, description: '80% damage with priority' },
  'berserker_rage': { hits: 3, multiplier: 0.6, description: '3 hits at 60% each' },
  'critical_strike': { multiplier: 2.0, description: 'High chance double damage' },
  'life_steal': { multiplier: 1.0, heal: 0.5, description: 'Heal for 50% damage dealt' },
  
  // CONTROL ABILITIES
  'stun_lock': { duration: 1, description: 'Target misses next turn' },
  'freeze': { duration: 1, description: 'Freeze target' },
  'confuse': { duration: 2, accuracy: 0.5, description: 'Reduce accuracy 50%' },
  'taunt': { duration: 2, description: 'Force target self' },
  'weaken': { duration: 3, attack_reduction: 0.3, description: 'Reduce attack 30%' },
  
  // SUPPORT ABILITIES
  'heal': { heal_amount: 150, description: 'Restore 150 HP' },
  'greater_heal': { heal_amount: 300, description: 'Restore 300 HP' },
  'revive': { hp_restore: 0.25, description: 'Revive ally with 25% HP' },
  'blessing': { duration: 3, stat_boost: 1.2, description: 'Boost all stats 20%' },
  'sanctuary': { duration: 2, damage_reduction: 0.5, description: 'Reduce damage 50%' },
  
  // TANK ABILITIES
  'shield': { duration: 2, damage_reduction: 0.4, description: 'Reduce damage 40%' },
  'armor': { duration: 3, defense_boost: 50, description: 'Increase defense +50' },
  'slam': { multiplier: 0.9, stun: true, description: '90% damage + stun' },
  'charge': { multiplier: 1.3, self_damage: 0.1, description: '130% damage, 10% self damage' },
  'fortress': { duration: 4, team_defense: 25, description: 'Team +25 defense' }
};
```

## 3. PROFESSIONAL BATTLE SYSTEM (professional_battle_system.js)

### Canvas Image Generation:
```javascript
async generateBattleImage(battleState) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // Discord dark background
  ctx.fillStyle = '#2f3136';
  ctx.fillRect(0, 0, 800, 600);
  
  // GREEN TEAM SECTION
  ctx.fillStyle = '#43b581';
  ctx.fillRect(20, 20, 760, 30);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('🟢 Your Team', 30, 40);
  
  // Player Team HP Bars
  let yPos = 70;
  for (const card of battleState.playerTeam) {
    // HP Label
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('HP*', 30, yPos);
    
    // HP Bar Background
    ctx.fillStyle = '#4f545c';
    ctx.fillRect(30, yPos + 10, 300, 20);
    
    // HP Bar Fill (Discord Blue)
    const hpPercentage = card.stats.hp / card.stats.maxHp;
    ctx.fillStyle = '#5865f2';
    ctx.fillRect(30, yPos + 10, 300 * hpPercentage, 20);
    
    // HP Number (like 1026, 242, etc.)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(card.stats.hp.toString(), 350, yPos + 25);
    
    // Card Name and Class
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${card.name} - ${card.class}`, 30, yPos + 50);
    
    yPos += 80;
  }
  
  // RED AI TEAM SECTION
  yPos += 20;
  ctx.fillStyle = '#f04747';
  ctx.fillRect(20, yPos, 760, 30);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('🔴 AI Team', 30, yPos + 20);
  
  // AI Team HP Bars (same format)
  yPos += 50;
  for (const card of battleState.aiTeam) {
    // Same HP bar rendering as player team
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('HP*', 30, yPos);
    
    ctx.fillStyle = '#4f545c';
    ctx.fillRect(30, yPos + 10, 300, 20);
    
    const hpPercentage = card.stats.hp / card.stats.maxHp;
    ctx.fillStyle = '#5865f2';
    ctx.fillRect(30, yPos + 10, 300 * hpPercentage, 20);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(card.stats.hp.toString(), 350, yPos + 25);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${card.name} - ${card.class}`, 30, yPos + 50);
    
    yPos += 80;
  }
  
  return canvas.toBuffer('image/png');
}
```

### Battle State Management:
```javascript
startBattle(userId, playerCards) {
  const battleState = {
    id: `battle_${userId}_${Date.now()}`,
    userId: userId,
    playerTeam: playerCards.slice(0, 3).map(card => this.initializeCard(card, 'player')),
    aiTeam: await this.generateAITeam(playerCards).map(card => this.initializeCard(card, 'ai')),
    turn: 1,
    phase: 'active',
    battleLog: [],
    winner: null
  };
  
  this.activeBattles.set(userId, battleState);
  return battleState;
}

processTurn(battleState) {
  // Turn-based combat logic
  // Speed-based initiative
  // Ability cooldowns
  // Status effects
  // Win condition checking
}
```

## 4. DISCORD INTEGRATION (index.js)

### Battle Command Handler:
```javascript
// /newbattle command
if (commandName === 'newbattle') {
  // Get player lineup
  const playerCards = getPlayerLineup(interaction.user.id);
  
  // Create professional battle system
  const professionalBattleSystem = require('./professional_battle_system');
  const battleState = await professionalBattleSystem.startBattle(interaction.user.id, playerCards);
  
  // Generate Canvas image + Battle logs embed
  const { embed, attachment } = await professionalBattleSystem.createBattleEmbed(battleState);
  
  // Send with image attachment
  const battleMessage = await interaction.editReply({ 
    embeds: [embed],
    files: [attachment]
  });
  
  // Auto-progress battle every 3 seconds
  const battleInterval = setInterval(async () => {
    const result = await professionalBattleSystem.processTurn(battleState);
    
    if (battleState.phase === 'ended') {
      clearInterval(battleInterval);
      // Show final results
    } else {
      // Update with new Canvas image
      const { embed: newEmbed, attachment: newAttachment } = await professionalBattleSystem.createBattleEmbed(battleState);
      await battleMessage.edit({ 
        embeds: [newEmbed],
        files: [newAttachment]
      });
    }
  }, 3000);
}
```

## 5. CURRENT ISSUES TO FIX:

1. **Wrong System Call**: Line 2315 in index.js calls `newBattleSystem.processTurn()` instead of `professionalBattleSystem.processTurn()`
2. **Missing processTurn()**: ProfessionalBattleSystem needs a complete processTurn() method
3. **Battle Logic**: Need turn order, ability usage, damage calculations
4. **Win Conditions**: Team elimination detection

This is the complete architecture - Canvas image generation + Discord embeds + turn-based combat system.