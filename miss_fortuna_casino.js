const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class MissFortunasCasino {
  constructor() {
    this.activeGames = new Map();
    this.wheelSegments = [
      { name: '🎴 Rare Card', weight: 10, reward: { type: 'rare_card', value: 1 } },
      { name: '🎨 Premium Frame', weight: 15, reward: { type: 'frame', value: 'premium' } },
      { name: '🌈 Mystic Dye', weight: 20, reward: { type: 'dye', value: 'mystic' } },
      { name: '🐾 Pet Token', weight: 25, reward: { type: 'pet_token', value: 1 } },
      { name: '💎 Nova Gems', weight: 30, reward: { type: 'nova_gems', value: 50 } },
      { name: '✨ Lumens', weight: 40, reward: { type: 'lumens', value: 300 } },
      { name: '🎯 Luck Boost', weight: 35, reward: { type: 'luck_boost', value: '24h' } },
      { name: '💀 Nothing', weight: 25, reward: { type: 'nothing', value: 0 } }
    ];
    
    this.slotSymbols = ['🍒', '🍋', '🍊', '🍇', '💎', '⭐', '🎰', '💰'];
    this.luckBoosts = new Map(); // userId -> expiry timestamp
  }

  async openCasino(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎰 Miss Fortuna\'s Casino')
      .setDescription('**Welcome to my mystical gambling parlor!**\n\n*Step right up and test your luck! I offer the finest games of chance in all the realms.*')
      .addFields([
        {
          name: '🎡 Wheel of Fortune',
          value: '**Cost:** 200 ✨ Lumens\n**Rewards:** Rare cards, frames, dyes, pets\n**Bonus:** Luck boosts increase rare chances',
          inline: true
        },
        {
          name: '🎰 Lucky Slots',
          value: '**Cost:** 150 ✨ Lumens\n**Rewards:** Nova gems, lumens, pet tokens\n**Jackpot:** Triple 💰 = 1000 Nova Gems!',
          inline: true
        },
        {
          name: '🔮 Luck Boosters',
          value: '**24h Boost:** 500 Lumens\n**Effect:** +25% rare chances\n**Stacks:** With premium equipment',
          inline: true
        }
      ])
      .setColor('#9932cc')
      .setThumbnail('https://i.imgur.com/fortuneteller.png')
      .setFooter({ text: 'Miss Fortuna\'s Casino • Fortune favors the bold!' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('casino_wheel')
        .setLabel('🎡 Spin Wheel (200 Lumens)')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('casino_slots')
        .setLabel('🎰 Play Slots (150 Lumens)')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('casino_luck_boost')
        .setLabel('🔮 Buy Luck Boost (500 Lumens)')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [buttons] });
  }

  async spinWheel(interaction, player) {
    if (player.lumens < 200) {
      return interaction.update({ 
        content: '💸 You need 200 ✨ Lumens to spin the wheel!', 
        embeds: [], 
        components: [] 
      });
    }

    // Deduct cost
    player.lumens -= 200;
    await player.save();

    // Check for luck boost
    const hasLuckBoost = this.luckBoosts.has(interaction.user.id) && 
                        this.luckBoosts.get(interaction.user.id) > Date.now();

    // Create spinning animation embed
    const spinEmbed = new EmbedBuilder()
      .setTitle('🎡 Wheel of Fortune Spinning...')
      .setDescription('*The wheel spins faster and faster, magical energy crackling around it...*')
      .setColor('#ff6b6b')
      .setFooter({ text: 'Miss Fortuna watches with keen interest...' });

    await interaction.update({ embeds: [spinEmbed], components: [] });

    // Simulate spinning delay
    setTimeout(async () => {
      const result = this.calculateWheelResult(hasLuckBoost);
      const resultEmbed = await this.createWheelResultEmbed(result, hasLuckBoost);
      
      // Award the prize
      await this.awardWheelPrize(interaction.user.id, result.reward, player);
      
      const returnButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('casino_return')
          .setLabel('🎰 Return to Casino')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [resultEmbed], components: [returnButton] });
    }, 3000);
  }

  calculateWheelResult(hasLuckBoost = false) {
    let segments = [...this.wheelSegments];
    
    // Luck boost increases rare item chances
    if (hasLuckBoost) {
      segments.forEach(segment => {
        if (['🎴 Rare Card', '🎨 Premium Frame', '🌈 Mystic Dye', '🐾 Pet Token'].includes(segment.name)) {
          segment.weight *= 1.5; // 50% increase for rare items
        }
        if (segment.name === '💀 Nothing') {
          segment.weight *= 0.5; // Half chance of getting nothing
        }
      });
    }

    const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);
    let random = Math.random() * totalWeight;

    for (const segment of segments) {
      random -= segment.weight;
      if (random <= 0) {
        return segment;
      }
    }

    return segments[segments.length - 1];
  }

  async createWheelResultEmbed(result, hasLuckBoost) {
    const embed = new EmbedBuilder()
      .setTitle('🎡 Wheel of Fortune Result!')
      .setColor(result.name === '💀 Nothing' ? '#8b0000' : '#32cd32');

    if (result.name === '💀 Nothing') {
      embed.setDescription('*The wheel slows and stops on an empty space...*\n\n**💀 Better luck next time!**\n\n*Miss Fortuna shrugs sympathetically. "The spirits were not with you today, but fortune is ever-changing!"*');
    } else {
      embed.setDescription(`*The wheel glows with mystical energy as it stops!*\n\n**🎉 You won: ${result.name}!**\n\n*Miss Fortuna claps excitedly. "The fates have smiled upon you!"*`);
      embed.addField('🎁 Your Prize', this.describePrize(result.reward), true);
    }

    if (hasLuckBoost) {
      embed.addField('🔮 Luck Boost Active', '+25% chance for rare prizes!', true);
    }

    return embed;
  }

  async playSlots(interaction, player) {
    if (player.lumens < 150) {
      return interaction.update({ 
        content: '💸 You need 150 ✨ Lumens to play slots!', 
        embeds: [], 
        components: [] 
      });
    }

    player.lumens -= 150;
    await player.save();

    const spinEmbed = new EmbedBuilder()
      .setTitle('🎰 Lucky Slots')
      .setDescription('*The reels spin with magical energy...*\n\n🎰 | 🎰 | 🎰')
      .setColor('#ffd700')
      .setFooter({ text: 'Miss Fortuna\'s enchanted slot machine whirrs...' });

    await interaction.update({ embeds: [spinEmbed], components: [] });

    setTimeout(async () => {
      const result = this.generateSlotResult();
      const resultEmbed = this.createSlotResultEmbed(result);
      
      // Award prizes
      await this.awardSlotPrize(interaction.user.id, result, player);
      
      const returnButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('casino_return')
          .setLabel('🎰 Return to Casino')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [resultEmbed], components: [returnButton] });
    }, 2500);
  }

  generateSlotResult() {
    const symbols = [];
    for (let i = 0; i < 3; i++) {
      symbols.push(this.slotSymbols[Math.floor(Math.random() * this.slotSymbols.length)]);
    }

    return {
      symbols,
      display: symbols.join(' | '),
      isWin: this.checkSlotWin(symbols),
      prize: this.calculateSlotPrize(symbols)
    };
  }

  checkSlotWin(symbols) {
    // Three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) return 'jackpot';
    // Two of a kind
    if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) return 'match';
    return false;
  }

  calculateSlotPrize(symbols) {
    if (symbols.every(s => s === '💰')) {
      return { type: 'nova_gems', amount: 1000, description: '🏆 MEGA JACKPOT! 1000 Nova Gems!' };
    }
    if (symbols.every(s => s === '💎')) {
      return { type: 'nova_gems', amount: 500, description: '💎 Diamond Jackpot! 500 Nova Gems!' };
    }
    if (symbols.every(s => s === symbols[0])) {
      return { type: 'lumens', amount: 800, description: '🎉 Triple Match! 800 Lumens!' };
    }
    if (this.checkSlotWin(symbols) === 'match') {
      return { type: 'lumens', amount: 250, description: '🎯 Pair Match! 250 Lumens!' };
    }
    return null;
  }

  createSlotResultEmbed(result) {
    const embed = new EmbedBuilder()
      .setTitle('🎰 Slot Machine Results')
      .setDescription(`**Final Result:**\n\n${result.display}\n\n${result.prize ? `🎉 **${result.prize.description}**` : '💔 **No match this time...**'}`);

    if (result.prize) {
      embed.setColor('#32cd32');
      embed.addField('💰 Your Winnings', result.prize.description, true);
    } else {
      embed.setColor('#8b0000');
      embed.setFooter({ text: 'Try again! Fortune changes like the wind!' });
    }

    return embed;
  }

  async buyLuckBoost(interaction, player) {
    if (player.lumens < 500) {
      return interaction.update({ 
        content: '💸 You need 500 ✨ Lumens for a luck boost!', 
        embeds: [], 
        components: [] 
      });
    }

    // Check if already has active boost
    if (this.luckBoosts.has(interaction.user.id) && this.luckBoosts.get(interaction.user.id) > Date.now()) {
      return interaction.update({ 
        content: '🔮 You already have an active luck boost!', 
        embeds: [], 
        components: [] 
      });
    }

    player.lumens -= 500;
    await player.save();

    // Grant 24-hour luck boost
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    this.luckBoosts.set(interaction.user.id, expiryTime);

    const boostEmbed = new EmbedBuilder()
      .setTitle('🔮 Luck Boost Activated!')
      .setDescription('*Miss Fortuna chants an incantation and you feel fortune\'s favor upon you!*')
      .addFields([
        { name: '✨ Effect', value: '+25% chance for rare rewards in all casino games', inline: true },
        { name: '⏰ Duration', value: '24 hours', inline: true },
        { name: '🎯 Bonus', value: 'Stacks with fishing equipment bonuses!', inline: true }
      ])
      .setColor('#9932cc')
      .setFooter({ text: 'Your luck boost will enhance all Miss Fortuna\'s games!' });

    const returnButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('casino_return')
        .setLabel('🎰 Return to Casino')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [boostEmbed], components: [returnButton] });
  }

  describePrize(reward) {
    switch (reward.type) {
      case 'rare_card':
        return 'A mysterious rare character card!';
      case 'frame':
        return 'Premium golden frame for your cards!';
      case 'dye':
        return 'Mystic rainbow dye for customization!';
      case 'pet_token':
        return 'Token to exchange for a battle pet!';
      case 'nova_gems':
        return `${reward.value} sparkling Nova Gems!`;
      case 'lumens':
        return `${reward.value} gleaming Lumens!`;
      case 'luck_boost':
        return '24-hour luck enhancement!';
      default:
        return 'Mysterious prize!';
    }
  }

  async awardWheelPrize(userId, reward, player) {
    // Implementation for awarding wheel prizes
    switch (reward.type) {
      case 'nova_gems':
        if (!player.novaGems) player.novaGems = 0;
        player.novaGems += reward.value;
        break;
      case 'lumens':
        player.lumens += reward.value;
        break;
      case 'luck_boost':
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        this.luckBoosts.set(userId, expiryTime);
        break;
      // Add more prize types as needed
    }
    await player.save();
  }

  async awardSlotPrize(userId, result, player) {
    if (!result.prize) return;
    
    switch (result.prize.type) {
      case 'nova_gems':
        if (!player.novaGems) player.novaGems = 0;
        player.novaGems += result.prize.amount;
        break;
      case 'lumens':
        player.lumens += result.prize.amount;
        break;
    }
    await player.save();
  }
}

module.exports = { MissFortunasCasino };