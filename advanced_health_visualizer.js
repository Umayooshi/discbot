const { EmbedBuilder } = require('discord.js');

// Custom emojis for enhanced visuals
const CUSTOM_EMOJIS = {
  tank: '<:tank:1397654349823344680>',
  damage: '<:damage:1397654774144303165>',
  support: '<:support:1397657410830860430>',
  intel: '<:intel:1397658594333294834>',
  lumen: '<:lumen:1397657413271818422>',
  novagem: '<:novagem:1397657403477987408>',
  mysticshard: '<:mysticshard:1397657408104300725>'
};

// Utility function to get class emoji
function getClassEmoji(className) {
  return CUSTOM_EMOJIS[className.toLowerCase()] || '⚔️';
}

class AdvancedHealthVisualizer {
  
  // Create animated health bar using block characters
  static createHealthBar(currentHp, maxHp, barLength = 20) {
    const percentage = Math.max(0, Math.min(1, currentHp / maxHp));
    const filledBlocks = Math.floor(percentage * barLength);
    const emptyBlocks = barLength - filledBlocks;
    
    // Use blue blocks for health (like Sofi bot)
    const healthBlocks = '█'.repeat(filledBlocks);
    const emptySpace = '░'.repeat(emptyBlocks);
    
    return `${healthBlocks}${emptySpace}`;
  }
  
  // Create professional health display embed
  static createHealthDisplay(userTeam, enemyTeam, battleState, preserveImageUrl = null) {
    const embed = new EmbedBuilder()
      .setColor('#2F3136') // Discord dark theme color
      .setTitle('⚔️ BATTLE STATUS')
      .setDescription('```\n' + '═'.repeat(40) + '\n```');
    
    // CRITICAL: Preserve battle arena image if provided
    if (preserveImageUrl) {
      embed.setImage(preserveImageUrl);
      console.log('🖼️ AdvancedHealthVisualizer: Image URL applied to embed:', preserveImageUrl);
    }
    
    // User team health display (GREEN for user team)
    let userHealthDisplay = '```ansi\n';
    userHealthDisplay += '\u001b[0;32m🔷 YOUR TEAM\u001b[0m\n';
    userHealthDisplay += '─'.repeat(30) + '\n';
    
    userTeam.forEach((card, index) => {
      const healthBar = this.createHealthBar(card.stats.hp, card.stats.maxHp, 15);
      const hpText = `${card.stats.hp}/${card.stats.maxHp}`;
      const statusIcon = card.isAlive ? '🟢' : '💀';
      // Use Unicode emojis instead of custom Discord emojis for ANSI code blocks
      const classIcon = card.class === 'Tank' ? '🛡️' : 
                       card.class === 'Damage' ? '⚔️' : 
                       card.class === 'Support' ? '💚' : 
                       card.class === 'Intel' ? '🔮' : '⚔️';
      
      userHealthDisplay += `${statusIcon} ${classIcon} ${card.name}\n`;
      userHealthDisplay += `\u001b[0;32m${healthBar}\u001b[0m ${hpText} HP\n`;
      if (index < userTeam.length - 1) userHealthDisplay += '\n';
    });
    
    userHealthDisplay += '```';
    
    // Enemy team health display (PINK for enemy team)
    let enemyHealthDisplay = '```ansi\n';
    enemyHealthDisplay += '\u001b[0;35m🔴 ENEMY TEAM\u001b[0m\n';
    enemyHealthDisplay += '─'.repeat(30) + '\n';
    
    enemyTeam.forEach((card, index) => {
      const healthBar = this.createHealthBar(card.stats.hp, card.stats.maxHp, 15);
      const hpText = `${card.stats.hp}/${card.stats.maxHp}`;
      const statusIcon = card.isAlive ? '🟢' : '💀';
      // Use Unicode emojis instead of custom Discord emojis for ANSI code blocks
      const classIcon = card.class === 'Tank' ? '🛡️' : 
                       card.class === 'Damage' ? '⚔️' : 
                       card.class === 'Support' ? '💚' : 
                       card.class === 'Intel' ? '🔮' : '⚔️';
      
      enemyHealthDisplay += `${statusIcon} ${classIcon} ${card.name}\n`;
      enemyHealthDisplay += `\u001b[0;35m${healthBar}\u001b[0m ${hpText} HP\n`;
      if (index < enemyTeam.length - 1) enemyHealthDisplay += '\n';
    });
    
    enemyHealthDisplay += '```';
    
    embed.addFields(
      { name: '\u200B', value: userHealthDisplay, inline: true },
      { name: '\u200B', value: enemyHealthDisplay, inline: true }
    );
    
    // Battle logs section (like Sofi bot) with team-based colors
    if (battleState.battleLog && battleState.battleLog.length > 0) {
      const recentLogs = battleState.battleLog.slice(-5); // Show last 5 actions
      let logDisplay = '```ansi\n';
      logDisplay += '• Battle Logs\n';
      
      recentLogs.forEach(log => {
        if (log.type === 'damage') {
          // Check if attacker is from user team or enemy team
          const isUserTeamAttacker = battleState.userTeam.some(card => card.name === log.attacker);
          const colorCode = isUserTeamAttacker ? '\u001b[0;32m' : '\u001b[0;35m'; // Green for user, Pink for enemy
          logDisplay += `${colorCode}- ${log.attacker} dealt ${log.damage} with ${log.ability}\u001b[0m\n`;
        } else if (log.type === 'heal') {
          const isUserTeamHealer = battleState.userTeam.some(card => card.name === log.healer);
          const colorCode = isUserTeamHealer ? '\u001b[0;32m' : '\u001b[0;35m'; // Green for user, Pink for enemy
          logDisplay += `${colorCode}+ ${log.healer} healed ${log.amount} with ${log.ability}\u001b[0m\n`;
        } else if (log.type === 'ability') {
          const isUserTeamUser = battleState.userTeam.some(card => card.name === log.user);
          const colorCode = isUserTeamUser ? '\u001b[0;32m' : '\u001b[0;35m'; // Green for user, Pink for enemy
          logDisplay += `${colorCode}+ ${log.user} used ${log.ability}\u001b[0m\n`;
        } else if (log.type === 'status') {
          logDisplay += `  ${log.message}\n`;
        }
      });
      
      logDisplay += '```';
      
      embed.addFields({
        name: '\u200B',
        value: logDisplay,
        inline: false
      });
    }
    
    embed.setFooter({ 
      text: `Turn ${battleState.turn} | ${battleState.currentPlayer === 'user' ? 'Your Turn' : 'Enemy Turn'}` 
    });
    
    return embed;
  }
  
  // Create separate clean battle arena using the existing working function
  static async createCleanBattleArena(userTeam, enemyTeam) {
    // Use the existing generateBattleArena function that works perfectly
    const battleState = { userTeam, enemyTeam };
    
    // Find and use the existing generateBattleArena function from index.js
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    const professionalImageSystem = require('./professional_image_system');
    
    const canvas = createCanvas(1600, 1200);
    const ctx = canvas.getContext('2d');
    
    // Professional gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1600, 1200);
    gradient.addColorStop(0, '#2f3136');
    gradient.addColorStop(0.5, '#36393f');
    gradient.addColorStop(1, '#2f3136');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1600, 1200);
    
    try {
      // Generate user team cards using the existing professional card system
      for (let i = 0; i < Math.min(userTeam.length, 3); i++) {
        const card = userTeam[i];
        
        // Create card data in the format expected by the professional system
        const cardData = {
          name: card.name,
          series: card.series || 'Unknown',
          imageUrl: card.imageUrl,
          level: card.level || 1,
          class: card.class || 'Damage',
          printNumber: card.printNumber || 1,
          stats: card.stats,
          dye: card.dye || null,
          frame: card.frame || null,
          aura: card.aura || null
        };
        
        // Generate professional card image
        const cardBuffer = await professionalImageSystem.createProfessionalCard(cardData);
        const cardImage = await loadImage(cardBuffer);
        
        const x = 200 + (i * 400);
        const y = 50;
        ctx.drawImage(cardImage, x, y, 200, 300);
      }
      
      // Large VS text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText('VS', 800, 650);
      ctx.fillText('VS', 800, 650);
      
      // Generate enemy team cards
      for (let i = 0; i < Math.min(enemyTeam.length, 3); i++) {
        const card = enemyTeam[i];
        
        const cardData = {
          name: card.name,
          series: card.series || 'Unknown',
          imageUrl: card.imageUrl,
          level: card.level || 1,
          class: card.class || 'Damage',
          printNumber: null, // No print numbers for enemies
          stats: card.stats,
          dye: null,
          frame: null,
          aura: null
        };
        
        const cardBuffer = await professionalImageSystem.createProfessionalCard(cardData);
        const cardImage = await loadImage(cardBuffer);
        
        const x = 200 + (i * 400);
        const y = 750;
        ctx.drawImage(cardImage, x, y, 200, 300);
      }
      
    } catch (error) {
      console.error('Error creating clean battle arena:', error);
    }
    
    return canvas.toBuffer('image/png');
  }
}

module.exports = AdvancedHealthVisualizer;