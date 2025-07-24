const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } = require('discord.js');

class JessiesPetShop {
  constructor() {
    this.pets = {
      // Tank-focused pets
      guardian_turtle: { 
        name: '🛡️ Guardian Turtle', 
        class: 'tank', 
        effect: 'hp_boost', 
        value: 15, 
        description: '+15% max HP boost', 
        cost: 800, 
        rarity: 'common' 
      },
      iron_rhino: { 
        name: '🦏 Iron Rhino', 
        class: 'tank', 
        effect: 'defense_boost', 
        value: 20, 
        description: '+20% defense boost', 
        cost: 1200, 
        rarity: 'uncommon' 
      },
      fortress_bear: { 
        name: '🐻 Fortress Bear', 
        class: 'tank', 
        effect: 'damage_reduction', 
        value: 10, 
        description: '10% damage reduction', 
        cost: 2000, 
        rarity: 'rare' 
      },
      
      // Support-focused pets
      healing_fairy: { 
        name: '🧚 Healing Fairy', 
        class: 'support', 
        effect: 'heal_boost', 
        value: 25, 
        description: '+25% healing effectiveness', 
        cost: 1000, 
        rarity: 'uncommon' 
      },
      spirit_owl: { 
        name: '🦉 Spirit Owl', 
        class: 'support', 
        effect: 'team_heal', 
        value: 5, 
        description: '5% team heal per turn', 
        cost: 1800, 
        rarity: 'rare' 
      },
      divine_phoenix: { 
        name: '🔥 Divine Phoenix', 
        class: 'support', 
        effect: 'revive_chance', 
        value: 15, 
        description: '15% chance to revive with 25% HP', 
        cost: 4000, 
        rarity: 'legendary' 
      },
      
      // Damage-focused pets
      lightning_wolf: { 
        name: '⚡ Lightning Wolf', 
        class: 'damage', 
        effect: 'attack_boost', 
        value: 18, 
        description: '+18% attack power', 
        cost: 1100, 
        rarity: 'common' 
      },
      shadow_panther: { 
        name: '🐆 Shadow Panther', 
        class: 'damage', 
        effect: 'crit_boost', 
        value: 12, 
        description: '+12% critical hit chance', 
        cost: 1600, 
        rarity: 'uncommon' 
      },
      inferno_dragon: { 
        name: '🐲 Inferno Dragon', 
        class: 'damage', 
        effect: 'burn_aura', 
        value: 8, 
        description: 'Burn enemies for 8% damage per turn', 
        cost: 3500, 
        rarity: 'legendary' 
      },
      
      // Intel-focused pets
      crystal_fox: { 
        name: '🦊 Crystal Fox', 
        class: 'intel', 
        effect: 'speed_boost', 
        value: 22, 
        description: '+22% speed boost', 
        cost: 900, 
        rarity: 'common' 
      },
      mystic_raven: { 
        name: '🐦‍⬛ Mystic Raven', 
        class: 'intel', 
        effect: 'ability_cooldown', 
        value: 15, 
        description: '15% faster ability cooldowns', 
        cost: 1400, 
        rarity: 'uncommon' 
      },
      void_serpent: { 
        name: '🐍 Void Serpent', 
        class: 'intel', 
        effect: 'mana_boost', 
        value: 20, 
        description: '+20% ability damage', 
        cost: 2500, 
        rarity: 'rare' 
      },
      
      // Universal/Special pets
      chaos_butterfly: { 
        name: '🦋 Chaos Butterfly', 
        class: 'universal', 
        effect: 'random_boost', 
        value: 15, 
        description: 'Random 15% boost to any stat each battle', 
        cost: 2200, 
        rarity: 'rare' 
      },
      cosmic_cat: { 
        name: '🐱 Cosmic Cat', 
        class: 'universal', 
        effect: 'luck_boost', 
        value: 10, 
        description: '+10% all positive effects', 
        cost: 3000, 
        rarity: 'epic' 
      },
      
      // Game-changing legendary pets
      phoenix_emperor: { 
        name: '👑 Phoenix Emperor', 
        class: 'universal', 
        effect: 'battle_resurrection', 
        value: 25, 
        description: 'If defeated, resurrect with 25% HP (once per battle)', 
        cost: 6000, 
        rarity: 'legendary' 
      },
      storm_leviathan: { 
        name: '🌊 Storm Leviathan', 
        class: 'damage', 
        effect: 'chain_lightning', 
        value: 15, 
        description: 'Attacks have 25% chance to hit all enemies for 15% damage', 
        cost: 7500, 
        rarity: 'mythic' 
      },
      time_sphinx: { 
        name: '⏰ Time Sphinx', 
        class: 'intel', 
        effect: 'extra_turn', 
        value: 10, 
        description: '10% chance for extra turn', 
        cost: 8000, 
        rarity: 'mythic' 
      },
      
      // Meta-defining pets for level 100 battles
      soul_reaper: { 
        name: '💀 Soul Reaper', 
        class: 'damage', 
        effect: 'execute_low_hp', 
        value: 20, 
        description: 'Instantly defeat enemies below 20% HP', 
        cost: 12000, 
        rarity: 'mythic' 
      },
      guardian_angel: { 
        name: '👼 Guardian Angel', 
        class: 'support', 
        effect: 'damage_immunity', 
        value: 3, 
        description: 'Immune to next 3 attacks when HP drops below 30%', 
        cost: 15000, 
        rarity: 'mythic' 
      },
      
      // Team-focused pets for 5v5
      pack_alpha: { 
        name: '🐺 Pack Alpha', 
        class: 'universal', 
        effect: 'team_stat_boost', 
        value: 8, 
        description: '+8% all stats to entire team', 
        cost: 10000, 
        rarity: 'legendary' 
      },
      war_banner: { 
        name: '🏴 War Banner', 
        class: 'universal', 
        effect: 'team_damage_boost', 
        value: 12, 
        description: '+12% damage for entire team', 
        cost: 9000, 
        rarity: 'legendary' 
      },
      
      // Specialist utility pets
      treasure_goblin: { 
        name: '👺 Treasure Goblin', 
        class: 'universal', 
        effect: 'currency_boost', 
        value: 50, 
        description: '+50% currency from all sources', 
        cost: 3500, 
        rarity: 'epic' 
      },
      exp_slime: { 
        name: '🟢 Experience Slime', 
        class: 'universal', 
        effect: 'exp_boost', 
        value: 40, 
        description: '+40% XP gain', 
        cost: 2800, 
        rarity: 'rare' 
      },
      
      // Environmental effect pets
      ice_wraith: { 
        name: '❄️ Ice Wraith', 
        class: 'intel', 
        effect: 'freeze_chance', 
        value: 20, 
        description: '20% chance to freeze enemy (skip turn)', 
        cost: 3200, 
        rarity: 'epic' 
      },
      poison_toad: { 
        name: '🐸 Poison Toad', 
        class: 'damage', 
        effect: 'poison_stack', 
        value: 6, 
        description: 'Poison enemies, stacking 6% damage per turn', 
        cost: 2700, 
        rarity: 'rare' 
      },
      
      // Defensive specialists
      mirror_spirit: { 
        name: '🪞 Mirror Spirit', 
        class: 'tank', 
        effect: 'reflect_damage', 
        value: 30, 
        description: 'Reflect 30% of received damage', 
        cost: 4500, 
        rarity: 'epic' 
      },
      shield_golem: { 
        name: '🗿 Shield Golem', 
        class: 'tank', 
        effect: 'taunt_enemy', 
        value: 75, 
        description: '75% chance enemies target this card', 
        cost: 3800, 
        rarity: 'rare' 
      }
    };
    
    this.rarityColors = {
      common: '#95a5a6',
      uncommon: '#27ae60',
      rare: '#3498db',
      epic: '#9b59b6',
      legendary: '#f39c12',
      mythic: '#e74c3c'
    };
  }

  async openPetShop(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🐾 Jessie\'s Pet Emporium')
      .setDescription('**Welcome to the finest pet shop in all the realms!**\n\n*Each battle companion offers unique advantages that can turn the tide in high-level combat. Perfect for those level 100 showdowns!*')
      .addFields([
        {
          name: '🛡️ Tank Pets',
          value: 'Defensive specialists\n**Guardian Turtle, Iron Rhino, Fortress Bear**\nBoost HP, defense, damage reduction',
          inline: true
        },
        {
          name: '⚔️ Damage Pets',
          value: 'Offensive powerhouses\n**Lightning Wolf, Inferno Dragon, Soul Reaper**\nBoost attack, crit, burn effects',
          inline: true
        },
        {
          name: '💚 Support Pets',
          value: 'Healing specialists\n**Healing Fairy, Divine Phoenix, Guardian Angel**\nBoost healing, revive, immunity',
          inline: true
        },
        {
          name: '🧠 Intel Pets',
          value: 'Strategic advantages\n**Crystal Fox, Time Sphinx, Void Serpent**\nBoost speed, cooldowns, abilities',
          inline: true
        },
        {
          name: '🌟 Universal Pets',
          value: 'Game-changing abilities\n**Pack Alpha, Cosmic Cat, Phoenix Emperor**\nTeam boosts, luck, resurrections',
          inline: true
        },
        {
          name: '🏆 Meta Impact',
          value: 'In level 100 battles, pets often decide victory!\n**5v5 Team Effects** • **Strategic Counters**',
          inline: true
        }
      ])
      .setColor('#8b4513')
      .setFooter({ text: 'Jessie\'s Pet Emporium • "Every hero needs a loyal companion!"' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pet_browse_by_class')
        .setLabel('📋 Browse by Class')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('pet_browse_by_rarity')
        .setLabel('⭐ Browse by Rarity')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('pet_my_collection')
        .setLabel('🐾 My Pets')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.update({ embeds: [embed], components: [buttons] });
  }

  async browsePetsByClass(interaction, selectedClass = 'tank') {
    const classPets = Object.entries(this.pets).filter(([key, pet]) => 
      pet.class === selectedClass || (selectedClass === 'universal' && pet.class === 'universal')
    );

    const embed = new EmbedBuilder()
      .setTitle(`🐾 ${selectedClass.toUpperCase()} Class Pets`)
      .setDescription(`**Specialized companions for ${selectedClass} gameplay**`)
      .setColor(this.getClassColor(selectedClass));

    classPets.forEach(([key, pet]) => {
      embed.addFields({
        name: `${pet.name} (${pet.rarity.toUpperCase()})`,
        value: `**Effect:** ${pet.description}\n**Cost:** ${pet.cost} ✨ Lumens`,
        inline: true
      });
    });

    const classButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('pet_class_tank').setLabel('🛡️ Tank').setStyle(selectedClass === 'tank' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_class_damage').setLabel('⚔️ Damage').setStyle(selectedClass === 'damage' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_class_support').setLabel('💚 Support').setStyle(selectedClass === 'support' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_class_intel').setLabel('🧠 Intel').setStyle(selectedClass === 'intel' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_class_universal').setLabel('🌟 Universal').setStyle(selectedClass === 'universal' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [classButtons] });
  }

  async browsePetsByRarity(interaction, selectedRarity = 'common') {
    const rarityPets = Object.entries(this.pets).filter(([key, pet]) => pet.rarity === selectedRarity);

    const embed = new EmbedBuilder()
      .setTitle(`⭐ ${selectedRarity.toUpperCase()} Rarity Pets`)
      .setDescription(`**${selectedRarity.charAt(0).toUpperCase() + selectedRarity.slice(1)} tier battle companions**`)
      .setColor(this.rarityColors[selectedRarity]);

    rarityPets.forEach(([key, pet]) => {
      embed.addFields({
        name: `${pet.name} (${pet.class.toUpperCase()})`,
        value: `**Effect:** ${pet.description}\n**Cost:** ${pet.cost} ✨ Lumens`,
        inline: true
      });
    });

    const rarityButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('pet_rarity_common').setLabel('Common').setStyle(selectedRarity === 'common' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_rarity_uncommon').setLabel('Uncommon').setStyle(selectedRarity === 'uncommon' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_rarity_rare').setLabel('Rare').setStyle(selectedRarity === 'rare' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_rarity_epic').setLabel('Epic').setStyle(selectedRarity === 'epic' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_rarity_legendary').setLabel('Legendary').setStyle(selectedRarity === 'legendary' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    const mythicButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('pet_rarity_mythic').setLabel('💀 Mythic').setStyle(selectedRarity === 'mythic' ? ButtonStyle.Danger : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pet_shop_return').setLabel('🏪 Return to Shop').setStyle(ButtonStyle.Primary)
    );

    await interaction.update({ embeds: [embed], components: [rarityButtons, mythicButton] });
  }

  async purchasePet(interaction, petKey, player) {
    const pet = this.pets[petKey];
    if (!pet) {
      return interaction.update({ content: '❌ Pet not found!', embeds: [], components: [] });
    }

    if (player.lumens < pet.cost) {
      return interaction.update({ 
        content: `💸 You need ${pet.cost} ✨ Lumens to purchase ${pet.name}!`,
        embeds: [], 
        components: [] 
      });
    }

    // Check if player already owns this pet
    if (!player.pets) player.pets = [];
    if (player.pets.includes(petKey)) {
      return interaction.update({ 
        content: `🐾 You already own ${pet.name}!`,
        embeds: [], 
        components: [] 
      });
    }

    // Purchase successful
    player.lumens -= pet.cost;
    player.pets.push(petKey);
    await player.save();

    const successEmbed = new EmbedBuilder()
      .setTitle('🎉 Pet Purchased Successfully!')
      .setDescription(`**${pet.name} joins your collection!**\n\n*Jessie smiles warmly as she hands over your new companion.*`)
      .addFields([
        { name: '🐾 New Pet', value: pet.name, inline: true },
        { name: '📊 Effect', value: pet.description, inline: true },
        { name: '🎭 Class', value: pet.class.toUpperCase(), inline: true }
      ])
      .setColor(this.rarityColors[pet.rarity])
      .setFooter({ text: 'Use /equippet to assign this pet to your cards!' });

    const returnButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pet_shop_return')
        .setLabel('🏪 Continue Shopping')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.update({ embeds: [successEmbed], components: [returnButton] });
  }

  getClassColor(className) {
    const colors = {
      tank: '#3498db',
      damage: '#e74c3c', 
      support: '#2ecc71',
      intel: '#9b59b6',
      universal: '#f39c12'
    };
    return colors[className] || '#95a5a6';
  }

  calculatePetEffect(pet, baseStats, battleContext = {}) {
    if (!pet || !this.pets[pet]) return baseStats;
    
    const petData = this.pets[pet];
    const modifiedStats = { ...baseStats };
    
    switch (petData.effect) {
      case 'hp_boost':
        modifiedStats.maxHp = Math.floor(modifiedStats.maxHp * (1 + petData.value / 100));
        modifiedStats.hp = modifiedStats.maxHp;
        break;
      case 'attack_boost':
        modifiedStats.attack = Math.floor(modifiedStats.attack * (1 + petData.value / 100));
        break;
      case 'defense_boost':
        modifiedStats.defense = Math.floor(modifiedStats.defense * (1 + petData.value / 100));
        break;
      case 'speed_boost':
        modifiedStats.speed = Math.floor(modifiedStats.speed * (1 + petData.value / 100));
        break;
      // Special effects are handled during battle
    }
    
    return modifiedStats;
  }

  // Battle effect handlers for special pets
  handleBattleEffect(pet, effectType, battleData) {
    if (!pet || !this.pets[pet]) return null;
    
    const petData = this.pets[pet];
    
    switch (effectType) {
      case 'on_damage_taken':
        if (petData.effect === 'reflect_damage') {
          return { type: 'reflect', value: petData.value };
        }
        break;
      case 'on_turn_start':
        if (petData.effect === 'burn_aura' || petData.effect === 'poison_stack') {
          return { type: 'damage_over_time', value: petData.value };
        }
        break;
      case 'on_death':
        if (petData.effect === 'battle_resurrection') {
          return { type: 'resurrect', value: petData.value };
        }
        break;
    }
    
    return null;
  }
}

module.exports = { JessiesPetShop };