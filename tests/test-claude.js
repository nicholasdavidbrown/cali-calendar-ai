const API_BASE = "http://localhost:8080";

async function testClaudeIntegration() {
  console.log("🧪 Testing Claude AI Integration (Phase 6)\n");

  try {
    // Step 1: Login as admin
    console.log("1️⃣  Logging in as admin...");
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123",
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("✅ Logged in successfully\n");

    // Step 2: Update user settings to test different personalities
    const personalities = [
      "professional",
      "witty",
      "sarcastic",
      "mission",
      "irwin",
      "tanda",
    ];

    for (const personality of personalities) {
      console.log(`\n2️⃣  Testing ${personality} personality...`);

      // Update message style
      const updateRes = await fetch(`${API_BASE}/api/users/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageStyle: personality,
        }),
      });

      if (!updateRes.ok) {
        console.log(
          `❌ Failed to update settings: ${updateRes.status}`
        );
        continue;
      }

      const updateData = await updateRes.json();
      console.log(`✅ Updated messageStyle to: ${updateData.messageStyle}`);

      // Send daily summary (will use Claude with this personality)
      console.log(`📤 Sending daily summary with ${personality} style...`);
      const summaryRes = await fetch(
        `${API_BASE}/api/sms/send-daily-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!summaryRes.ok) {
        const errorData = await summaryRes.json();
        console.log(`⚠️  SMS send result: ${JSON.stringify(errorData)}`);
        console.log(
          `   (This is expected if Twilio/phone not configured)`
        );
      } else {
        const summaryData = await summaryRes.json();
        console.log(`✅ Daily summary sent!`);
        console.log(`   Event count: ${summaryData.eventCount}`);
        console.log(`   SID: ${summaryData.sid}`);
      }
    }

    // Step 3: Check SMS history
    console.log("\n\n3️⃣  Checking SMS history...");
    const historyRes = await fetch(`${API_BASE}/api/sms/history?limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!historyRes.ok) {
      throw new Error(`Failed to fetch history: ${historyRes.status}`);
    }

    const history = await historyRes.json();
    console.log(`✅ SMS History (${history.length} messages):\n`);

    history.forEach((sms, index) => {
      console.log(`Message ${index + 1}:`);
      console.log(`  Style: ${sms.messageStyle}`);
      console.log(`  Status: ${sms.status}`);
      console.log(`  Events: ${sms.eventCount}`);
      console.log(`  Sent: ${new Date(sms.sentAt).toLocaleString()}`);
      console.log(`  Preview: ${sms.message.substring(0, 100)}...`);
      console.log("");
    });

    console.log("\n✅ Phase 6 Testing Complete!");
    console.log("\nKey Observations:");
    console.log(
      "- All 6 personality styles should generate different message tones"
    );
    console.log(
      "- If Anthropic API key is not configured, fallback messages are used"
    );
    console.log(
      "- If Twilio is not configured, SMS sending will fail (expected)"
    );
    console.log(
      "- Message history shows all generated messages regardless of send status"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testClaudeIntegration().catch((err) =>
  console.error("❌ Test failed:", err.message)
);
