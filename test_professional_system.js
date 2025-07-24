const ProfessionalImageSystem = require('./professional_image_system.js');
const fs = require('fs');

async function testProfessionalSystem() {
  console.log('Testing Professional Image System...');
  
  // Test card data
  const testCard = {
    name: 'Spike Spiegel',
    series: 'Cowboy Bebop',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b1-ChxaldmieZR.png',
    class: 'Damage',
    level: 5,
    printNumber: 1,
    dyeSettings: {
      hue: 0,
      saturation: 100,
      highlights: 0
    }
  };
  
  try {
    console.log('Generating professional card...');
    const cardBuffer = await ProfessionalImageSystem.generateProfessionalCard(testCard);
    
    if (cardBuffer) {
      fs.writeFileSync('test_professional_card.png', cardBuffer);
      console.log('✅ Professional card generated successfully: test_professional_card.png');
      
      // Test with custom dye
      const testCardWithDye = {
        ...testCard,
        name: 'Faye Valentine',
        dyeSettings: {
          hue: 300,
          saturation: 150,
          highlights: 20
        }
      };
      
      const dyedCardBuffer = await ProfessionalImageSystem.generateProfessionalCard(testCardWithDye);
      fs.writeFileSync('test_professional_card_dyed.png', dyedCardBuffer);
      console.log('✅ Professional card with dye generated: test_professional_card_dyed.png');
      
      return true;
    } else {
      console.log('❌ Professional system returned null');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing professional system:', error);
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testProfessionalSystem().then(success => {
    console.log(success ? 'Professional system test: PASSED' : 'Professional system test: FAILED');
    process.exit(success ? 0 : 1);
  });
}

module.exports = testProfessionalSystem;