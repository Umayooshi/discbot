const { createCanvas, loadImage } = require('canvas');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');

class ShopSystem {
  constructor() {
    this.chests = {
      wooden: {
        name: 'Wooden Chest',
        image: 'https://i.imgur.com/Nk5KbkT.png',
        price: { lumens: 1000, mythicShards: 0, novaGems: 0 },
        description: 'Basic chest with common cards',
        cards: 3,
        guaranteedRares: 0
      },
      silver: {
        name: 'Silver Chest',
        image: 'https://i.imgur.com/qd8i323.png',
        price: { lumens: 5000, mythicShards: 0, novaGems: 0 },
        description: 'Premium chest with rare cards',
        cards: 3,
        guaranteedRares: 1
      },
      gold: {
        name: 'Gold Chest',
        image: 'https://i.imgur.com/QgbUD6Z.png',
        price: { lumens: 0, mythicShards: 0, novaGems: 100 },
        description: 'High-tier chest with epic cards',
        cards: 4,
        guaranteedRares: 2
      },
      prismatic: {
        name: 'Prismatic Chest',
        image: 'https://i.imgur.com/8xKXSBM.png',
        price: { lumens: 0, mythicShards: 0, novaGems: 500 },
        description: 'Legendary chest with guaranteed legendaries',
        cards: 5,
        guaranteedRares: 3
      }
    };
  }

  async generateShopImage() {
    try {
      const canvas = createCanvas(1000, 800);
      const ctx = canvas.getContext('2d');

      // Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1000, 800);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏪 CARD CHEST SHOP', 500, 80);

      // Draw 2x2 grid of chests
      const chestOrder = ['wooden', 'silver', 'gold', 'prismatic'];
      const positions = [
        { x: 150, y: 150 }, // Top left
        { x: 550, y: 150 }, // Top right  
        { x: 150, y: 450 }, // Bottom left
        { x: 550, y: 450 }  // Bottom right
      ];

      for (let i = 0; i < chestOrder.length; i++) {
        const chestType = chestOrder[i];
        const chest = this.chests[chestType];
        const pos = positions[i];

        try {
          // Load and draw chest image
          const chestImage = await loadImage(chest.image);
          ctx.drawImage(chestImage, pos.x, pos.y, 300, 200);

          // Draw chest frame
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeRect(pos.x, pos.y, 300, 200);

          // Draw chest name
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(chest.name, pos.x + 150, pos.y + 230);

          // Draw price
          ctx.font = '18px Arial';
          const priceText = this.formatPrice(chest.price);
          ctx.fillText(priceText, pos.x + 150, pos.y + 255);

          // Draw description
          ctx.font = '14px Arial';
          ctx.fillStyle = '#cccccc';
          ctx.fillText(chest.description, pos.x + 150, pos.y + 275);

        } catch (error) {
          console.error(`Failed to load chest image for ${chestType}:`, error);
          // Draw placeholder rectangle
          ctx.fillStyle = '#333333';
          ctx.fillRect(pos.x, pos.y, 300, 200);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(chest.name, pos.x + 150, pos.y + 100);
        }
      }

      return canvas.toBuffer();

    } catch (error) {
      console.error('Error generating shop image:', error);
      return null;
    }
  }

  formatPrice(price) {
    const parts = [];
    if (price.lumens > 0) parts.push(`✨ ${price.lumens}`);
    if (price.mythicShards > 0) parts.push(`🌟 ${price.mythicShards}`);
    if (price.novaGems > 0) parts.push(`💎 ${price.novaGems}`);
    return parts.join(' | ');
  }

  createShopEmbed(shopImageBuffer) {
    const embed = new EmbedBuilder()
      .setTitle('🏪 Card Chest Shop')
      .setDescription('Purchase chests to collect cards and build your collection!\n\n' +
        '**Currency Types:**\n' +
        '✨ **Lumens** - Basic currency earned from battles\n' +
        '🌟 **Mythic Shards** - Premium currency from missions\n' +
        '💎 **Nova Gems** - Ultra-rare currency from achievements')
      .setColor('#f39c12');

    if (shopImageBuffer) {
      embed.setImage('attachment://shop.png');
    }

    return embed;
  }

  createShopButtons() {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('shop_buy_wooden')
        .setLabel('🪵 Wooden (✨1,000)')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('shop_buy_silver')
        .setLabel('🥈 Silver (✨5,000)')
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('shop_buy_gold')
        .setLabel('🥇 Gold (💎100)')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('shop_buy_prismatic')
        .setLabel('🌈 Prismatic (💎500)')
        .setStyle(ButtonStyle.Danger)
    );

    return [row1, row2];
  }

  async purchaseChest(chestType, player) {
    const chest = this.chests[chestType];
    if (!chest) return { success: false, message: 'Invalid chest type' };

    // Check if player has enough currency
    const price = chest.price;
    if (player.lumens < price.lumens || 
        player.mythicShards < price.mythicShards || 
        player.novaGems < price.novaGems) {
      return { success: false, message: 'Insufficient currency!' };
    }

    // Deduct currency
    player.lumens -= price.lumens;
    player.mythicShards -= price.mythicShards;
    player.novaGems -= price.novaGems;
    await player.save();

    return { 
      success: true, 
      message: `Successfully purchased ${chest.name}!`,
      cards: chest.cards,
      guaranteedRares: chest.guaranteedRares
    };
  }
}

module.exports = ShopSystem;