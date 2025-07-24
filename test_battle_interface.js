const ProfessionalBattleInterface = require('./professional_battle_interface.js');
const fs = require('fs');

async function testBattleInterface() {
  console.log('Testing Professional Battle Interface...');
  
  // Mock battle state with realistic data
  const testBattleState = {
    id: 'test_battle_123',
    userId: 'test_user',
    playerTeam: [
      {
        name: 'Spike Spiegel',
        class: 'Damage',
        series: 'Cowboy Bebop',
        imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b1-ChxaldmieZR.png',
        isAlive: true,
        stats: { hp: 180, maxHp: 250, attack: 120, defense: 60, speed: 90 }
      },
      {
        name: 'Faye Valentine',
        class: 'Intel',
        series: 'Cowboy Bebop',
        imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b2-UgqOGUgmDC0.png',
        isAlive: true,
        stats: { hp: 150, maxHp: 220, attack: 100, defense: 50, speed: 110 }
      },
      {
        name: 'Jet Black',
        class: 'Tank',
        series: 'Cowboy Bebop',
        imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b3-KUhyqc4D7lBH.png',
        isAlive: false,
        stats: { hp: 0, maxHp: 400, attack: 80, defense: 100, speed: 60 }
      }
    ],
    aiTeam: [
      {
        name: 'Edward Wong',
        class: 'Intel',
        series: 'Cowboy Bebop',
        imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b11-YOiXtQsQTFXN.png',
        isAlive: true,
        stats: { hp: 200, maxHp: 220, attack: 100, defense: 50, speed: 110 }
      },
      {
        name: 'Vicious',
        class: 'Damage',
        series: 'Cowboy Bebop',
        imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b8-KSgVDG1vyVVo.png',
        isAlive: true,
        stats: { hp: 100, maxHp: 250, attack: 120, defense: 60, speed: 90 }
      },
      {
        name: 'Julia',
        class: 'Support',
        series: 'Cowboy Bebop',
        imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b9-gVzTpGlD2L2T.png',
        isAlive: false,
        stats: { hp: 0, maxHp: 200, attack: 70, defense: 70, speed: 85 }
      }
    ],
    turn: 15,
    phase: 'active',
    battleLog: [
      { type: 'damage', message: 'Spike deals 45 damage to Vicious' },
      { type: 'death', message: 'Julia has been defeated!' },
      { type: 'damage', message: 'Edward deals 30 damage to Faye' }
    ],
    winner: null
  };
  
  try {
    const battleInterface = new ProfessionalBattleInterface();
    
    console.log('Generating professional battle interface...');
    const battleImageBuffer = await battleInterface.createBattleInterface(testBattleState);
    
    if (battleImageBuffer) {
      fs.writeFileSync('test_professional_battle.png', battleImageBuffer);
      console.log('✅ Professional battle interface generated: test_professional_battle.png');
      
      // Test ended battle state
      const endedBattleState = {
        ...testBattleState,
        phase: 'ended',
        winner: 'player',
        turn: 20
      };
      
      const endedBattleBuffer = await battleInterface.createBattleInterface(endedBattleState);
      fs.writeFileSync('test_professional_battle_victory.png', endedBattleBuffer);
      console.log('✅ Victory battle interface generated: test_professional_battle_victory.png');
      
      return true;
    } else {
      console.log('❌ Battle interface returned null');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing battle interface:', error);
    return false;
  }
}

// Run test
testBattleInterface().then(success => {
  console.log(success ? 'Battle interface test: PASSED' : 'Battle interface test: FAILED');
  process.exit(success ? 0 : 1);
});