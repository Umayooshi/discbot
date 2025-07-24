const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class ShopkeeperSystem {
  constructor() {
    this.shopkeepers = {
      binko: {
        name: "Binko",
        title: "Frame Shop Owner",
        image: "https://i.imgur.com/WNcjMRi.png",
        color: "#8B4513",
        dialogue: [
          "Welcome to my frame shop! I've got the finest borders this side of the digital realm!",
          "Each frame tells a story... what story will yours tell?",
          "These frames have been blessed by ancient card spirits. Choose wisely!",
          "New frames arrive daily from distant lands. Check back tomorrow!"
        ],
        shop: {
          currency: "lumens",
          premiumCurrency: "novaGems",
          resetHours: 24
        }
      },
      gilly: {
        name: "Gilly",
        title: "The Fisherman",
        image: "https://i.imgur.com/93LRdci.png",
        color: "#4682B4",
        dialogue: [
          "Ahoy there! Looking for some quality fishing gear, are ye?",
          "The river's been mighty generous lately. Got some special catches waiting!",
          "These rods have pulled legends from the depths. Perfect for card fishing!",
          "Storm's coming tomorrow - perfect fishing weather! Come back then!"
        ],
        shop: {
          currency: "lumens",
          premiumCurrency: "novaGems",
          resetHours: 24
        }
      },
      fortuna: {
        name: "Miss Fortuna",
        title: "Mystical Enchantress",
        image: "https://i.imgur.com/guqitNA.png",
        color: "#9400D3",
        dialogue: [
          "The fates have brought you to my parlor... how fascinating...",
          "These mystical auras shimmer with otherworldly power. Do you dare?",
          "I see great fortune in your future... for the right price, of course.",
          "The stars align differently each day. Return tomorrow for new destinies!"
        ],
        shop: {
          currency: "lumens",
          premiumCurrency: "mythicShards",
          resetHours: 24
        }
      },
      jessie: {
        name: "Jessie",
        title: "The Zoo Keeper",
        image: "https://i.imgur.com/9o6BvXg.png",
        color: "#228B22",
        dialogue: [
          "Welcome to my menagerie! These creatures make wonderful card companions!",
          "Each pet has its own personality - they'll bond with your cards beautifully!",
          "The animals are restless today... they sense your card collection's potential!",
          "New creatures arrive with each sunrise. The zoo never sleeps!"
        ],
        shop: {
          currency: "lumens",
          premiumCurrency: "novaGems",
          resetHours: 24
        }
      }
    };
    
    // Daily shop rotation seed
    this.getShopSeed = () => {
      const today = new Date();
      return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    };
  }
  
  // Create main shop hub with all shopkeepers
  createMainShopEmbed() {
    const embed = new EmbedBuilder()
      .setTitle('🏪 The Grand Marketplace')
      .setDescription('Welcome to the bustling marketplace! Visit our friendly shopkeepers for unique items and daily deals.')
      .addFields([
        {
          name: '🎁 Treasure Chests',
          value: 'Classic card packs and rare collections',
          inline: true
        },
        {
          name: '🛍️ Specialty Shops',
          value: 'Visit our expert shopkeepers for unique items',
          inline: true
        },
        {
          name: '⏰ Daily Rotation',
          value: 'Shop inventories refresh every 24 hours!',
          inline: true
        }
      ])
      .setColor('#FFD700')
      .setFooter({ text: 'Choose a destination below!' });
    
    return embed;
  }
  
  // Create main shop navigation buttons
  createMainShopButtons() {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('shop_chests')
        .setLabel('🎁 Treasure Chests')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('shop_binko')
        .setLabel('🖼️ Binko\'s Frames')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('shop_gilly')
        .setLabel('🎣 Gilly\'s Fishing')
        .setStyle(ButtonStyle.Secondary)
    );
    
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('shop_fortuna')
        .setLabel('🔮 Miss Fortuna\'s Mystical')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('shop_jessie')
        .setLabel('🦁 Jessie\'s Zoo')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('shop_back')
        .setLabel('🔙 Back to Main')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );
    
    return [row1, row2];
  }
  
  // Create individual shopkeeper embed
  createShopkeeperEmbed(shopkeeperId, playerData = null) {
    const shopkeeper = this.shopkeepers[shopkeeperId];
    if (!shopkeeper) return null;
    
    // Get random dialogue for this visit
    const dialogue = this.getRandomDialogue(shopkeeperId);
    
    // Calculate time until next reset
    const timeUntilReset = this.getTimeUntilReset();
    
    const embed = new EmbedBuilder()
      .setTitle(`${shopkeeper.name} - ${shopkeeper.title}`)
      .setDescription(`*"${dialogue}"*\n\n**Daily Selection** - Resets in ${timeUntilReset}`)
      .setThumbnail(shopkeeper.image)
      .setColor(shopkeeper.color)
      .addFields([
        {
          name: '🛍️ Today\'s Specials',
          value: this.generateDailySpecials(shopkeeperId),
          inline: false
        },
        {
          name: '💰 Your Currencies',
          value: playerData ? this.formatPlayerCurrencies(playerData) : 'Loading...',
          inline: true
        },
        {
          name: '⏰ Shop Hours',
          value: `Open 24/7\nInventory resets daily`,
          inline: true
        }
      ])
      .setFooter({ text: `${shopkeeper.name}'s Shop • Daily Reset System` });
    
    return embed;
  }
  
  // Generate daily specials (placeholder for now)
  generateDailySpecials(shopkeeperId) {
    const shopkeeper = this.shopkeepers[shopkeeperId];
    const seed = this.getShopSeed();
    
    // Placeholder items - will be replaced with actual inventory
    const placeholderItems = {
      binko: [
        '🖼️ **Golden Border Frame** - 150 Lumens',
        '🖼️ **Silver Trim Frame** - 100 Lumens', 
        '🖼️ **Classic Wood Frame** - 75 Lumens',
        '🖼️ **★ Legendary Dragon Frame** - 5 Nova Gems'
      ],
      gilly: [
        '🎣 **Master\'s Fishing Rod** - 200 Lumens',
        '🪱 **Lucky Bait Pack** - 50 Lumens',
        '🎣 **Quick Cast Line** - 125 Lumens',
        '🎣 **★ Neptune\'s Trident** - 8 Nova Gems'
      ],
      fortuna: [
        '✨ **Shimmer Aura** - 300 Lumens',
        '🌟 **Starlight Effect** - 250 Lumens',
        '💫 **Cosmic Glow** - 200 Lumens',
        '✨ **★ Divine Radiance** - 10 Mythic Shards'
      ],
      jessie: [
        '🐱 **Card Cat Companion** - 180 Lumens',
        '🦊 **Spirit Fox Pet** - 220 Lumens',
        '🐺 **Wolf Guardian** - 300 Lumens',
        '🐉 **★ Legendary Dragon Pet** - 12 Nova Gems'
      ]
    };
    
    const items = placeholderItems[shopkeeperId] || ['Coming soon...'];
    return items.join('\n') + '\n\n*Items are placeholders - real inventory coming soon!*';
  }
  
  // Get random dialogue for shopkeeper
  getRandomDialogue(shopkeeperId) {
    const shopkeeper = this.shopkeepers[shopkeeperId];
    const seed = this.getShopSeed() + Date.now();
    const index = seed % shopkeeper.dialogue.length;
    return shopkeeper.dialogue[index];
  }
  
  // Calculate time until next reset
  getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
  
  // Format player currencies for display
  formatPlayerCurrencies(playerData) {
    return `✨ ${playerData.lumens || 0} Lumens\n💎 ${playerData.novaGems || 0} Nova Gems\n🌟 ${playerData.mythicShards || 0} Mythic Shards`;
  }
  
  // Create shopkeeper navigation buttons
  createShopkeeperButtons(currentShopkeeper) {
    const buttons = [];
    
    // Purchase buttons (placeholder for now)
    const purchaseRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`purchase_${currentShopkeeper}_1`)
        .setLabel('💰 Buy Item 1')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true), // Disabled until real items added
      new ButtonBuilder()
        .setCustomId(`purchase_${currentShopkeeper}_2`)
        .setLabel('💰 Buy Item 2')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`purchase_${currentShopkeeper}_3`)
        .setLabel('💰 Buy Item 3')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
    );
    
    // Navigation row
    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('shop_main')
        .setLabel('🏪 Back to Market')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`shop_refresh_${currentShopkeeper}`)
        .setLabel('🔄 Refresh Shop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`purchase_${currentShopkeeper}_premium`)
        .setLabel('💎 Buy Premium')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );
    
    return [purchaseRow, navRow];
  }
  
  // Handle shopkeeper interactions
  async handleShopkeeperInteraction(interaction, shopkeeperId, playerData) {
    const embed = this.createShopkeeperEmbed(shopkeeperId, playerData);
    const buttons = this.createShopkeeperButtons(shopkeeperId);
    
    await interaction.update({
      embeds: [embed],
      components: buttons
    });
  }
  
  // Handle purchase interactions (placeholder)
  async handlePurchase(interaction, shopkeeperId, itemId, playerData) {
    // Placeholder - will implement actual purchase logic when items are ready
    await interaction.reply({
      content: '🚧 Purchase system coming soon! Items are still being prepared.',
      ephemeral: true
    });
  }
}

module.exports = ShopkeeperSystem;