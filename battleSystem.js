const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const mongoose = require('mongoose');
const abilities = require('./abilities');
const gameLogic = require('./gameLogic');

// Get existing schemas - use lazy loading to avoid circular dependencies
const getCard = () => mongoose.model('Card');
const getPlayer = () => mongoose.model('Player');
const getBattleSession = () => mongoose.model('BattleSession');

// Battle state management
const activeBattles = new Map();

// Initialize battle session
async function initializeBattle(challengerId, opponentId, challengerCardId) {
  try {
    // Get challenger's card
    const challengerCard = await getCard().findOne({ cardId: challengerCardId });
    if (!challengerCard) return null;
    
    // Get opponent's cards to check if they have any
    const opponent = await getPlayer().findOne({ userId: opponentId }).populate('cards');
    if (!opponent || opponent.cards.length === 0) return null;
    
    // Check if opponent has any healthy cards
    const healthyCards = opponent.cards.filter(card => card.stats.hp > 0);
    if (healthyCards.length === 0) return null;
    
    // Create battle session with only challenger card, opponent will choose later
    const sessionId = generateBattleId();
    const battleSession = new (getBattleSession())({
      sessionId,
      players: [
        {
          userId: challengerId,
          cardId: challengerCard._id,
          currentHp: challengerCard.stats.hp,
          effects: []
        },
        {
          userId: opponentId,
          cardId: null, // Opponent will choose their card
          currentHp: 0,
          effects: []
        }
      ],
      battleType: '1v1',
      status: 'waiting'
    });
    
    await battleSession.save();
    
    // Store in active battles for quick access
    activeBattles.set(sessionId, {
      session: battleSession,
      cards: [challengerCard, null] // Second card will be set when opponent chooses
    });
    
    return sessionId;
  } catch (error) {
    console.error('Error initializing battle:', error);
    return null;
  }
}

// Generate unique battle ID
function generateBattleId() {
  return 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Handle battle interactions
async function handleBattleInteraction(interaction) {
  const customId = interaction.customId;
  
  if (customId.startsWith('battle_accept_')) {
    await handleBattleAccept(interaction);
  } else if (customId.startsWith('battle_decline_')) {
    await handleBattleDecline(interaction);
  } else if (customId.startsWith('battle_card_')) {
    await handleCardSelection(interaction);
  } else if (customId.startsWith('ability_')) {
    await handleAbilitySelection(interaction);
  }
}

// Handle battle accept
async function handleBattleAccept(interaction) {
  const sessionId = interaction.customId.split('_')[2];
  const battleData = activeBattles.get(sessionId);
  
  if (!battleData) {
    return interaction.reply({ content: '❌ Battle session not found.', ephemeral: true });
  }
  
  const session = battleData.session;
  const opponentUserId = session.players[1].userId;
  
  if (interaction.user.id !== opponentUserId) {
    return interaction.reply({ content: '❌ This battle is not for you.', ephemeral: true });
  }
  
  // Show card selection for opponent
  const opponent = await getPlayer().findOne({ userId: opponentUserId }).populate('cards');
  const healthyCards = opponent.cards.filter(card => card.stats.hp > 0);
  
  if (healthyCards.length === 0) {
    return interaction.reply({ content: '❌ You have no healthy cards to battle with.', ephemeral: true });
  }
  
  const embed = new EmbedBuilder()
    .setTitle('🎴 Select Your Battle Card')
    .setDescription('Choose a card to battle with:')
    .setColor('#00ff00');
  
  // Create buttons for card selection (max 5 cards per row)
  const rows = [];
  const cardsToShow = healthyCards.slice(0, 15); // Limit to 15 cards
  
  for (let i = 0; i < cardsToShow.length; i += 5) {
    const row = new ActionRowBuilder();
    const cardsInRow = cardsToShow.slice(i, i + 5);
    
    cardsInRow.forEach(card => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_card_${sessionId}_${card.cardId}`)
          .setLabel(`${card.name} (Lv.${card.level})`)
          .setStyle(ButtonStyle.Primary)
      );
    });
    
    rows.push(row);
  }
  
  await interaction.update({ embeds: [embed], components: rows });
}

// Handle battle decline
async function handleBattleDecline(interaction) {
  const sessionId = interaction.customId.split('_')[2];
  
  // Remove from active battles
  activeBattles.delete(sessionId);
  
  // Remove from database
  await getBattleSession().deleteOne({ sessionId });
  
  await interaction.update({
    content: '❌ Battle declined.',
    embeds: [],
    components: []
  });
}

// Handle card selection
async function handleCardSelection(interaction) {
  const parts = interaction.customId.split('_');
  const sessionId = parts[2];
  const cardId = parts[3];
  
  const battleData = activeBattles.get(sessionId);
  if (!battleData) {
    return interaction.reply({ content: '❌ Battle session not found.', ephemeral: true });
  }
  
  const selectedCard = await getCard().findOne({ cardId });
  if (!selectedCard) {
    return interaction.reply({ content: '❌ Card not found.', ephemeral: true });
  }
  
  // Update battle session with opponent's card
  const session = battleData.session;
  session.players[1].cardId = selectedCard._id;
  session.players[1].currentHp = selectedCard.stats.hp;
  session.status = 'active';
  
  // Determine turn order based on speed
  const challengerCard = battleData.cards[0];
  const opponentCard = selectedCard;
  
  if (challengerCard.stats.speed >= opponentCard.stats.speed) {
    session.turnOrder = [session.players[0].userId, session.players[1].userId];
  } else {
    session.turnOrder = [session.players[1].userId, session.players[0].userId];
  }
  
  await session.save();
  
  // Update battle data
  battleData.cards[1] = selectedCard;
  battleData.session = session;
  
  // Start the battle
  await startBattle(interaction, sessionId);
}

// Start battle with first turn
async function startBattle(interaction, sessionId) {
  const battleData = activeBattles.get(sessionId);
  const session = battleData.session;
  const [challengerCard, opponentCard] = battleData.cards;
  
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Battle Started!')
    .setDescription(`**${challengerCard.name}** (Lv.${challengerCard.level}) vs **${opponentCard.name}** (Lv.${opponentCard.level})`)
    .addFields(
      {
        name: `${challengerCard.name} (${challengerCard.class})`,
        value: `HP: ${session.players[0].currentHp}/${challengerCard.stats.maxHp}\nATK: ${challengerCard.stats.attack} | DEF: ${challengerCard.stats.defense}`,
        inline: true
      },
      {
        name: `${opponentCard.name} (${opponentCard.class})`,
        value: `HP: ${session.players[1].currentHp}/${opponentCard.stats.maxHp}\nATK: ${opponentCard.stats.attack} | DEF: ${opponentCard.stats.defense}`,
        inline: true
      }
    )
    .setColor('#ff6b6b');
  
  // Show turn and abilities
  const currentPlayerId = session.turnOrder[session.currentTurn];
  const currentPlayerIndex = session.players.findIndex(p => p.userId === currentPlayerId);
  const currentCard = battleData.cards[currentPlayerIndex];
  
  embed.addFields({
    name: '🎯 Current Turn',
    value: `<@${currentPlayerId}> with **${currentCard.name}**\nSelect an ability:`,
    inline: false
  });
  
  // Create ability buttons
  const abilityRow = new ActionRowBuilder();
  const cardAbilities = currentCard.abilities.slice(0, 4); // Max 4 abilities per row
  
  cardAbilities.forEach(abilityKey => {
    const ability = abilities.getAbilityDetails(abilityKey);
    abilityRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`ability_${sessionId}_${abilityKey}`)
        .setLabel(ability.name)
        .setStyle(ButtonStyle.Secondary)
    );
  });
  
  const components = [abilityRow];
  
  await interaction.update({ embeds: [embed], components });
}

// Handle ability selection
async function handleAbilitySelection(interaction) {
  const parts = interaction.customId.split('_');
  const sessionId = parts[1];
  const abilityKey = parts[2];
  
  const battleData = activeBattles.get(sessionId);
  if (!battleData) {
    return interaction.reply({ content: '❌ Battle session not found.', ephemeral: true });
  }
  
  const session = battleData.session;
  const currentPlayerId = session.turnOrder[session.currentTurn];
  
  if (interaction.user.id !== currentPlayerId) {
    return interaction.reply({ content: '❌ It\'s not your turn!', ephemeral: true });
  }
  
  // Execute ability
  const result = await executeAbility(sessionId, abilityKey);
  
  if (result.battleEnded) {
    await endBattle(interaction, sessionId, result);
  } else {
    await continueBattle(interaction, sessionId, result);
  }
}

// Execute ability in battle
async function executeAbility(sessionId, abilityKey) {
  const battleData = activeBattles.get(sessionId);
  const session = battleData.session;
  const [challengerCard, opponentCard] = battleData.cards;
  
  const currentTurn = session.currentTurn;
  const currentPlayerIndex = session.players.findIndex(p => p.userId === session.turnOrder[currentTurn]);
  const targetPlayerIndex = 1 - currentPlayerIndex;
  
  const attackerCard = battleData.cards[currentPlayerIndex];
  const defenderCard = battleData.cards[targetPlayerIndex];
  
  const ability = abilities.getAbilityDetails(abilityKey);
  const effect = abilities.applyAbilityEffect(ability, attackerCard, defenderCard);
  
  // Apply damage
  if (effect.damage > 0) {
    session.players[targetPlayerIndex].currentHp -= effect.damage;
    session.players[targetPlayerIndex].currentHp = Math.max(0, session.players[targetPlayerIndex].currentHp);
  }
  
  // Apply healing
  if (effect.healing > 0) {
    session.players[currentPlayerIndex].currentHp += effect.healing;
    session.players[currentPlayerIndex].currentHp = Math.min(
      attackerCard.stats.maxHp,
      session.players[currentPlayerIndex].currentHp
    );
  }
  
  // Apply effects (buffs/debuffs)
  effect.effects.forEach(eff => {
    const targetIndex = eff.target === 'attacker' ? currentPlayerIndex : targetPlayerIndex;
    session.players[targetIndex].effects.push(eff);
  });
  
  // Check if battle ended
  const battleEnded = session.players[targetPlayerIndex].currentHp <= 0;
  
  // Next turn
  if (!battleEnded) {
    session.currentTurn = (session.currentTurn + 1) % 2;
    
    // Process effects (reduce duration, apply ongoing effects)
    session.players.forEach(player => {
      player.effects = player.effects.filter(eff => {
        eff.duration--;
        return eff.duration > 0;
      });
    });
  }
  
  await session.save();
  
  return {
    battleEnded,
    ability,
    effect,
    attackerCard,
    defenderCard,
    winner: battleEnded ? session.turnOrder[currentTurn] : null
  };
}

// Continue battle with next turn
async function continueBattle(interaction, sessionId, result) {
  const battleData = activeBattles.get(sessionId);
  const session = battleData.session;
  const [challengerCard, opponentCard] = battleData.cards;
  
  const flavorText = abilities.getFlavorText(result.attackerCard.name, result.ability.name);
  
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Battle Continues!')
    .setDescription(`**${result.attackerCard.name}** used **${result.ability.name}**!\n\n*${flavorText}*`)
    .addFields(
      {
        name: `${challengerCard.name}`,
        value: `HP: ${session.players[0].currentHp}/${challengerCard.stats.maxHp}`,
        inline: true
      },
      {
        name: `${opponentCard.name}`,
        value: `HP: ${session.players[1].currentHp}/${opponentCard.stats.maxHp}`,
        inline: true
      }
    )
    .setColor('#ff6b6b');
  
  // Show effect results
  let effectText = '';
  if (result.effect.damage > 0) {
    effectText += `💥 **${result.effect.damage}** damage dealt!\n`;
  }
  if (result.effect.healing > 0) {
    effectText += `💚 **${result.effect.healing}** HP restored!\n`;
  }
  if (result.effect.effects.length > 0) {
    effectText += `✨ Special effects applied!\n`;
  }
  
  if (effectText) {
    embed.addFields({ name: 'Effect', value: effectText, inline: false });
  }
  
  // Show next turn
  const currentPlayerId = session.turnOrder[session.currentTurn];
  const currentPlayerIndex = session.players.findIndex(p => p.userId === currentPlayerId);
  const currentCard = battleData.cards[currentPlayerIndex];
  
  embed.addFields({
    name: '🎯 Next Turn',
    value: `<@${currentPlayerId}> with **${currentCard.name}**\nSelect an ability:`,
    inline: false
  });
  
  // Create ability buttons
  const abilityRow = new ActionRowBuilder();
  const cardAbilities = currentCard.abilities.slice(0, 4);
  
  cardAbilities.forEach(abilityKey => {
    const ability = abilities.getAbilityDetails(abilityKey);
    abilityRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`ability_${sessionId}_${abilityKey}`)
        .setLabel(ability.name)
        .setStyle(ButtonStyle.Secondary)
    );
  });
  
  await interaction.update({ embeds: [embed], components: [abilityRow] });
}

// End battle and award rewards
async function endBattle(interaction, sessionId, result) {
  const battleData = activeBattles.get(sessionId);
  const session = battleData.session;
  const [challengerCard, opponentCard] = battleData.cards;
  
  const winnerId = result.winner;
  const winnerIndex = session.players.findIndex(p => p.userId === winnerId);
  const loserIndex = 1 - winnerIndex;
  
  const winnerCard = battleData.cards[winnerIndex];
  const loserCard = battleData.cards[loserIndex];
  
  const flavorText = abilities.getFlavorText(result.attackerCard.name, result.ability.name);
  
  const embed = new EmbedBuilder()
    .setTitle('🏆 Battle Ended!')
    .setDescription(`**${result.attackerCard.name}** used **${result.ability.name}**!\n\n*${flavorText}*\n\n**${winnerCard.name}** wins!`)
    .addFields(
      {
        name: 'Final Stats',
        value: `**${challengerCard.name}**: ${session.players[0].currentHp}/${challengerCard.stats.maxHp} HP\n` +
               `**${opponentCard.name}**: ${session.players[1].currentHp}/${opponentCard.stats.maxHp} HP`,
        inline: false
      }
    )
    .setColor('#00ff00');
  
  // Award XP and update stats
  const winnerXP = Math.floor(Math.random() * 50) + 50; // 50-100 XP
  const loserXP = Math.floor(Math.random() * 25) + 15; // 15-40 XP
  
  winnerCard.xp += winnerXP;
  winnerCard.battleStats.wins++;
  winnerCard.stats.hp = session.players[winnerIndex].currentHp;
  
  loserCard.xp += loserXP;
  loserCard.battleStats.losses++;
  loserCard.stats.hp = Math.max(1, session.players[loserIndex].currentHp); // Minimum 1 HP
  
  await winnerCard.save();
  await loserCard.save();
  
  // Update player stats
  const winnerPlayer = await getPlayer().findOne({ userId: winnerId });
  const loserPlayer = await getPlayer().findOne({ userId: session.players[loserIndex].userId });
  
  winnerPlayer.battleStats.wins++;
  loserPlayer.battleStats.losses++;
  
  await winnerPlayer.save();
  await loserPlayer.save();
  
  // Check for level ups
  const winnerLeveledUp = await gameLogic.levelUpCard(winnerCard);
  const loserLeveledUp = await gameLogic.levelUpCard(loserCard);
  
  let rewardText = `<@${winnerId}> earned **${winnerXP} XP**!\n<@${session.players[loserIndex].userId}> earned **${loserXP} XP**!`;
  
  if (winnerLeveledUp) {
    rewardText += `\n🎉 **${winnerCard.name}** leveled up to ${winnerCard.level}!`;
  }
  if (loserLeveledUp) {
    rewardText += `\n🎉 **${loserCard.name}** leveled up to ${loserCard.level}!`;
  }
  
  embed.addFields({ name: 'Rewards', value: rewardText, inline: false });
  
  // Clean up
  activeBattles.delete(sessionId);
  await getBattleSession().deleteOne({ sessionId });
  
  await interaction.update({ embeds: [embed], components: [] });
}

// Clean up old battles (run periodically)
async function cleanupOldBattles() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  
  try {
    const oldBattles = await getBattleSession().find({ lastAction: { $lt: cutoff } });
    
    for (const battle of oldBattles) {
      activeBattles.delete(battle.sessionId);
      await getBattleSession().deleteOne({ sessionId: battle.sessionId });
    }
    
    console.log(`Cleaned up ${oldBattles.length} old battles`);
  } catch (error) {
    console.error('Error cleaning up battles:', error);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldBattles, 5 * 60 * 1000);

module.exports = {
  initializeBattle,
  handleBattleInteraction,
  cleanupOldBattles
};
