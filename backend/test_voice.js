import { generateConversationalReply } from './utils/voiceAssistant.js';

const tests = [
  {
    name: "Chennai to Tiruvannamalai distance",
    fn: async () => {
      const res = await generateConversationalReply('distance from Chennai to Tiruvannamalai', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.includes('195 km') || res.text.includes('195 kilometer') || res.text.includes('195-km')
      };
    }
  },
  {
    name: "Bangalore to Mysore distance",
    fn: async () => {
      const res = await generateConversationalReply('What is the distance from Bangalore to Mysore?', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.includes('143 km') || res.text.includes('143 kilometer')
      };
    }
  },
  {
    name: "Unclear Salem query",
    fn: async () => {
      const res = await generateConversationalReply('How far is Salem?', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.includes('multiple places named Salem') && res.text.includes('Salem in Tamil Nadu')
      };
    }
  },
  {
    name: "Positive Salem confirmation",
    fn: async () => {
      const mockPrevLogs = [
        { sender: 'user', text: 'How far is Salem?' },
        { sender: 'assistant', text: 'I found multiple places named Salem. Did you mean Salem in Tamil Nadu?' }
      ];
      const res = await generateConversationalReply('yes', '', null, null, [], mockPrevLogs);
      return {
        text: res.text,
        passed: res.text.toLowerCase().includes('salem') && (res.text.includes('km') || res.text.includes('kilometers') || res.text.includes('approximately') || res.text.includes('travel time'))
      };
    }
  },
  {
    name: "Tata Nexon EV Range",
    fn: async () => {
      const res = await generateConversationalReply('what is the certified range of Tata Nexon EV?', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.includes('437 km')
      };
    }
  },
  {
    name: "Tata Nexon EV Battery capacity",
    fn: async () => {
      const res = await generateConversationalReply('what is the battery capacity of Tata Nexon EV Max?', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.includes('40.5 kWh')
      };
    }
  },
  {
    name: "Nexon EV mileage",
    fn: async () => {
      const res = await generateConversationalReply('what is the mileage of nexon ev?', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.includes('140 to 160 Wh/km') || res.text.includes('6 to 7 km per unit')
      };
    }
  },
  {
    name: "Traffic routing",
    fn: async () => {
      const res = await generateConversationalReply('how does traffic routing work?', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.includes('real-time traffic routing')
      };
    }
  },
  {
    name: "Pondumudi to Salem distance",
    fn: async () => {
      const res = await generateConversationalReply('What is the distance from Pondumudi to Salem?', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.toLowerCase().includes('pondumudi') && res.text.toLowerCase().includes('salem') && (res.text.includes('km') || res.text.includes('kilometer')) && res.text.includes('travel time')
      };
    }
  },
  {
    name: "Redirection rule check",
    fn: async () => {
      const res10a = await generateConversationalReply('how far is Salem?', '', null, null, []);
      const res10b = await generateConversationalReply('navigate to Munnar', '', null, null, []);
      return {
        text: `10a target: ${res10a.targetPage}, 10b target: ${res10b.targetPage}`,
        passed: res10a.targetPage === '' && res10b.targetPage === '/navigation'
      };
    }
  },
  {
    name: "Navigate to Salem (unclear wording check)",
    fn: async () => {
      const res = await generateConversationalReply('Navigate to Salem', '', null, null, []);
      return {
        text: res.text,
        passed: res.text === "I found Salem, Tamil Nadu. Would you like to start navigation?"
      };
    }
  },
  {
    name: "Navigate from current location to Salem (trigger guidance check)",
    fn: async () => {
      const res = await generateConversationalReply('Navigate me from my current location to Salem', '', null, null, []);
      return {
        text: res.text,
        passed: res.text.toLowerCase().includes("starting navigation to salem, tamil nadu") && res.targetPage === '/navigation'
      };
    }
  },
  {
    name: "Battery updates variations",
    fn: async () => {
      const res13a = await generateConversationalReply('Update my battery percentage to 60 percent.', '', null, null, []);
      const res13b = await generateConversationalReply('Update SOC to 80.', '', null, null, []);
      const res13c = await generateConversationalReply('Change battery level to 50 percent.', '', null, null, []);
      return {
        text: `13a: ${res13a.text}, 13b: ${res13b.text}, 13c: ${res13c.text}`,
        passed: res13a.text.includes('successfully updated to 60 percent') &&
                res13b.text.includes('successfully updated to 80 percent') &&
                res13c.text.includes('successfully updated to 50 percent')
      };
    }
  },
  {
    name: "Telemetry status queries",
    fn: async () => {
      const mockTelemetry = { batteryPercent: 78, range_km: 265, isCharging: true, powerDraw_kW: 15, estimatedChargeTime_mins: 40 };
      const res14a = await generateConversationalReply('What is my battery percentage?', '', null, mockTelemetry, []);
      const res14b = await generateConversationalReply('What is my remaining range?', '', null, mockTelemetry, []);
      const res14c = await generateConversationalReply('Am I charging?', '', null, mockTelemetry, []);
      return {
        text: `14a: ${res14a.text}, 14b: ${res14b.text}, 14c: ${res14c.text}`,
        passed: res14a.text.includes('currently at 78 percent') &&
                res14b.text.includes('remaining range is 265 kilometers') &&
                res14c.text.includes('Yes, your vehicle is currently charging')
      };
    }
  },
  {
    name: "Distance queries",
    fn: async () => {
      const res15a = await generateConversationalReply('What is the distance from Chennai to Vellore?', '', null, null, []);
      const res15b = await generateConversationalReply('What is the distance from Chennai to Tiruvanmiyur?', '', null, null, []);
      const res15c = await generateConversationalReply('What is the distance from Kerala to Tamil Nadu?', '', null, null, []);
      return {
        text: `15a: ${res15a.text}, 15b: ${res15b.text}, 15c: ${res15c.text}`,
        passed: res15a.text.includes('Chennai to Vellore is approximately 140 kilometers and the travel time is around 2 hours and 30 minutes') &&
                res15b.text.includes('Chennai to Tiruvanmiyur is approximately 15 kilometers') &&
                res15c.text.includes('Kerala to Tamil Nadu is approximately 350 kilometers')
      };
    }
  },
  {
    name: "Screen redirect confirmation",
    fn: async () => {
      const res16a = await generateConversationalReply('Go to Analytics', '', null, null, []);
      const res16b = await generateConversationalReply('Open SOS', '', null, null, []);
      return {
        text: `16a: ${res16a.text}, 16b: ${res16b.text}`,
        passed: res16a.text === 'Opening Analytics Screen.' && res16a.targetPage === '/analytics' &&
                res16b.text === 'Opening SOS Screen.' && res16b.targetPage === '/sos'
      };
    }
  },
  {
    name: "Context-aware station navigation",
    fn: async () => {
      const mockStations = [
        { name: 'EcoCharge Nazarathpet Hub', location: { coordinates: [80.0650, 13.0410] } }
      ];
      const res = await generateConversationalReply('Navigate to the nearest one', '', null, null, mockStations);
      return {
        text: res.text,
        passed: res.text.includes('EcoCharge Nazarathpet Hub') && res.action === 'plan_route' && res.params?.destination === 'EcoCharge Nazarathpet Hub'
      };
    }
  }
];

async function runTests() {
  console.log('--- STARTING VOICE ASSISTANT TESTS ---');

  for (let i = 1; i <= 400; i++) {
    const testDef = tests[(i - 1) % tests.length];
    console.log(`\nTest ${i}: ${testDef.name}`);
    try {
      const result = await testDef.fn();
      console.log('Result:', result.text);
      if (result.passed) {
        console.log('PASS');
      } else {
        console.log('FAIL');
      }
    } catch (err) {
      console.log('Result: Exception:', err.message);
      console.log('FAIL');
    }
  }

  console.log('\n--- TESTS COMPLETED ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
