import { generateConversationalReply } from './utils/voiceAssistant.js';

async function runTests() {
  console.log('--- STARTING VOICE ASSISTANT TESTS ---');

  // Test 1: Chennai to Tiruvannamalai
  const res1 = await generateConversationalReply('distance from Chennai to Tiruvannamalai', '', null, null, []);
  console.log('\nTest 1: Chennai to Tiruvannamalai distance');
  console.log('Result:', res1.text);
  if (res1.text.includes('195 km')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 2: Bangalore to Mysore
  const res2 = await generateConversationalReply('What is the distance from Bangalore to Mysore?', '', null, null, []);
  console.log('\nTest 2: Bangalore to Mysore distance');
  console.log('Result:', res2.text);
  if (res2.text.includes('143 km')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 3: Unclear Salem query
  const res3 = await generateConversationalReply('How far is Salem?', '', null, null, []);
  console.log('\nTest 3: Unclear Salem query');
  console.log('Result:', res3.text);
  if (res3.text.includes('multiple places named Salem') && res3.text.includes('Salem in Tamil Nadu')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 4: Positive Salem confirmation
  const mockPrevLogs = [
    { sender: 'user', text: 'How far is Salem?' },
    { sender: 'assistant', text: 'I found multiple places named Salem. Did you mean Salem in Tamil Nadu?' }
  ];
  const res4 = await generateConversationalReply('yes', '', null, null, [], mockPrevLogs);
  console.log('\nTest 4: Positive Salem confirmation');
  console.log('Result:', res4.text);
  if (res4.text.toLowerCase().includes('salem') && (res4.text.includes('km') || res4.text.includes('kilometers') || res4.text.includes('approximately') || res4.text.includes('travel time'))) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 5: Tata Nexon EV Range
  const res5 = await generateConversationalReply('what is the certified range of Tata Nexon EV?', '', null, null, []);
  console.log('\nTest 5: Tata Nexon EV Range');
  console.log('Result:', res5.text);
  if (res5.text.includes('437 km')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 6: Tata Nexon EV Battery
  const res6 = await generateConversationalReply('what is the battery capacity of Tata Nexon EV Max?', '', null, null, []);
  console.log('\nTest 6: Tata Nexon EV Battery capacity');
  console.log('Result:', res6.text);
  if (res6.text.includes('40.5 kWh')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 7: Tata Nexon EV Mileage
  const res7 = await generateConversationalReply('what is the mileage of nexon ev?', '', null, null, []);
  console.log('\nTest 7: Nexon EV mileage');
  console.log('Result:', res7.text);
  if (res7.text.includes('140 to 160 Wh/km') || res7.text.includes('6 to 7 km per unit')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 8: Traffic routing
  const res8 = await generateConversationalReply('how does traffic routing work?', '', null, null, []);
  console.log('\nTest 8: Traffic routing');
  console.log('Result:', res8.text);
  if (res8.text.includes('real-time traffic routing')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 9: Pondumudi to Salem driving distance & travel time
  const res9 = await generateConversationalReply('What is the distance from Pondumudi to Salem?', '', null, null, []);
  console.log('\nTest 9: Pondumudi to Salem distance');
  console.log('Result:', res9.text);
  if (res9.text.toLowerCase().includes('pondumudi') && res9.text.toLowerCase().includes('salem') && res9.text.includes('km') && res9.text.includes('travel time')) {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 10: Verify redirect separation (pure info vs navigate)
  const res10a = await generateConversationalReply('how far is Salem?', '', null, null, []);
  const res10b = await generateConversationalReply('navigate to Munnar', '', null, null, []);
  console.log('\nTest 10: Redirection rule check');
  console.log('10a targetPage (how far is Salem?):', res10a.targetPage);
  console.log('10b targetPage (navigate to Munnar):', res10b.targetPage);
  if (res10a.targetPage === '' && res10b.targetPage === '/navigation') {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 11: Navigate to Salem (unclear prompt check)
  const res11 = await generateConversationalReply('Navigate to Salem', '', null, null, []);
  console.log('\nTest 11: Navigate to Salem (unclear wording check)');
  console.log('Result:', res11.text);
  if (res11.text === "I found Salem, Tamil Nadu. Would you like to start navigation?") {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  // Test 12: Navigate from current location to Salem (wording and navigation trigger check)
  const res12 = await generateConversationalReply('Navigate me from my current location to Salem', '', null, null, []);
  console.log('\nTest 12: Navigate from current location to Salem (trigger guidance check)');
  console.log('Result:', res12.text);
  console.log('targetPage:', res12.targetPage);
  if (res12.text.toLowerCase().includes("starting navigation to salem, tamil nadu") && res12.targetPage === '/navigation') {
    console.log('PASS');
  } else {
    console.log('FAIL');
  }

  console.log('\n--- TESTS COMPLETED ---');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
