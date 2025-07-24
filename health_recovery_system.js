const mongoose = require('mongoose');

// Health recovery session schema
const healthRecoverySchema = new mongoose.Schema({
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, required: true },
  recoveryRate: { type: Number, default: 10 } // HP per minute
});

const HealthRecovery = mongoose.model('HealthRecovery', healthRecoverySchema);

class HealthRecoverySystem {
  constructor() {
    this.baseRecoveryRate = 10; // HP per minute
    this.recoveryDuration = 30; // 30 minutes for full recovery
  }

  // Start health recovery for a knocked out card
  async startRecovery(cardId) {
    try {
      const Card = mongoose.model('Card');
      const card = await Card.findById(cardId);
      
      if (!card) {
        return { success: false, message: 'Card not found' };
      }

      if (card.stats.hp > 0) {
        return { success: false, message: 'Card is not knocked out' };
      }

      // Check if recovery is already in progress
      const existingRecovery = await HealthRecovery.findOne({
        cardId: cardId
      });

      if (existingRecovery) {
        return { success: false, message: 'Recovery already in progress' };
      }

      // Calculate recovery time based on max HP
      const recoveryTime = Math.ceil(card.stats.maxHp / this.baseRecoveryRate);
      const endTime = new Date(Date.now() + recoveryTime * 60 * 1000);

      const recovery = new HealthRecovery({
        cardId: cardId,
        endTime: endTime,
        recoveryRate: this.baseRecoveryRate
      });

      await recovery.save();

      return {
        success: true,
        recoveryTime: recoveryTime,
        endTime: endTime
      };

    } catch (error) {
      console.error('Error starting health recovery:', error);
      return { success: false, message: 'Error starting recovery' };
    }
  }

  // Check and complete health recovery
  async checkRecovery(cardId) {
    try {
      const recovery = await HealthRecovery.findOne({ cardId: cardId });
      
      if (!recovery) {
        return { success: false, message: 'No recovery in progress' };
      }

      const Card = mongoose.model('Card');
      const card = await Card.findById(cardId);
      
      if (!card) {
        return { success: false, message: 'Card not found' };
      }

      if (Date.now() >= recovery.endTime) {
        // Recovery complete
        card.stats.hp = card.stats.maxHp;
        await card.save();
        await HealthRecovery.deleteOne({ cardId: cardId });
        
        return {
          success: true,
          complete: true,
          card: card
        };
      } else {
        // Recovery in progress
        const timeRemaining = recovery.endTime - Date.now();
        const progress = Math.min(100, ((Date.now() - recovery.startTime) / (recovery.endTime - recovery.startTime)) * 100);
        const currentHp = Math.floor((progress / 100) * card.stats.maxHp);
        
        return {
          success: true,
          complete: false,
          timeRemaining: timeRemaining,
          progress: Math.round(progress),
          currentHp: currentHp,
          maxHp: card.stats.maxHp
        };
      }

    } catch (error) {
      console.error('Error checking recovery:', error);
      return { success: false, message: 'Error checking recovery' };
    }
  }

  // Get recovery status for display
  async getRecoveryStatus(cardId) {
    const result = await this.checkRecovery(cardId);
    
    if (!result.success) {
      return null;
    }

    if (result.complete) {
      return {
        status: 'complete',
        message: 'Fully recovered!'
      };
    } else {
      return {
        status: 'recovering',
        progress: result.progress,
        currentHp: result.currentHp,
        maxHp: result.maxHp,
        timeRemaining: this.formatTime(result.timeRemaining),
        progressBar: this.createProgressBar(result.progress)
      };
    }
  }

  // Format time for display
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Create progress bar
  createProgressBar(percentage, length = 15) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  // Auto-complete recoveries
  async processRecoveries() {
    try {
      const activeRecoveries = await HealthRecovery.find({
        endTime: { $lte: new Date() }
      });

      for (const recovery of activeRecoveries) {
        await this.checkRecovery(recovery.cardId);
      }

      return activeRecoveries.length;
    } catch (error) {
      console.error('Error processing recoveries:', error);
      return 0;
    }
  }
}

module.exports = HealthRecoverySystem;