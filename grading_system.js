// Models are defined in index.js, we'll pass them as parameters

class GradingSystem {
  constructor(Card, Player) {
    this.Card = Card;
    this.Player = Player;
    // Grade distribution percentages (totals 100%)
    this.gradeDistribution = [
      { grade: 6.0, weight: 15 },   // 15%
      { grade: 6.5, weight: 18 },   // 18%
      { grade: 7.0, weight: 25 },   // 25% - most common
      { grade: 7.5, weight: 20 },   // 20%
      { grade: 8.0, weight: 12 },   // 12%
      { grade: 8.5, weight: 6 },    // 6%
      { grade: 9.0, weight: 3 },    // 3%
      { grade: 9.5, weight: 0.8 },  // 0.8%
      { grade: 10.0, weight: 0.2 }  // 0.2% - ultra rare
    ];

    // Pricing
    this.initialGradeCost = 1000; // lumens
    this.regradeCost = 500;       // nova gems
  }

  /**
   * Generate a random grade based on weighted distribution
   */
  generateRandomGrade() {
    const totalWeight = this.gradeDistribution.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const gradeInfo of this.gradeDistribution) {
      random -= gradeInfo.weight;
      if (random <= 0) {
        return gradeInfo.grade;
      }
    }
    
    // Fallback (should never reach here)
    return 7.0;
  }

  /**
   * Check if user can afford grading
   */
  async canAffordGrade(userId, isRegrade = false) {
    try {
      const player = await this.Player.findOne({ userId });
      if (!player) return { canAfford: false, reason: 'Player not found' };

      if (isRegrade) {
        return {
          canAfford: player.novaGems >= this.regradeCost,
          cost: this.regradeCost,
          currency: 'Nova Gems',
          reason: player.novaGems < this.regradeCost ? 'Insufficient Nova Gems' : null
        };
      } else {
        return {
          canAfford: player.lumens >= this.initialGradeCost,
          cost: this.initialGradeCost,
          currency: 'Lumens',
          reason: player.lumens < this.initialGradeCost ? 'Insufficient Lumens' : null
        };
      }
    } catch (error) {
      console.error('Error checking grading affordability:', error);
      return { canAfford: false, reason: 'Database error' };
    }
  }

  /**
   * Deduct currency for grading
   */
  async deductGradingCost(userId, isRegrade = false) {
    try {
      const player = await this.Player.findOne({ userId });
      if (!player) return false;

      if (isRegrade) {
        if (player.novaGems >= this.regradeCost) {
          player.novaGems -= this.regradeCost;
          await player.save();
          return true;
        }
      } else {
        if (player.lumens >= this.initialGradeCost) {
          player.lumens -= this.initialGradeCost;
          await player.save();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error deducting grading cost:', error);
      return false;
    }
  }

  /**
   * Grade a card (initial grading)
   */
  async gradeCard(cardId, userId) {
    try {
      // Find the card
      const card = await this.Card.findOne({ cardId, ownerId: userId });
      if (!card) {
        return { success: false, message: 'Card not found in your collection' };
      }

      // Check if already graded
      if (card.grade !== undefined && card.grade !== null) {
        return { 
          success: false, 
          message: `Card already graded ${card.grade}. Use regrade option for 500 Nova Gems.` 
        };
      }

      // Check affordability
      const affordCheck = await this.canAffordGrade(userId, false);
      if (!affordCheck.canAfford) {
        return { 
          success: false, 
          message: `Cannot afford grading. Need ${affordCheck.cost} ${affordCheck.currency}. ${affordCheck.reason}` 
        };
      }

      // Deduct cost
      const paymentSuccess = await this.deductGradingCost(userId, false);
      if (!paymentSuccess) {
        return { success: false, message: 'Payment failed. Please try again.' };
      }

      // Generate grade
      const newGrade = this.generateRandomGrade();
      
      // Update card
      card.grade = newGrade;
      await card.save();

      return {
        success: true,
        grade: newGrade,
        cost: this.initialGradeCost,
        currency: 'Lumens',
        message: `Card successfully graded ${newGrade}!`
      };

    } catch (error) {
      console.error('Error grading card:', error);
      return { success: false, message: 'Grading failed. Please try again.' };
    }
  }

  /**
   * Regrade a card (can only improve or stay same)
   */
  async regradeCard(cardId, userId) {
    try {
      // Find the card
      const card = await this.Card.findOne({ cardId, ownerId: userId });
      if (!card) {
        return { success: false, message: 'Card not found in your collection' };
      }

      // Check if card has been graded
      if (card.grade === undefined || card.grade === null) {
        return { 
          success: false, 
          message: 'Card must be graded first. Use /grade for initial grading (1,000 Lumens).' 
        };
      }

      // Check affordability
      const affordCheck = await this.canAffordGrade(userId, true);
      if (!affordCheck.canAfford) {
        return { 
          success: false, 
          message: `Cannot afford regrading. Need ${affordCheck.cost} ${affordCheck.currency}. ${affordCheck.reason}` 
        };
      }

      // Deduct cost
      const paymentSuccess = await this.deductGradingCost(userId, true);
      if (!paymentSuccess) {
        return { success: false, message: 'Payment failed. Please try again.' };
      }

      // Generate new grade (can only improve or stay same)
      const currentGrade = card.grade;
      let newGrade = this.generateRandomGrade();
      
      // Ensure new grade is not lower than current
      if (newGrade < currentGrade) {
        newGrade = currentGrade;
      }

      // Update card
      const oldGrade = card.grade;
      card.grade = newGrade;
      await card.save();

      const improved = newGrade > oldGrade;

      return {
        success: true,
        oldGrade: oldGrade,
        newGrade: newGrade,
        improved: improved,
        cost: this.regradeCost,
        currency: 'Nova Gems',
        message: improved ? 
          `Card improved from ${oldGrade} to ${newGrade}!` : 
          `Card maintained grade ${newGrade}.`
      };

    } catch (error) {
      console.error('Error regrading card:', error);
      return { success: false, message: 'Regrading failed. Please try again.' };
    }
  }

  /**
   * Get grading statistics
   */
  getGradingStats() {
    return {
      initialCost: this.initialGradeCost,
      regradeCost: this.regradeCost,
      distribution: this.gradeDistribution,
      gradeScale: '6.0 - 10.0'
    };
  }

  /**
   * Format grade for display
   */
  formatGrade(grade) {
    if (grade === undefined || grade === null) {
      return 'Ungraded';
    }
    return grade.toFixed(1);
  }
}

module.exports = GradingSystem;