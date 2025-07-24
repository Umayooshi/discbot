const mongoose = require('mongoose');

// Training session schema
const trainingSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, required: true },
  trainingType: { type: String, enum: ['basic', 'advanced', 'elite'], default: 'basic' },
  rewards: {
    xp: { type: Number, default: 0 },
    currency: { type: Number, default: 0 },
    items: [{ name: String, quantity: Number }]
  },
  status: { type: String, enum: ['active', 'completed', 'claimed'], default: 'active' }
});

const TrainingSession = mongoose.model('TrainingSession', trainingSessionSchema);

class TrainingSystem {
  constructor() {
    this.maxTrainingSlots = 3;
    this.trainingDurations = {
      // Training duration in minutes based on level
      1: 3,    // Level 1: 3 minutes
      2: 5,    // Level 2: 5 minutes
      3: 8,    // Level 3: 8 minutes
      4: 12,   // Level 4: 12 minutes
      5: 18,   // Level 5: 18 minutes
      6: 25,   // Level 6: 25 minutes
      7: 35,   // Level 7: 35 minutes
      8: 45,   // Level 8: 45 minutes
      9: 60,   // Level 9: 1 hour
      10: 90,  // Level 10: 1.5 hours
      11: 120, // Level 11: 2 hours
      12: 150, // Level 12: 2.5 hours
      13: 180, // Level 13: 3 hours
      14: 240, // Level 14: 4 hours
      15: 300, // Level 15: 5 hours
      16: 360, // Level 16: 6 hours
      17: 480, // Level 17: 8 hours
      18: 600, // Level 18: 10 hours
      19: 720, // Level 19: 12 hours
      20: 1440 // Level 20: 24 hours
    };
  }

  // Start training for a card
  async startTraining(userId, cardId) {
    try {
      const Card = mongoose.model('Card');
      
      // Check if card exists and belongs to user
      const card = await Card.findById(cardId);
      if (!card) {
        return { success: false, message: 'Card not found' };
      }
      
      if (card.ownerId !== userId) {
        console.log(`Ownership check failed - Card owner: ${card.ownerId}, User: ${userId}`);
        return { success: false, message: 'Card not owned by user' };
      }

      // Check if card is already in training
      const existingSession = await TrainingSession.findOne({
        userId: userId,
        cardId: cardId,
        status: 'active'
      });
      
      if (existingSession) {
        return { success: false, message: 'Card is already in training' };
      }

      // Check if card is knocked out
      if (card.stats.hp <= 0) {
        return { success: false, message: 'Card is knocked out and cannot train' };
      }

      // Check training slots
      const activeTrainingSessions = await TrainingSession.countDocuments({
        userId: userId,
        status: 'active'
      });

      if (activeTrainingSessions >= this.maxTrainingSlots) {
        return { success: false, message: `Maximum training slots (${this.maxTrainingSlots}) reached` };
      }

      // Calculate training duration
      const duration = this.trainingDurations[card.level] || this.trainingDurations[20];
      const endTime = new Date(Date.now() + duration * 60 * 1000);

      // Calculate rewards
      const rewards = this.calculateRewards(card.level);

      // Create training session
      const trainingSession = new TrainingSession({
        userId: userId,
        cardId: cardId,
        endTime: endTime,
        rewards: rewards
      });

      await trainingSession.save();

      return {
        success: true,
        session: trainingSession,
        duration: duration,
        rewards: rewards
      };

    } catch (error) {
      console.error('Error starting training:', error);
      return { success: false, message: 'Error starting training session' };
    }
  }

  // Get active training sessions for a user
  async getActiveTrainingSessions(userId) {
    try {
      const sessions = await TrainingSession.find({
        userId: userId,
        status: 'active'
      }).populate('cardId');

      return sessions.map(session => ({
        sessionId: session._id,
        card: session.cardId,
        startTime: session.startTime,
        endTime: session.endTime,
        timeRemaining: Math.max(0, session.endTime - Date.now()),
        rewards: session.rewards,
        progress: this.calculateProgress(session.startTime, session.endTime)
      }));
    } catch (error) {
      console.error('Error getting training sessions:', error);
      return [];
    }
  }

  // Calculate training progress percentage
  calculateProgress(startTime, endTime) {
    const totalDuration = endTime - startTime;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return Math.round(progress);
  }

  // Calculate rewards based on card level
  calculateRewards(cardLevel) {
    const baseXP = 50 + (cardLevel * 25);
    const baseCurrency = 10 + (cardLevel * 5);
    
    return {
      xp: baseXP,
      currency: baseCurrency,
      items: cardLevel >= 5 ? [{ name: 'Training Scroll', quantity: 1 }] : []
    };
  }

  // Complete training session
  async completeTraining(sessionId) {
    try {
      const session = await TrainingSession.findById(sessionId).populate('cardId');
      
      if (!session || session.status !== 'active') {
        return { success: false, message: 'Training session not found or not active' };
      }

      if (Date.now() < session.endTime) {
        return { success: false, message: 'Training not yet complete' };
      }

      const Card = mongoose.model('Card');
      const Player = mongoose.model('Player');

      // Level up the card
      const card = session.cardId;
      if (!card) {
        throw new Error('Card not found in training session');
      }
      const oldLevel = card.level;
      card.level += 1;
      card.xp += session.rewards.xp;

      // Update stats based on new level
      const statIncrease = this.calculateStatIncrease(card.level, card.class);
      card.stats.maxHp += statIncrease.hp;
      card.stats.hp = card.stats.maxHp; // Restore full HP on level up
      card.stats.attack += statIncrease.attack;
      card.stats.defense += statIncrease.defense;
      card.stats.speed += statIncrease.speed;

      await card.save();

      // Update player currency
      const player = await Player.findOne({ userId: session.userId });
      if (player) {
        player.currency += session.rewards.currency;
        await player.save();
      }

      // Mark session as completed
      session.status = 'completed';
      await session.save();

      return {
        success: true,
        card: card,
        oldLevel: oldLevel,
        newLevel: card.level,
        rewards: session.rewards,
        statIncrease: statIncrease
      };

    } catch (error) {
      console.error('Error completing training:', error);
      return { success: false, message: 'Error completing training' };
    }
  }

  // Calculate stat increases per level
  calculateStatIncrease(level, cardClass) {
    const classMultipliers = {
      'Tank': { hp: 80, attack: 20, defense: 60, speed: 5 },
      'Damage': { hp: 40, attack: 70, defense: 20, speed: 15 },
      'Support': { hp: 60, attack: 30, defense: 40, speed: 20 },
      'Intel': { hp: 50, attack: 50, defense: 30, speed: 25 }
    };

    const multiplier = classMultipliers[cardClass] || classMultipliers['Damage'];
    
    return {
      hp: multiplier.hp,
      attack: multiplier.attack,
      defense: multiplier.defense,
      speed: multiplier.speed
    };
  }

  // Format time remaining
  formatTimeRemaining(milliseconds) {
    if (milliseconds <= 0) return 'Complete!';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Create progress bar
  createProgressBar(percentage, length = 20) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  // Auto-complete finished training sessions
  async checkCompletedSessions() {
    try {
      const completedSessions = await TrainingSession.find({
        status: 'active',
        endTime: { $lte: new Date() }
      });

      for (const session of completedSessions) {
        await this.completeTraining(session._id);
      }

      return completedSessions.length;
    } catch (error) {
      console.error('Error checking completed sessions:', error);
      return 0;
    }
  }
}

module.exports = TrainingSystem;