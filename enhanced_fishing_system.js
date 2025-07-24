const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');

class EnhancedFishingSystem {
  constructor() {
    this.activeFishingSessions = new Map();
    this.fishingRods = {
      basic: { name: 'Basic Rod', rarity_boost: 0, print_boost: 0, cost: 0, craftable: false },
      bamboo: { name: 'Bamboo Rod', rarity_boost: 10, print_boost: 5, cost: 500, craftable: true, materials: { lumens: 500 } },
      steel: { name: 'Steel Rod', rarity_boost: 25, print_boost: 15, cost: 1200, craftable: true, materials: { lumens: 800, mythic_shards: 2 } },
      carbon: { name: 'Carbon Fiber Rod', rarity_boost: 40, print_boost: 25, cost: 2500, craftable: true, materials: { lumens: 1500, mythic_shards: 5, nova_gems: 10 } },
      legendary: { name: 'Legendary Kraken Rod', rarity_boost: 75, print_boost: 50, cost: 5000, craftable: true, materials: { lumens: 3000, mythic_shards: 15, nova_gems: 25 } },
      mythic: { name: 'Mythic Poseidon Rod', rarity_boost: 100, print_boost: 75, cost: 10000, craftable: true, materials: { lumens: 5000, mythic_shards: 30, nova_gems: 50 } }
    };
    
    this.baitTypes = {
      none: { name: 'No Bait', rarity_boost: 0, print_boost: 0, cost: 0 },
      worm: { name: 'Magic Worms', rarity_boost: 15, print_boost: 10, cost: 100, materials: { lumens: 100 } },
      shrimp: { name: 'Golden Shrimp', rarity_boost: 30, print_boost: 20, cost: 250, materials: { lumens: 200, mythic_shards: 1 } },
      lure: { name: 'Enchanted Lure', rarity_boost: 50, print_boost: 35, cost: 500, materials: { lumens: 400, mythic_shards: 3 } },
      kraken: { name: 'Kraken Bait', rarity_boost: 80, print_boost: 60, cost: 1000, materials: { lumens: 800, mythic_shards: 8, nova_gems: 5 } }
    };
    
    this.fishingImageUrl = './attached_assets/photo-1506905925346-21bda4d32df4_1753067864106.webp';
  }

  async startFishing(interaction, riverCards, playerInventory = {}) {
    const userId = interaction.user.id;
    
    try {
      if (this.activeFishingSessions.has(userId)) {
        return interaction.reply({ content: '🎣 You are already fishing! Finish your current session first.', ephemeral: true });
      }

      if (!riverCards || riverCards.length === 0) {
        return interaction.reply({ content: '🌊 The river is empty! Trash some cards first to go fishing.', ephemeral: true });
      }

      // Get player's current fishing equipment
      const currentRod = playerInventory.fishingRod || 'basic';
      const currentBait = playerInventory.currentBait || 'none';

      const fishingSession = {
        userId: userId,
        cursorX: 2,
        cursorY: 2,
        availableCards: riverCards,
        startTime: Date.now(),
        rod: currentRod,
        bait: currentBait
      };

      this.activeFishingSessions.set(userId, fishingSession);

      const { embed, riverImageWithCrosshair } = await this.createEnhancedFishingEmbed(fishingSession, playerInventory);
      const buttons = this.createFishingButtons();

      const replyOptions = {
        embeds: [embed],
        components: buttons
      };

      if (riverImageWithCrosshair) {
        const attachment = new AttachmentBuilder(riverImageWithCrosshair, { name: 'enhanced_fishing.png' });
        replyOptions.files = [attachment];
      }

      await interaction.editReply(replyOptions);
    } catch (error) {
      console.error('Error in enhanced fishing:', error);
      throw error;
    }
  }

  async createEnhancedFishingEmbed(session, playerInventory) {
    const grid = this.createCursorGrid(session.cursorX, session.cursorY);
    const rod = this.fishingRods[session.rod];
    const bait = this.baitTypes[session.bait];
    
    const totalRarityBoost = rod.rarity_boost + bait.rarity_boost;
    const totalPrintBoost = rod.print_boost + bait.print_boost;
    
    const riverImageWithCrosshair = await this.generateEnhancedRiverImage(session);
    
    const embed = new EmbedBuilder()
      .setTitle('🎣 Enhanced Fishing System')
      .setDescription(`Use premium equipment to increase your chances of rare catches!\n\n${grid}\n\n🌊 **Available Cards:** ${session.availableCards.length}`)
      .addFields([
        {
          name: '🎣 Current Equipment',
          value: `**Rod:** ${rod.name}\n**Bait:** ${bait.name}`,
          inline: true
        },
        {
          name: '📈 Equipment Bonuses',
          value: `**Rarity Boost:** +${totalRarityBoost}%\n**Low Print Chance:** +${totalPrintBoost}%`,
          inline: true
        },
        {
          name: '🎯 Position',
          value: `**Current:** (${session.cursorX + 1}, ${session.cursorY + 1})\n**Lucky Spots:** Use equipment bonuses!`,
          inline: true
        }
      ])
      .setColor('#1e90ff')
      .setFooter({ text: 'Premium equipment increases rare card and low print chances!' });
    
    if (riverImageWithCrosshair) {
      embed.setImage('attachment://enhanced_fishing.png');
    }

    return { embed, riverImageWithCrosshair };
  }

  async generateEnhancedRiverImage(session) {
    try {
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      // Load and draw river background
      const riverImage = await loadImage(this.fishingImageUrl);
      ctx.drawImage(riverImage, 0, 0, 800, 600);

      // Add fishing equipment overlay effects
      const rod = this.fishingRods[session.rod];
      const bait = this.baitTypes[session.bait];
      
      // Equipment effects visualization
      if (rod.rarity_boost > 0) {
        ctx.fillStyle = `rgba(255, 215, 0, ${rod.rarity_boost / 200})`;
        ctx.fillRect(0, 0, 800, 600);
      }

      // Enhanced crosshair based on equipment
      const crosshairX = (session.cursorX * 160) + 80;
      const crosshairY = (session.cursorY * 120) + 60;
      
      // Equipment-based crosshair styling
      const crosshairSize = Math.max(40, rod.rarity_boost / 2);
      
      ctx.strokeStyle = rod.rarity_boost > 50 ? '#FFD700' : '#FF6B6B';
      ctx.lineWidth = rod.rarity_boost > 25 ? 4 : 3;
      
      // Draw enhanced crosshair
      ctx.beginPath();
      ctx.arc(crosshairX, crosshairY, crosshairSize, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Add equipment glow effect
      if (rod.rarity_boost > 50) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('Error generating enhanced river image:', error);
      return null;
    }
  }

  createCursorGrid(x, y) {
    let grid = '';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (col === x && row === y) {
          grid += '🎯'; // Current position
        } else {
          grid += '🌊'; // Water
        }
      }
      grid += '\n';
    }
    return grid;
  }

  createFishingButtons() {
    const directions = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('fishing_move_up').setLabel('⬆️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('fishing_equipment').setLabel('🎣 Equipment').setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('fishing_move_left').setLabel('⬅️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('fishing_catch').setLabel('🎣 Cast Line').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('fishing_move_right').setLabel('➡️').setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('fishing_move_down').setLabel('⬇️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('fishing_quit').setLabel('❌ Stop Fishing').setStyle(ButtonStyle.Danger)
      )
    ];
    return directions;
  }

  async catchFish(session, riverCards) {
    const rod = this.fishingRods[session.rod];
    const bait = this.baitTypes[session.bait];
    
    // Enhanced catch calculation with equipment bonuses
    const baseSuccessRate = 0.7;
    const equipmentBonus = (rod.rarity_boost + bait.rarity_boost) / 1000;
    const successRate = Math.min(0.95, baseSuccessRate + equipmentBonus);
    
    if (Math.random() > successRate) {
      return { success: false, message: 'The fish got away! Your equipment wasn\'t quite enough this time.' };
    }

    // Select card with rarity and print number bonuses
    const totalPrintBoost = rod.print_boost + bait.print_boost;
    const totalRarityBoost = rod.rarity_boost + bait.rarity_boost;
    
    // Prioritize lower print numbers with equipment
    let selectedCard = riverCards[0];
    if (totalPrintBoost > 0) {
      // Sort by print number, give better equipment higher chance of low prints
      const sortedCards = [...riverCards].sort((a, b) => a.printNumber - b.printNumber);
      const bonusIndex = Math.floor((totalPrintBoost / 100) * sortedCards.length);
      const selectIndex = Math.min(bonusIndex, sortedCards.length - 1);
      selectedCard = sortedCards[selectIndex];
    } else {
      selectedCard = riverCards[Math.floor(Math.random() * riverCards.length)];
    }

    // Future: Check for 3D/Animated cards with high-tier equipment
    const rare3DChance = totalRarityBoost > 75 ? 0.05 : 0;
    const animatedChance = totalRarityBoost > 50 ? 0.1 : 0;
    
    let cardType = 'normal';
    if (Math.random() < rare3DChance) {
      cardType = '3D';
    } else if (Math.random() < animatedChance) {
      cardType = 'animated';
    }

    return { 
      success: true, 
      card: selectedCard, 
      cardType: cardType,
      equipmentBonus: `Your ${rod.name} and ${bait.name} helped you catch this ${cardType} card!` 
    };
  }
}

module.exports = { EnhancedFishingSystem };