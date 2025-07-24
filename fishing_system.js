const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

class FishingSystem {
  constructor() {
    this.activeFishingSessions = new Map();
    this.fishingImageUrl = './attached_assets/photo-1506905925346-21bda4d32df4_1753067864106.webp';
  }

  async startFishing(interaction, riverCards) {
    const userId = interaction.user.id;
    
    try {
      // Check if user already has active fishing session
      if (this.activeFishingSessions.has(userId)) {
        return interaction.reply({ content: '🎣 You are already fishing! Finish your current session first.', ephemeral: true });
      }

      // Check if there are cards in the river
      if (!riverCards || riverCards.length === 0) {
        return interaction.reply({ content: '🌊 The river is empty! Trash some cards first to go fishing.', ephemeral: true });
      }

      // Initialize fishing session
      const fishingSession = {
        userId: userId,
        cursorX: 2, // Start in middle (0-4 grid)
        cursorY: 2, // Start in middle (0-4 grid)
        availableCards: riverCards,
        startTime: Date.now()
      };

      this.activeFishingSessions.set(userId, fishingSession);

      // Create fishing embed with cursor position and image
      console.log('Creating fishing embed...');
      const { embed, riverImageWithCrosshair } = await this.createFishingEmbed(fishingSession);
      console.log('Fishing embed created successfully');
      
      const buttons = this.createFishingButtons();

      const replyOptions = {
        embeds: [embed],
        components: buttons
      };

      if (riverImageWithCrosshair) {
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(riverImageWithCrosshair, { name: 'river_fishing.png' });
        replyOptions.files = [attachment];
      }

      await interaction.editReply(replyOptions);
    } catch (error) {
      console.error('Error in startFishing:', error);
      throw error;
    }
  }

  async createFishingEmbed(session) {
    const grid = this.createCursorGrid(session.cursorX, session.cursorY);
    
    // Generate river image with crosshair overlay
    const riverImageWithCrosshair = await this.generateRiverImageWithCrosshair(session);
    
    const embed = new EmbedBuilder()
      .setTitle('🎣 Fishing in the River')
      .setDescription(`Use the buttons to move your crosshair around and find the perfect spot!\n\n${grid}\n\n🌊 **Cards Available:** ${session.availableCards.length}\n❌ **Current Position:** (${session.cursorX + 1}, ${session.cursorY + 1})`)
      .setColor('#3498db')
      .setFooter({ text: 'Move your crosshair and press Catch when you find your lucky spot!' });
    
    // Use the generated image with crosshair instead of static river
    if (riverImageWithCrosshair) {
      embed.setImage('attachment://river_fishing.png');
    } else {
      // For Discord embeds, we need a valid URL, not a file path
      embed.setImage('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600');
    }
    
    return { embed, riverImageWithCrosshair };
  }

  async generateRiverImageWithCrosshair(session) {
    try {
      console.log('Starting image generation...');
      const { createCanvas, loadImage } = require('canvas');
      
      // Load the user's river background image - updated to new water image
      const riverImageUrl = 'https://i.imgur.com/DnZwOoF.jpeg';
      console.log('Loading river image:', riverImageUrl);
      const riverImage = await loadImage(riverImageUrl);
      console.log('River image loaded successfully');
      
      // Create canvas with same dimensions as user's river image
      const canvas = createCanvas(riverImage.width, riverImage.height);
      const ctx = canvas.getContext('2d');
      
      // Draw the user's river background
      ctx.drawImage(riverImage, 0, 0);
      
      // Calculate crosshair position based on cursor coordinates
      const gridSize = 5; // 5x5 grid
      const cellWidth = riverImage.width / gridSize;
      const cellHeight = riverImage.height / gridSize;
      
      const crosshairX = (session.cursorX * cellWidth) + (cellWidth / 2);
      const crosshairY = (session.cursorY * cellHeight) + (cellHeight / 2);
      
      // Draw simple white circle crosshair
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 3;
      
      // Draw white circle
      ctx.beginPath();
      ctx.arc(crosshairX, crosshairY, 15, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Add black outline for better visibility
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(crosshairX, crosshairY, 15, 0, 2 * Math.PI);
      ctx.stroke();
      
      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('Error generating river image with crosshair:', error);
      return null;
    }
  }

  createCursorGrid(cursorX, cursorY) {
    let grid = '';
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (x === cursorX && y === cursorY) {
          grid += '❌'; // Crosshair cursor position
        } else {
          grid += '🌊'; // Water
        }
      }
      grid += '\n';
    }
    return grid;
  }

  createFishingButtons() {
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('fishing_up')
          .setLabel('↑')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('fishing_left')
          .setLabel('←')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('fishing_catch')
          .setLabel('🎣 CATCH')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('fishing_right')
          .setLabel('→')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('fishing_down')
          .setLabel('↓')
          .setStyle(ButtonStyle.Secondary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('fishing_quit')
          .setLabel('🚪 Quit Fishing')
          .setStyle(ButtonStyle.Danger)
      );

    return [row1, row2];
  }

  async handleFishingInteraction(interaction) {
    const userId = interaction.user.id;
    const session = this.activeFishingSessions.get(userId);

    if (!session) {
      return interaction.reply({ content: '❌ You don\'t have an active fishing session!', ephemeral: true });
    }

    // Only allow the person who started fishing to interact
    if (interaction.user.id !== session.userId) {
      return interaction.reply({ content: '❌ This isn\'t your fishing session!', ephemeral: true });
    }

    const action = interaction.customId.split('_')[1];

    switch (action) {
      case 'up':
        session.cursorY = Math.max(0, session.cursorY - 1);
        break;
      case 'down':
        session.cursorY = Math.min(4, session.cursorY + 1);
        break;
      case 'left':
        session.cursorX = Math.max(0, session.cursorX - 1);
        break;
      case 'right':
        session.cursorX = Math.min(4, session.cursorX + 1);
        break;
      case 'catch':
        return this.catchFish(interaction, session);
      case 'quit':
        this.activeFishingSessions.delete(userId);
        return interaction.update({
          embeds: [new EmbedBuilder()
            .setTitle('🚪 Fishing Session Ended')
            .setDescription('You packed up your fishing gear and left the river.')
            .setColor('#95a5a6')],
          components: []
        });
    }

    // Update the embed with new cursor position
    const { embed, riverImageWithCrosshair } = await this.createFishingEmbed(session);
    const buttons = this.createFishingButtons();

    const updateOptions = {
      embeds: [embed],
      components: buttons
    };

    if (riverImageWithCrosshair) {
      const { AttachmentBuilder } = require('discord.js');
      const attachment = new AttachmentBuilder(riverImageWithCrosshair, { name: 'river_fishing.png' });
      updateOptions.files = [attachment];
    }

    await interaction.update(updateOptions);
  }

  async catchFish(interaction, session) {
    // Remove session
    this.activeFishingSessions.delete(session.userId);

    // Get random card from river
    const randomCard = session.availableCards[Math.floor(Math.random() * session.availableCards.length)];
    
    // Calculate fishing "luck" based on position (purely cosmetic)
    const centerDistance = Math.abs(session.cursorX - 2) + Math.abs(session.cursorY - 2);
    const luckMessages = [
      'Perfect cast! You found the golden spot!',
      'Great positioning! The fish were biting there!',
      'Nice technique! You read the water well!',
      'Solid catch! That was a good spot!',
      'You caught something! Not bad for that location!'
    ];
    const luckMessage = luckMessages[Math.min(centerDistance, luckMessages.length - 1)];

    // Actually rescue the card - remove from river and return to collection
    try {
      randomCard.trashed = false;
      randomCard.trashedDate = null;
      await randomCard.save();
    } catch (error) {
      console.error('Error rescuing card from river:', error);
    }

    // Create result embed
    const resultEmbed = new EmbedBuilder()
      .setTitle('🎣 Successful Catch!')
      .setDescription(`${luckMessage}\n\n**🎯 Final Position:** (${session.cursorX + 1}, ${session.cursorY + 1})\n\n**🎉 You caught:** **${randomCard.name}** (Print #${randomCard.printNumber})\n**📺 Series:** ${randomCard.series}\n**⭐ Level:** ${randomCard.level}\n\n*The card has been rescued from the river and returned to your collection!*`)
      .setColor('#00ff00')
      .setFooter({ text: 'Card successfully rescued and restored to your collection!' });

    await interaction.update({
      embeds: [resultEmbed],
      components: []
    });

    return randomCard;
  }

  // Get river cards for a user (to be called from main bot)
  async getRiverCards(userId) {
    // This would query your database for cards in the river belonging to the user
    // For now, return empty array - implement based on your trash/river system
    return [];
  }

  // Cleanup old fishing sessions (call periodically)
  cleanupOldSessions() {
    const now = Date.now();
    const maxSessionTime = 10 * 60 * 1000; // 10 minutes

    for (const [userId, session] of this.activeFishingSessions.entries()) {
      if (now - session.startTime > maxSessionTime) {
        this.activeFishingSessions.delete(userId);
      }
    }
  }
}

module.exports = FishingSystem;