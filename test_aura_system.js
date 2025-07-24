// Test script to debug aura system issues
const { AuraSystem } = require('./aura_system');
const fs = require('fs');

async function testAuraSystem() {
  try {
    console.log('Testing Aura System...');
    
    const auraSystem = new AuraSystem();
    
    // Test 1: Check aura files exist
    console.log('\n=== Testing Aura File Existence ===');
    const auras = auraSystem.getAllAuras();
    
    for (const aura of auras) {
      try {
        if (fs.existsSync(aura.file)) {
          console.log(`✅ ${aura.name}: File exists at ${aura.file}`);
        } else {
          console.log(`❌ ${aura.name}: File missing at ${aura.file}`);
        }
      } catch (error) {
        console.log(`❌ ${aura.name}: Error checking file - ${error.message}`);
      }
    }
    
    // Test 2: Try to apply aura to a test buffer
    console.log('\n=== Testing Aura Application ===');
    try {
      // Create a simple test buffer (placeholder card)
      const { createCanvas } = require('canvas');
      const testCanvas = createCanvas(400, 600);
      const testCtx = testCanvas.getContext('2d');
      testCtx.fillStyle = '#ff0000';
      testCtx.fillRect(0, 0, 400, 600);
      const testBuffer = testCanvas.toBuffer();
      
      console.log('Created test card buffer');
      
      // Try applying each aura
      for (const aura of auras) {
        try {
          const result = await auraSystem.applyAura(testBuffer, aura.id);
          if (result && result.length > 0) {
            console.log(`✅ ${aura.name}: Aura applied successfully`);
          } else {
            console.log(`❌ ${aura.name}: Aura application failed (empty result)`);
          }
        } catch (error) {
          console.log(`❌ ${aura.name}: Aura application error - ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Canvas test failed: ${error.message}`);
    }
    
    console.log('\n=== Aura System Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAuraSystem();