// Simple test script to manually trigger the scheduler
const { runSchedulerManually } = require('./dist/services/schedulerService');

async function test() {
  console.log('🧪 Testing scheduler manually...');
  try {
    await runSchedulerManually();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  process.exit(0);
}

test();
