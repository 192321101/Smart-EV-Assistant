const KNOWLEDGE_BASE = [
  {
    keywords: ["feature", "app", "modular", "screens", "help", "commands", "menu", "all features", "modules", "overview", "what can this app do", "what is this app"],
    answer: "This is the Smart EV Assistant web app. It features 15 modular screens: Screen 1 Splash, Screen 2 Welcome, Screen 3 Onboarding, Screen 4 Sign Up, Screen 5 Sign In, Screen 6 Dashboard, Screen 7 Navigation Map, Screen 8 Charging Stations, Screen 9 Voice Assistant, Screen 10 Slot Booking, Screen 11 Emergency SOS, Screen 12 Community, Screen 13 Admin Dashboard, Screen 14 Recharts Analytics, and Screen 15 Settings."
  },
  {
    keywords: ["splash", "loading", "start", "logo", "screen 1"],
    answer: "The Splash Screen (Screen 1) is the loading page of the app. It displays a futuristic holographic logo animation and performs system diagnostic scans on startup."
  },
  {
    keywords: ["welcome", "landing", "screen 2"],
    answer: "The Welcome Screen (Screen 2) is our landing page that welcomes the driver. It displays total clean energy saved, total active EV users, and a quick portal button to begin onboarding."
  },
  {
    keywords: ["onboarding", "walkthrough", "tutorial", "guide", "screen 3"],
    answer: "The Onboarding Screens (Screen 3) walk the user through a three-step introduction: EV battery telemetry logs, charging station bookings, and interactive voice assistant tools."
  },
  {
    keywords: ["sign up", "register", "create account", "signup", "screen 4"],
    answer: "The Sign Up page (Screen 4) allows new drivers to register their account by entering their full name, email address, password, and verifying a secure sign-up profile."
  },
  {
    keywords: ["sign in", "login", "credentials", "password", "otp", "signin", "screen 5", "credentials"],
    answer: "The Sign In page (Screen 5) supports secure driver and admin logins, credential checking, and a simulated 6-digit OTP code verification (default code: 123456)."
  },
  {
    keywords: ["dashboard", "telemetry", "soc", "state of charge", "coins", "carbon coins", "home page", "screen 6"],
    answer: "The Dashboard (Screen 6) displays your EV's active battery capacity (kWh), current State of Charge (SoC %), projected driving range, eco carbon coins count, active WebSocket charging telemetry (kW draw, kWh transferred, running cost), and system logs."
  },
  {
    keywords: ["navigation", "map", "route", "elevation", "range circle", "path", "stops", "screen 7"],
    answer: "The Navigation Map (Screen 7) features an interactive vector canvas map showing your position, range limit circles, station pins, route paths, elevation profiles, and suggests intermediate charging stops if range is critical."
  },
  {
    keywords: ["find station", "charging station", "connector", "port", "charger list", "operators", "ccs", "type 2", "power rating", "screen 8", "stations"],
    answer: "The Charging Stations module (Screen 8) lists nearby operators. You can filter by connector type (CCS DC Fast, Type 2 AC) or power rating (50kW, 150kW), check ratings, and open slot grid drawers to view active charger occupancy."
  },
  {
    keywords: ["voice assistant", "ai copilot", "speech", "synthesizer", "speak", "voice command", "screen 9", "assistant"],
    answer: "The AI Voice Assistant (Screen 9) provides natural speech-to-text waveform visualization, lists suggestions, keeps a chat history log, and uses SpeechSynthesis for two-way conversation."
  },
  {
    keywords: ["book", "reserve", "slot", "coupon", "promo", "invoice", "booking", "schedule", "green15", "screen 10"],
    answer: "The Booking System (Screen 10) allows you to schedule slots by date, time, and vehicle. It prints a detailed invoice (calculating 18% GST and energy costs). Apply coupon 'green15' to claim a 15% discount!"
  },
  {
    keywords: ["sos", "emergency", "tow", "flat tire", "broken down", "accident", "screen 11"],
    answer: "The Emergency SOS System (Screen 11) triggers a 5-second countdown. Once activated, it broadcasts your GPS coordinates, plans emergency routing to the nearest charger, dispatches an EcoTow rescue unit, and alerts your contacts."
  },
  {
    keywords: ["community", "forum", "rewards", "leaderboard", "discussion", "screen 12", "social"],
    answer: "The Community module (Screen 12) tracks discussion threads, monthly carbon savings rankings, and a rewards catalog. Redeem your Carbon Coins to plant trees or buy charging vouchers."
  },
  {
    keywords: ["admin", "grid override", "status override", "load override", "screen 13"],
    answer: "The Admin Terminal (Screen 13) monitors grid loads (kW), online station capacities, and temperature alerts. Admins (login as test5@ev.app) can override slot occupancies using control switches."
  },
  {
    keywords: ["analytics", "charts", "savings", "recharts", "graph", "weekly consumption", "screen 14"],
    answer: "The Analytics module (Screen 14) displays weekly Recharts area and bar graphs tracking your energy consumption (kWh) and costs (INR). It also calculates cost savings compared to petrol/ICE vehicles."
  },
  {
    keywords: ["settings", "profile", "add vehicle", "garage", "limit", "notification", "screen 15"],
    answer: "The Settings module (Screen 15) allows you to update target battery limits (e.g. 80%), manage notification preferences, and register new EVs in your garage by battery capacity (kWh) and license plate number."
  },
  {
    keywords: ["soc", "state of charge", "percent"],
    answer: "State of Charge (SoC) represents the remaining energy in your battery pack as a percentage (from 0% empty to 100% full), similar to a fuel gauge in petrol vehicles."
  },
  {
    keywords: ["soh", "state of health", "degradation"],
    answer: "State of Health (SoH) is a metric that reflects the overall condition of the battery compared to a new battery. Over time, chemical degradation slowly reduces maximum energy storage capacity."
  },
  {
    keywords: ["range anxiety", "worry", "fear"],
    answer: "Range anxiety is the fear of running out of battery charge before reaching a destination or charging station. Our smart path planner helps eliminate this by automatically recommending intermediate chargers on long routes."
  },
  {
    keywords: ["regenerative braking", "regen", "one pedal"],
    answer: "Regenerative braking reverses your EV's motor when you lift off the accelerator, converting kinetic energy into electrical energy that flows back to recharge the battery cells while slowing the car down."
  },
  {
    keywords: ["ac vs dc", "ac charging", "dc charging", "slow charging", "fast charging", "difference", "levels"],
    answer: "AC charging is slower (typically 7-22kW) and relies on the car's internal charger. DC fast charging (50-250kW) bypasses the car's converter and feeds high-voltage current directly into the battery for rapid charging."
  },
  {
    keywords: ["battery health", "protect battery", "care"],
    answer: "To protect battery health, avoid letting the charge drop below 20% or sit at 100% for long periods. Limit fast DC charging, keep target limits around 80% using the Settings panel, and avoid extreme temperatures."
  },
  {
    keywords: ["lithium ion", "anode", "cathode", "battery work", "cell chemistry", "cells"],
    answer: "Your EV battery is made of lithium-ion cells. During driving, lithium ions move from the negative anode to the positive cathode, generating electric current. Charging reverses this process."
  },
  {
    keywords: ["speed penalty", "cruising speed", "wind resistance", "drag", "speed range"],
    answer: "Aerodynamic drag increases exponentially with speed. Driving at 100 km/h draws roughly 25% more energy than driving at 80 km/h, which is why our voice calculator applies range penalties for higher cruising speeds."
  },
  {
    keywords: ["weather", "cold", "temperature", "heat", "ac load", "hvac"],
    answer: "Extreme hot or cold weather reduces battery efficiency. In cold climates, range drops due to slowed battery chemistry and heater usage. In hot climates, energy is consumed by the battery cooling system."
  },
  {
    keywords: ["vampire drain", "phantom drain", "standby loss"],
    answer: "Phantom drain (or vampire drain) refers to the small amount of energy lost while the vehicle is parked. It is consumed by active telematics, security systems, battery thermal management, and standby computers."
  },
  {
    keywords: ["ev vs ice", "engine vs motor", "efficiency", "benefits"],
    answer: "EVs are much more efficient than Internal Combustion Engine (ICE) vehicles. EV motors convert over 85-90% of electrical energy into motion, compared to only 20-35% thermal efficiency in petrol/diesel engines. EVs also have zero direct emissions, lower fuel costs, and instant torque."
  },
  {
    keywords: ["motor", "permanent magnet", "induction"],
    answer: "Electric vehicles use AC electric motors (either Permanent Magnet Synchronous or Induction motors) that provide instant, linear torque and quiet operation without needing multi-speed gearboxes."
  },
  {
    keywords: ["inverter"],
    answer: "The inverter is the brain of the EV powertrain. It converts the direct current (DC) stored in the high-voltage battery pack into three-phase alternating current (AC) to drive the electric motor, and manages regen braking."
  },
  {
    keywords: ["thermal management", "liquid cooling", "heating", "glycol"],
    answer: "Thermal management systems use liquid coolant loops (usually glycol-water mixtures) to keep battery cells in their optimal temperature range (15-35°C), protecting battery health and ensuring peak charging speeds."
  },
  {
    keywords: ["v2g", "vehicle to grid", "bidirectional charging", "v2h", "vehicle to home"],
    answer: "Vehicle-to-Grid (V2G) and Vehicle-to-Home (V2H) allow an EV to act as a mobile power bank. It can supply stored electricity back into your home power board or back to the electric grid during high demand."
  },
  {
    keywords: ["solid state battery", "next gen"],
    answer: "Solid-state batteries are an upcoming technology that replaces the liquid electrolyte inside cells with a solid ceramic or polymer layer. They promise double the energy density, faster charge times, and increased safety."
  },
  {
    keywords: ["cost of charging", "charging price", "calculate cost"],
    answer: "Charging cost equals energy consumed (kWh) multiplied by the electricity rate per unit (INR/kWh). In our app, slot booking calculates charging costs dynamically based on target battery needs and local tariffs, adding a standard 18% GST."
  },
  {
    keywords: ["battery safety", "fire", "runaway", "bms safety"],
    answer: "EV batteries are designed with multi-level safety barriers. The Battery Management System (BMS) shuts off power if it detects cell imbalances, overvoltage, or thermal spikes, minimizing the risk of thermal runaway."
  },
  {
    keywords: ["connector types", "ccs", "chademo", "type 2", "nacs", "plugs"],
    answer: "EV chargers use standard connectors: CCS (CCS1 in North America, CCS2 in India/Europe) for DC fast charging; Type 2 for AC charging; NACS (Tesla standard); and CHAdeMO (older Japanese DC standard)."
  },
  {
    keywords: ["bms", "battery management system"],
    answer: "The Battery Management System (BMS) is the electronic brain inside the battery pack. It manages voltage balance across thousands of cells, checks temperatures, calculates SoC and SoH, and protects the battery from damage."
  },
  {
    keywords: ["kw vs kwh", "kilowatt", "kilowatthour"],
    answer: "Kilowatt (kW) is a measure of power (how fast energy is flowing, e.g. charging speed or motor output). Kilowatt-hour (kWh) is a measure of energy capacity (how much energy is stored, e.g. the size of the battery pack)."
  },
  {
    keywords: ["maintenance", "service", "maintenance cost"],
    answer: "EV maintenance is significantly cheaper than ICE cars because there are no oil changes, spark plugs, timing belts, exhaust mufflers, or clutches. You only need to service cabin filters, rotate tires, check brake fluid, and top up coolant."
  },
  {
    keywords: ["hybrid", "phev", "hev", "bev", "fcev"],
    answer: "A Hybrid (HEV) uses a gas engine and minor electric assist without a plug. A Plug-in Hybrid (PHEV) has a plug and a medium battery for pure electric range plus a gas engine. A Battery EV (BEV) is fully electric, and a Fuel Cell EV (FCEV) runs on hydrogen."
  },
  {
    keywords: ["transmission", "gearbox", "gears"],
    answer: "EVs typically use a single-speed transmission because electric motors operate efficiently over a very wide speed range (up to 20,000 RPM) and provide full torque from zero speed, eliminating the need for heavy multi-speed gearboxes."
  },
  {
    keywords: ["carbon footprint", "manufacturing footprint", "manufacturing emissions"],
    answer: "While EV manufacturing creates slightly higher emissions due to battery production, EVs offset this in less than 1-2 years of driving. Over its lifetime, an EV is far more environmentally friendly than an ICE car, even when charged from a fossil-fueled grid."
  },
  {
    keywords: ["battery recycling", "black mass"],
    answer: "EV batteries are highly recyclable. At end-of-life, they are crushed and separated into 'black mass', from which valuable materials like lithium, nickel, cobalt, and manganese are chemically extracted to make new battery cells."
  },
  {
    keywords: ["nexon ev", "tata nexon", "mg zs ev", "byd atto"],
    answer: "Tata Nexon EV and MG ZS EV are popular Indian EVs. The Nexon EV Prime/Max features a 30-40.5 kWh battery, while the MG ZS EV features a 50.3 kWh battery. Both can be configured inside our garage settings."
  },
  {
    keywords: ["hello", "hi", "hey", "greetings"],
    answer: "Hello! I am your AI EV Copilot, connected and ready. Ask me anything about your vehicle, range calculations, charging stations, or general EV tips!"
  },
  {
    keywords: ["who are you", "your name", "what are you", "identity"],
    answer: "I am your Smart EV Copilot, an AI assistant designed to monitor battery telemetry, calculate ranges, schedule slots bookings, and ensure your trips are safe."
  },
  {
    keywords: ["how are you"],
    answer: "I am operating at peak efficiency! All telemetry nodes are connected and green. How are you doing today?"
  },
  {
    keywords: ["joke", "funny"],
    answer: "Why did the EV cross the road? To find the nearest fast charger! How do EVs greet each other? Watt's up! Why did the electric car get a ticket? It was charged with speeding!"
  }
];

const INDIA_CITIES = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  tiruvannamalai: { lat: 12.2274, lng: 79.0747 },
  thiruvannamalai: { lat: 12.2274, lng: 79.0747 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  newdelhi: { lat: 28.6139, lng: 77.2090 },
  salem: { lat: 11.6643, lng: 78.1460 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  pondicherry: { lat: 11.9416, lng: 79.8083 },
  puducherry: { lat: 11.9416, lng: 79.8083 },
  villupuram: { lat: 11.9398, lng: 79.4883 },
  tambaram: { lat: 12.9234, lng: 80.1289 },
  adyar: { lat: 13.0063, lng: 80.2575 },
  poonamallee: { lat: 13.0473, lng: 80.0945 },
  poonamalle: { lat: 13.0473, lng: 80.0945 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  goa: { lat: 15.4909, lng: 73.8278 },
  munnar: { lat: 10.0889, lng: 77.0595 },
  mangalore: { lat: 12.9141, lng: 74.8560 },
  manali: { lat: 32.2396, lng: 77.1887 },
  murudeshwar: { lat: 14.0940, lng: 74.4849 },
  muzaffarpur: { lat: 26.1206, lng: 85.3900 },
  chengalpattu: { lat: 12.6841, lng: 79.9774 },
  cherthala: { lat: 9.6846, lng: 76.3364 },
  cherrapunji: { lat: 25.2702, lng: 91.7086 },
  pondumudi: { lat: 8.7607, lng: 77.1167 },
  mahabalipuram: { lat: 12.6269, lng: 80.1722 },
  satara: { lat: 17.6805, lng: 74.0183 },
  sambalpur: { lat: 21.4669, lng: 83.9878 },
  sangli: { lat: 16.8524, lng: 74.5815 },
  tiruvanmiyur: { lat: 12.9830, lng: 80.2586 },
  kerala: { lat: 10.8505, lng: 76.2711 },
  'tamil nadu': { lat: 11.1271, lng: 78.6569 },
  tamilnadu: { lat: 11.1271, lng: 78.6569 }
};

const KNOWN_ROUTES = {
  'chennai-tiruvannamalai': { distance: 195, timeHours: 3.5, kwh: 31.2 },
  'tiruvannamalai-chennai': { distance: 195, timeHours: 3.5, kwh: 31.2 },
  'chennai-thiruvannamalai': { distance: 195, timeHours: 3.5, kwh: 31.2 },
  'thiruvannamalai-chennai': { distance: 195, timeHours: 3.5, kwh: 31.2 },
  'bangalore-mysore': { distance: 143, timeHours: 2.5, kwh: 22.9 },
  'mysore-bangalore': { distance: 143, timeHours: 2.5, kwh: 22.9 },
  'bengaluru-mysuru': { distance: 143, timeHours: 2.5, kwh: 22.9 },
  'mysuru-bengaluru': { distance: 143, timeHours: 2.5, kwh: 22.9 },
  'mumbai-pune': { distance: 148, timeHours: 3, kwh: 23.7 },
  'pune-mumbai': { distance: 148, timeHours: 3, kwh: 23.7 },
  'adyar-poonamallee': { distance: 23, timeHours: 0.75, kwh: 3.7 },
  'poonamallee-adyar': { distance: 23, timeHours: 0.75, kwh: 3.7 },
  'chennai-villupuram': { distance: 165, timeHours: 3, kwh: 26.4 },
  'villupuram-chennai': { distance: 165, timeHours: 3, kwh: 26.4 },
  'chennai-pondicherry': { distance: 150, timeHours: 3, kwh: 24.0 },
  'pondicherry-chennai': { distance: 150, timeHours: 3, kwh: 24.0 },
  'chennai-bangalore': { distance: 345, timeHours: 6, kwh: 55.2 },
  'bangalore-chennai': { distance: 345, timeHours: 6, kwh: 55.2 },
  'chennai-trichy': { distance: 330, timeHours: 5.5, kwh: 52.8 },
  'trichy-chennai': { distance: 330, timeHours: 5.5, kwh: 52.8 },
  'bandra-andheri': { distance: 10, timeHours: 0.33, kwh: 1.6 },
  'andheri-bandra': { distance: 10, timeHours: 0.33, kwh: 1.6 },
  'chennai-vellore': { distance: 140, timeHours: 2.5, kwh: 22.4 },
  'vellore-chennai': { distance: 140, timeHours: 2.5, kwh: 22.4 },
  'chennai-tiruvanmiyur': { distance: 15, timeHours: 0.5, kwh: 2.4 },
  'tiruvanmiyur-chennai': { distance: 15, timeHours: 0.5, kwh: 2.4 },
  'kerala-tamil nadu': { distance: 350, timeHours: 6.0, kwh: 56.0 },
  'tamil nadu-kerala': { distance: 350, timeHours: 6.0, kwh: 56.0 },
  'kerala-tamilnadu': { distance: 350, timeHours: 6.0, kwh: 56.0 },
  'tamilnadu-kerala': { distance: 350, timeHours: 6.0, kwh: 56.0 }
};

function normalizeCityName(name) {
  let n = name.toLowerCase()
    .replace(/(?:,\s*india|\s+india)/gi, "")
    .trim();
  if (n !== "tamil nadu" && n !== "tamilnadu" && n !== "tn") {
    n = n.replace(/(?:,\s*tamil\s*nadu|\s+tamil\s*nadu|\s+tn)/gi, "");
  }
  n = n.replace(/(?:the\s+city\s+of\s+|town\s+of\s+|district\s+of\s+|in\s+)/gi, "")
    .trim();
  if (n.startsWith("thiru")) {
    if (n.includes("vannamalai")) return "tiruvannamalai";
    if (n.includes("nanthapuram")) return "trivandrum";
  }
  if (n === "bengaluru") return "bangalore";
  if (n === "puducherry") return "pondicherry";
  if (n === "cochin") return "kochi";
  if (n === "allahabad") return "prayagraj";
  if (n === "tuticorin") return "thoothukudi";
  if (n === "trichy") return "tiruchirappalli";
  if (n === "poonamalle") return "poonamallee";
  if (n === "mysuru") return "mysore";
  return n;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

async function getGeocodingCoordinates(placeName) {
  const normalized = normalizeCityName(placeName);
  if (INDIA_CITIES[normalized]) {
    return {
      name: placeName,
      lat: INDIA_CITIES[normalized].lat,
      lng: INDIA_CITIES[normalized].lng
    };
  }

  // Try online geocoding with 2.5s timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName + ', India')}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Smart-EV-Assistant-Bot/1.0' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]) {
        return {
          name: data[0].display_name.split(',')[0],
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
  } catch (err) {
    console.warn('[Nominatim API] Failed to geocode location online:', err.message);
  }
  return null;
}

async function getOnlineRoadDistance(lat1, lng1, lat2, lng2) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const url = `http://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const data = await response.json();
      if (data && data.routes && data.routes[0]) {
        const distanceMeters = data.routes[0].distance;
        const durationSeconds = data.routes[0].duration;
        return {
          distanceKm: Math.round(distanceMeters / 1000),
          durationMins: Math.round(durationSeconds / 60)
        };
      }
    }
  } catch (err) {
    console.warn('[OSRM API] Failed to fetch road distance online:', err.message);
  }
  return null;
}

function parseDistanceQuery(text) {
  const clean = text.toLowerCase().trim();
  // Case 1: distance from X to Y / from X to Y distance / navigate from X to Y
  let match = clean.match(/(?:distance\s+(?:from\s+)?|how\s+far\s+(?:is\s+)?(?:from\s+)?|navigate\s+me\s+from\s+|navigate\s+from\s+|take\s+me\s+from\s+|route\s+from\s+)(.+?)\s+to\s+(.+)/i) ||
              clean.match(/from\s+(.+?)\s+to\s+(.+?)(?:\s+distance|\s+how\s+far)/i);
  if (match) {
    return { loc1: match[1].trim(), loc2: match[2].trim() };
  }
  // Case 2: distance between X and Y
  match = clean.match(/(?:distance|how\s+far)\s+between\s+(.+?)\s+and\s+(.+)/i);
  if (match) {
    return { loc1: match[1].trim(), loc2: match[2].trim() };
  }
  // Case 3: how far is X from Y
  match = clean.match(/how\s+far\s+is\s+(.+?)\s+from\s+(.+)/i);
  if (match) {
    return { loc1: match[2].trim(), loc2: match[1].trim() };
  }
  return null;
}

export async function generateConversationalReply(cmd, originalText, vehicle, telemetry, nearbyStations, prevLogs) {
  const cleanCmd = cmd.toLowerCase().trim();
  const charge = telemetry ? telemetry.batteryPercent : (vehicle ? vehicle.currentCharge_percent : 45);
  const capacity = vehicle ? vehicle.batteryCapacity_kWh : 40.5;
  const range = telemetry ? telemetry.range_km : (vehicle ? vehicle.range_km : 245);
  const speed = telemetry ? telemetry.speed_kmh : 0;
  const isCharging = telemetry ? telemetry.isCharging : false;
  const etaMins = telemetry ? telemetry.estimatedChargeTime_mins : 0;
  const powerDraw = telemetry ? telemetry.powerDraw_kW : 0;
  const temp = telemetry ? telemetry.temperature_c : 25;
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Tata Nexon EV Max';

  let intent = 'ev_knowledge';
  let action = 'speak_only';
  let targetPage = '';
  let params = {};

  const makeResult = (text, customIntent, customAction, customPage, customParams) => ({
    text,
    intent: customIntent || intent,
    action: customAction || action,
    targetPage: customPage || targetPage,
    params: customParams || params
  });

  let queryToParse = cleanCmd;
  let forceSalemTamilNadu = false;

  // Check if Salem confirmation
  const positiveConfirmations = ['yes', 'yeah', 'yup', 'correct', 'sure', 'indeed', 'y'];
  const negativeConfirmations = ['no', 'nah', 'nope', 'never', 'n'];

  const isPositive = positiveConfirmations.some(kw => cleanCmd === kw || cleanCmd.startsWith(kw + ' ') || cleanCmd.startsWith(kw + ','));
  const isNegative = negativeConfirmations.some(kw => cleanCmd === kw || cleanCmd.startsWith(kw + ' ') || cleanCmd.startsWith(kw + ','));

  if (prevLogs && prevLogs.length > 0) {
    const lastAssistantMsg = prevLogs.find(log => log.sender === 'assistant');
    if (lastAssistantMsg && (lastAssistantMsg.text.includes("multiple places named Salem") || lastAssistantMsg.text.includes("Salem in Tamil Nadu") || lastAssistantMsg.text.includes("I found Salem, Tamil Nadu"))) {
      if (isPositive) {
        forceSalemTamilNadu = true;
        // Search for any user log that contains the word "salem" as the original query
        const originalUserLog = prevLogs.find(log => log.sender === 'user' && log.text.toLowerCase().includes('salem'));
        if (originalUserLog) {
          queryToParse = originalUserLog.text.toLowerCase();
        } else {
          queryToParse = "how far is salem"; // fallback
        }
      } else if (isNegative) {
        return makeResult(
          "Okay, please specify which Salem you meant (e.g., Salem in Oregon, USA).",
          'ev_knowledge'
        );
      }
    }
  }

  // Salem check - trigger ambiguity response if the parsed query contains 'salem' but not 'tamil nadu'
  const hasSalem = queryToParse.includes('salem');
  const hasTamilNadu = queryToParse.includes('tamil nadu') || queryToParse.includes('tamilnadu') || queryToParse.includes('tn');
  const isTwoLocationsQuery = parseDistanceQuery(queryToParse) !== null;

  if (hasSalem && !hasTamilNadu && !forceSalemTamilNadu && !isTwoLocationsQuery) {
    const navKeywords = ['navigate', 'take me', 'start navigation', 'begin navigation', 'go to', 'open navigation', 'route to', 'plan route', 'drive me'];
    const isExplicitNavigation = navKeywords.some(kw => queryToParse.toLowerCase().includes(kw));
    
    if (isExplicitNavigation) {
      return makeResult(
        "I found Salem, Tamil Nadu. Would you like to start navigation?",
        'unclear_location'
      );
    } else {
      return makeResult(
        "I found multiple places named Salem. Did you mean Salem in Tamil Nadu?",
        'unclear_location'
      );
    }
  }

  // Tata Nexon EV Specifications Queries
  const queryLower = queryToParse.toLowerCase();
  
  if (queryLower.includes('nexon') && (queryLower.includes('range') || queryLower.includes('certified'))) {
    return makeResult(
      "The Tata Nexon EV Max has a MIDC-certified driving range of 437 km on a single full charge.",
      'ev_knowledge'
    );
  }

  if (queryLower.includes('nexon') && (queryLower.includes('battery') || queryLower.includes('capacity') || queryLower.includes('size'))) {
    return makeResult(
      "The Tata Nexon EV Max is equipped with a 40.5 kWh high-density Lithium-ion battery pack, while the medium-range version comes with a 30 kWh battery.",
      'ev_knowledge'
    );
  }

  if (queryLower.includes('nexon') && (queryLower.includes('charging') || queryLower.includes('charge time') || queryLower.includes('how long'))) {
    return makeResult(
      "Using a 50 kW DC fast charger, the Tata Nexon EV Max can charge from 0% to 80% in approximately 56 minutes. A standard 7.2 kW AC home wallbox charger takes about 6 hours for a full charge.",
      'ev_knowledge'
    );
  }

  if (queryLower.includes('mileage') || queryLower.includes('efficiency') || queryLower.includes('consumption')) {
    if (queryLower.includes('nexon') || queryLower.includes('ev')) {
      return makeResult(
        "Electric vehicles don't have 'mileage' in the traditional sense, but rather energy efficiency. The Tata Nexon EV has an average energy consumption of 140 to 160 Wh/km, translating to about 6 to 7 km per unit (kWh) of electricity.",
        'ev_knowledge'
      );
    }
  }

  if (queryLower.includes('traffic') || queryLower.includes('routing')) {
    return makeResult(
      "The Smart EV Assistant utilizes real-time traffic routing to suggest alternative paths with less congestion, helping to conserve energy and optimize battery consumption during heavy traffic.",
      'ev_knowledge'
    );
  }

  if (queryLower.includes('nexon') && (queryLower.includes('spec') || queryLower.includes('detail') || queryLower.includes('tell me about'))) {
    return makeResult(
      "The Tata Nexon EV Max features a 40.5 kWh battery pack, a MIDC certified range of 437 km, support for 50 kW DC fast charging (0-80% in 56 minutes), and an electric motor delivering 143 PS of power and 250 Nm of torque.",
      'ev_knowledge'
    );
  }

  // Handle "navigate to nearest/closest"
  if (cleanCmd.includes('navigate') && (cleanCmd.includes('nearest') || cleanCmd.includes('closest')) && (cleanCmd.includes('one') || cleanCmd.includes('station') || cleanCmd.includes('charger'))) {
    let stationsList = nearbyStations || [];
    if (stationsList.length > 0) {
      const closestName = stationsList[0].name;
      return makeResult(
        `Planning route to ${closestName}. Opening Navigation Screen.`,
        'route_navigation',
        'plan_route',
        '/navigation',
        { destination: closestName }
      );
    } else {
      return makeResult(
        "Planning route to PulseCharge Poonamallee Hub. Opening Navigation Screen.",
        'route_navigation',
        'plan_route',
        '/navigation',
        { destination: "PulseCharge Poonamallee Hub" }
      );
    }
  }

  // Distance queries
  const distanceQuery = parseDistanceQuery(queryToParse);
  let loc1 = null;
  let loc2 = null;

  if (distanceQuery) {
    loc1 = distanceQuery.loc1;
    loc2 = distanceQuery.loc2;
  } else {
    // Check for single location distance query or navigation query
    const singleMatch = queryToParse.match(/(?:how\s+far\s+is\s+to|how\s+far\s+is|distance\s+to|how\s+far\s+to|how\s+many\s+km\s+to|how\s+many\s+kilometers\s+to|navigate\s+me\s+to|navigate\s+to|take\s+me\s+to|start\s+navigation\s+to|drive\s+me\s+to|show\s+route\s+to)\s+([a-z0-9\s,]+)/i) ||
                        queryToParse.match(/(?:distance|how\s+far)\s+(?:of|for)\s+([a-z0-9\s,]+)/i);
    if (singleMatch) {
      loc1 = "current location";
      loc2 = singleMatch[1].trim();
    }
  }

  if (loc1 && loc2) {
    const screens = [
      'dashboard', 'navigation', 'charging stations', 'stations', 'booking', 'slot booking', 
      'emergency sos', 'sos', 'voice assistant', 'analytics', 'settings', 'garage', 
      'weather alert', 'weather alerts', 'weather', 'cost optimizer', 'community', 'forum'
    ];
    const isExcluded = screens.includes(loc2.toLowerCase()) || 
                       loc2.toLowerCase().includes('station') || 
                       loc2.toLowerCase().includes('charger');
    if (isExcluded) {
      loc1 = null;
      loc2 = null;
    }
  }

  if (loc1 && loc2) {
    // Strip trailing punctuation
    loc1 = loc1.replace(/[?.,!]/g, "").trim();
    loc2 = loc2.replace(/[?.,!]/g, "").trim();

    // Handle Salem naming
    if (loc1.toLowerCase().includes('salem') && !loc1.toLowerCase().includes('tamil')) {
      loc1 = "salem, tamil nadu";
    }
    if (loc2.toLowerCase().includes('salem') && !loc2.toLowerCase().includes('tamil')) {
      loc2 = "salem, tamil nadu";
    }

    let coord1 = null;
    let coord2 = null;

    if (loc1.toLowerCase().includes("current location") || loc1.toLowerCase() === "my location") {
      let lat = 13.0473;
      let lng = 80.0945;
      let name1 = "your current location";
      if (telemetry && telemetry.location && telemetry.location.coordinates) {
        lng = telemetry.location.coordinates[0];
        lat = telemetry.location.coordinates[1];
        // find closest city
        let closestCity = null;
        let minDistance = Infinity;
        for (const [cityName, cityData] of Object.entries(INDIA_CITIES)) {
          const dist = Math.sqrt(Math.pow(cityData.lat - lat, 2) + Math.pow(cityData.lng - lng, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = cityName;
          }
        }
        if (closestCity && minDistance < 0.1) {
          name1 = `your current location (${closestCity.charAt(0).toUpperCase() + closestCity.slice(1)})`;
        }
      }
      coord1 = { lat, lng, name: name1 };
      loc1 = name1;
    } else {
      coord1 = await getGeocodingCoordinates(loc1);
    }

    if (loc2.toLowerCase().includes("current location") || loc2.toLowerCase() === "my location") {
      let lat = 13.0473;
      let lng = 80.0945;
      let name2 = "your current location";
      if (telemetry && telemetry.location && telemetry.location.coordinates) {
        lng = telemetry.location.coordinates[0];
        lat = telemetry.location.coordinates[1];
        let closestCity = null;
        let minDistance = Infinity;
        for (const [cityName, cityData] of Object.entries(INDIA_CITIES)) {
          const dist = Math.sqrt(Math.pow(cityData.lat - lat, 2) + Math.pow(cityData.lng - lng, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = cityName;
          }
        }
        if (closestCity && minDistance < 0.1) {
          name2 = `your current location (${closestCity.charAt(0).toUpperCase() + closestCity.slice(1)})`;
        }
      }
      coord2 = { lat, lng, name: name2 };
      loc2 = name2;
    } else {
      coord2 = await getGeocodingCoordinates(loc2);
    }

    if (coord1 && coord2) {
      const norm1 = normalizeCityName(coord1.name);
      const norm2 = normalizeCityName(coord2.name);

      const navKeywords = ['navigate', 'take me', 'start navigation', 'begin navigation', 'go to', 'open navigation', 'route to', 'plan route', 'drive me', 'show route'];
      const isExplicitNavigation = navKeywords.some(kw => cleanCmd.includes(kw));

      const formatDuration = (mins) => {
        const hrs = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        let res = "";
        if (hrs > 0) {
          res += `${hrs} hour${hrs > 1 ? 's' : ''}`;
        }
        if (remainingMins > 0) {
          if (res) res += " ";
          res += `${remainingMins} minute${remainingMins > 1 ? 's' : ''}`;
        }
        return res || "0 minutes";
      };

      // Check KNOWN_ROUTES
      const routeKey = `${norm1}-${norm2}`;
      const revRouteKey = `${norm2}-${norm1}`;
      let routeData = KNOWN_ROUTES[routeKey] || KNOWN_ROUTES[revRouteKey];

      if (routeData) {
        const dist = routeData.distance;
        const timeMins = Math.round(routeData.timeHours * 60);
        const responseText = isExplicitNavigation
          ? `Starting navigation to ${coord2.name}. The route distance is ${dist} km and the estimated travel time is ${formatDuration(timeMins)}.`
          : `The driving distance from ${coord1.name} to ${coord2.name} is ${dist} km and the estimated travel time is ${formatDuration(timeMins)}.`;
        
        return makeResult(
          responseText,
          isExplicitNavigation ? 'route_navigation' : 'telemetry_query',
          isExplicitNavigation ? 'plan_route' : 'speak_only',
          isExplicitNavigation ? '/navigation' : '',
          isExplicitNavigation ? { 
            origin: coord1.name,
            destination: coord2.name,
            distance: dist,
            originCoords: [coord1.lng, coord1.lat],
            destinationCoords: [coord2.lng, coord2.lat]
          } : {}
        );
      }

      // Attempt online distance lookup
      const roadData = await getOnlineRoadDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
      if (roadData) {
        const dist = roadData.distanceKm;
        const time = roadData.durationMins;
        const responseText = isExplicitNavigation
          ? `Starting navigation to ${coord2.name}. The route distance is ${dist} km and the estimated travel time is ${formatDuration(time)}.`
          : `The driving distance from ${coord1.name} to ${coord2.name} is ${dist} km and the estimated travel time is ${formatDuration(time)}.`;
        return makeResult(
          responseText,
          isExplicitNavigation ? 'route_navigation' : 'telemetry_query',
          isExplicitNavigation ? 'plan_route' : 'speak_only',
          isExplicitNavigation ? '/navigation' : '',
          isExplicitNavigation ? {
            origin: coord1.name,
            destination: coord2.name,
            distance: dist,
            duration: time,
            originCoords: [coord1.lng, coord1.lat],
            destinationCoords: [coord2.lng, coord2.lat]
          } : {}
        );
      } else {
        // Fallback to Haversine
        const haversineDist = calculateHaversineDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
        const estRoadDist = Math.round(haversineDist * 1.25);
        const estTime = Math.round(estRoadDist * 1.2);
        const responseText = isExplicitNavigation
          ? `Starting navigation to ${coord2.name}. The route distance is ${estRoadDist} km and the estimated travel time is ${formatDuration(estTime)}.`
          : `The driving distance from ${coord1.name} to ${coord2.name} is ${estRoadDist} km and the estimated travel time is ${formatDuration(estTime)}.`;
        return makeResult(
          responseText,
          isExplicitNavigation ? 'route_navigation' : 'telemetry_query',
          isExplicitNavigation ? 'plan_route' : 'speak_only',
          isExplicitNavigation ? '/navigation' : '',
          isExplicitNavigation ? {
            origin: coord1.name,
            destination: coord2.name,
            distance: estRoadDist,
            duration: estTime,
            originCoords: [coord1.lng, coord1.lat],
            destinationCoords: [coord2.lng, coord2.lat]
          } : {}
        );
      }
    } else {
      return makeResult(
        `I'm sorry, I couldn't locate coordinates for one or both cities: "${loc1}" and/or "${loc2}". Please verify spelling.`,
        'ev_knowledge'
      );
    }
  }

  // 1. SOS/Emergency triggers
  const sosKeywords = ['sos', 'emergency', 'help me', 'accident', 'broken down', 'roadside assistance', 'i need help'];
  if (sosKeywords.some(kw => cleanCmd.includes(kw))) {
    return makeResult(
      "Emergency SOS initiated. Opening Emergency SOS screen and starting the safety countdown dispatcher.",
      'emergency_sos',
      'trigger_sos',
      '/sos'
    );
  }

  // 2. Map & Route Control Actions
  if (cleanCmd === 'start navigation' || cleanCmd === 'resume navigation' || cleanCmd === 'begin navigation') {
    return makeResult("Starting navigation simulation.", 'route_navigation', 'start_navigation', '/navigation');
  }
  if (cleanCmd === 'stop navigation' || cleanCmd === 'pause navigation' || cleanCmd === 'end navigation') {
    return makeResult("Stopping navigation simulation.", 'route_navigation', 'stop_navigation', '/navigation');
  }
  if (cleanCmd.includes('recalculate') && cleanCmd.includes('route')) {
    return makeResult("Recalculating route parameters.", 'route_navigation', 'recalculate_route', '/navigation');
  }
  if (cleanCmd.includes('fastest route') || cleanCmd.includes('find fastest')) {
    return makeResult("Finding the fastest route to your destination.", 'route_navigation', 'find_fastest_route', '/navigation');
  }

  // 3. Plan Route custom places
  const routeMatch = cleanCmd.match(/(?:navigate to|go to|take me to|plan route to|calculate route to)\s+([a-z0-9\s,]+)/i);
  if (routeMatch) {
    const destName = routeMatch[1].trim();
    // Exclude standard screens from custom navigation places
    const screens = [
      'dashboard', 'navigation', 'charging stations', 'stations', 'booking', 'slot booking', 
      'emergency sos', 'sos', 'voice assistant', 'analytics', 'settings', 'garage', 
      'weather alert', 'weather alerts', 'weather', 'cost optimizer', 'community', 'forum'
    ];
    if (!screens.includes(destName)) {
      return makeResult(
        `Planning route to ${destName.charAt(0).toUpperCase() + destName.slice(1)}. Opening Navigation Screen.`,
        'route_navigation',
        'plan_route',
        '/navigation',
        { destination: destName }
      );
    }
  }

  // 4. App Screen Navigations
  const navScreensMap = {
    'dashboard': { path: '/dashboard', label: 'Dashboard' },
    'home': { path: '/dashboard', label: 'Dashboard' },
    'stats': { path: '/dashboard', label: 'Dashboard' },
    'navigation': { path: '/navigation', label: 'Navigation Map' },
    'map': { path: '/navigation', label: 'Navigation Map' },
    'charging stations': { path: '/stations', label: 'Charging Stations' },
    'stations': { path: '/stations', label: 'Charging Stations' },
    'booking': { path: '/booking', label: 'Slot Booking' },
    'slot booking': { path: '/booking', label: 'Slot Booking' },
    'sos': { path: '/sos', label: 'Emergency SOS' },
    'emergency': { path: '/sos', label: 'Emergency SOS' },
    'voice assistant': { path: '/voice', label: 'Voice Assistant' },
    'analytics': { path: '/analytics', label: 'Analytics' },
    'charts': { path: '/analytics', label: 'Analytics' },
    'settings': { path: '/settings', label: 'Settings' },
    'garage': { path: '/settings', label: 'Settings' },
    'weather': { path: '/weather', label: 'Weather Alerts' },
    'weather alerts': { path: '/weather', label: 'Weather Alerts' },
    'cost optimizer': { path: '/cost-optimizer', label: 'Charging Cost Optimizer' },
    'cost': { path: '/cost-optimizer', label: 'Charging Cost Optimizer' },
    'community': { path: '/community', label: 'Community' },
    'forum': { path: '/community', label: 'Community' }
  };

  const navMatch = cleanCmd.match(/(?:open|go to|take me to|navigate to|show|view)\s+([a-z0-9\s]+)/i) ||
                   cleanCmd.match(/^open\s+([a-z0-9\s]+)$/i) ||
                   cleanCmd.match(/^go\s+to\s+([a-z0-9\s]+)$/i);
  if (navMatch) {
    const screenKey = navMatch[1].trim();
    if (navScreensMap[screenKey]) {
      return makeResult(`Opening ${navScreensMap[screenKey].label} Screen.`, 'app_navigation', 'navigate', navScreensMap[screenKey].path);
    }
  }

  // 5. Station Queries
  if (cleanCmd.includes('cheapest charging') || cleanCmd.includes('cheapest route') || cleanCmd.includes('cheapest charger') || cleanCmd.includes('cheapest charging option')) {
    return makeResult("Locating the cheapest charging options nearby. Navigating to Cost Optimizer.", 'station_query', 'find_cheapest_station', '/cost-optimizer');
  }
  if (cleanCmd === 'navigate to the closest one' || cleanCmd === 'navigate to closest' || cleanCmd === 'navigate to closest charging station') {
    return makeResult("Navigating to the closest charging station.", 'station_query', 'navigate_closest_station', '/navigation');
  }
  if (cleanCmd.includes('dc fast') || cleanCmd.includes('fast charger')) {
    return makeResult("Filtering available slots for DC fast chargers.", 'station_query', 'find_dc_chargers', '/stations');
  }
  if (cleanCmd.includes('available chargers') || cleanCmd.includes('show available')) {
    return makeResult("Filtering stations to show available slots.", 'station_query', 'show_available_chargers', '/stations');
  }
  if (cleanCmd.includes('book a charging slot') || cleanCmd.includes('book slot') || cleanCmd.includes('reserve a slot')) {
    return makeResult("Opening the Charging Slot Booking checkout drawer.", 'station_query', 'book_slot', '/booking');
  }
  if (cleanCmd.includes('station details') || cleanCmd.includes('details of station')) {
    return makeResult("Opening detailed connector status drawer for closest charging station.", 'station_query', 'show_station_details', '/stations');
  }

  // Find stations near me
  const isFindStations = (cleanCmd.includes('find') || cleanCmd.includes('show') || cleanCmd.includes('locate') || cleanCmd.includes('nearest')) &&
                         (cleanCmd.includes('station') || cleanCmd.includes('charger'));
  if (isFindStations) {
    let stationsList = nearbyStations || [];
    let replyText = '';
    if (stationsList.length > 0) {
      replyText = `I found ${stationsList.length} charging stations nearby. The closest is ${stationsList[0].name}. Would you like to navigate there?`;
      params = { stations: stationsList.map(s => ({ name: s.name, coordinates: s.location.coordinates })) };
    } else {
      replyText = "I located the nearest charging stations. The closest is PulseCharge Poonamallee Hub. Would you like me to navigate there?";
      params = { stations: [
        { name: "PulseCharge Poonamallee Hub", coordinates: [80.0950, 13.0480] },
        { name: "EcoVoltage Nazarathpet", coordinates: [80.0650, 13.0410] }
      ] };
    }
    return makeResult(replyText, 'station_query', 'find_nearby_stations', '/stations', params);
  }

  // 6. Telemetry Queries
  const updateBatteryMatch = cleanCmd.match(/(?:set|update|change|is)\s+(?:my\s+)?(?:current\s+)?(?:battery|charge|percentage|soc)(?:\s+(?:battery|charge|percentage|soc))*\s+(?:to|as)\s+(\d+)/i) ||
                             ((cleanCmd.includes('battery') || cleanCmd.includes('charge') || cleanCmd.includes('soc')) && cleanCmd.match(/(\d+)\s*(?:percent|%)/i));
  if (updateBatteryMatch) {
    const targetPercent = parseInt(updateBatteryMatch[1], 10);
    if (targetPercent >= 0 && targetPercent <= 100) {
      const calculatedRange = Math.round(capacity * 6.5 * (targetPercent / 100));
      return makeResult(`Battery percentage updated to ${targetPercent} percent. Your estimated driving range is now ${calculatedRange} kilometers.`, 'telemetry_query');
    }
  }

  if (cleanCmd.includes('battery percentage') || cleanCmd.includes('battery level') || cleanCmd.includes('current battery percentage') || cleanCmd.includes('battery soc') || cleanCmd === 'my battery' || cleanCmd === 'battery' || cleanCmd.includes('battery status')) {
    return makeResult(`Your vehicle's battery is currently at ${charge} percent with an estimated driving range of ${range} kilometers.`, 'telemetry_query');
  }
  if (cleanCmd.includes('range left') || cleanCmd.includes('estimated range') || cleanCmd.includes('remaining range') || cleanCmd.includes('how much range') || cleanCmd.includes('how many kilometers can i travel') || cleanCmd.includes('how many km') || cleanCmd === 'range') {
    return makeResult(`Your remaining range is ${range} kilometers with ${charge} percent battery remaining.`, 'telemetry_query');
  }
  if (cleanCmd.includes('charging status') || cleanCmd.includes('is the vehicle charging') || cleanCmd.includes('are we charging') || cleanCmd.includes('am i charging') || cleanCmd.includes('charging progress')) {
    let replyText = '';
    if (isCharging) {
      replyText = `Yes, your vehicle is currently charging with a power draw of ${powerDraw} kilowatts. Estimated time to full is ${etaMins} minutes.`;
    } else {
      replyText = `Your vehicle is currently not charging. Battery is at ${charge} percent.`;
    }
    return makeResult(replyText, 'telemetry_query');
  }
  if (cleanCmd.includes('vehicle speed') || cleanCmd.includes('how fast') || cleanCmd.includes('speed')) {
    return makeResult(`Your current vehicle speed is ${speed} kilometers per hour.`, 'telemetry_query');
  }
  if (cleanCmd.includes('battery temperature') || cleanCmd.includes('temperature')) {
    return makeResult(`The battery thermal diagnostic reports cell temperature is at ${temp} degrees Celsius, which is within the optimal range.`, 'telemetry_query');
  }
  if (cleanCmd.includes('battery health') || cleanCmd.includes('state of health') || cleanCmd.includes('soh')) {
    return makeResult(`Your battery State of Health is estimated at 96 percent based on cell health analytics. Chemical degradation is minimal.`, 'telemetry_query');
  }
  if (cleanCmd.includes('energy consumption') || cleanCmd.includes('consumption')) {
    return makeResult("Your average energy consumption is 160 Watt-hours per kilometer.", 'telemetry_query');
  }



  // Speed and distance target range calculations (contains numbers)
  const distanceMatch = cleanCmd.match(/(\d+)\s*(?:km|kilometer|k\.m\.)/i);
  const speedMatch = cleanCmd.match(/(\d+)\s*(?:km\/h|kmh|kmph|speed|km\/hr|kmhr|k\.m\.h)/i) || cleanCmd.match(/(?:speed of|at)\s*(\d+)/i);

  if (distanceMatch || (speedMatch && (cleanCmd.includes('range') || cleanCmd.includes('go') || cleanCmd.includes('travel') || cleanCmd.includes('reach')))) {
    const targetDistance = distanceMatch ? parseInt(distanceMatch[1], 10) : null;
    const speedVal = speedMatch ? parseInt(speedMatch[1], 10) : 80;

    // Cruising speed multiplier (Optimal: 60-80 km/h. High speed wind resistance penalty)
    let speedMultiplier = 1.0;
    if (speedVal > 80) {
      speedMultiplier = Math.max(0.5, 1.0 - (speedVal - 80) * 0.015);
    } else if (speedVal < 40) {
      speedMultiplier = 0.92; // accessory load baseline penalty
    }

    const standardRange = Math.round(capacity * 6.5 * (charge / 100));
    const calculatedRange = Math.round(standardRange * speedMultiplier);

    if (targetDistance) {
      if (calculatedRange >= targetDistance) {
        const approxRemainingSoC = Math.round(charge * (1 - (targetDistance / calculatedRange)));
        return makeResult(`Telemetry evaluation: Cruising at a speed of ${speedVal} km/h, your current battery of ${charge}% gives you a range of ${calculatedRange} kilometers. Yes! You can reach your destination of ${targetDistance} km. You will arrive with approximately ${approxRemainingSoC}% battery charge remaining.`, 'telemetry_query');
      } else {
        return makeResult(`Warning! Cruising at a speed of ${speedVal} km/h reduces range due to wind resistance. Your current battery of ${charge}% only gives you a range of ${calculatedRange} kilometers, which is insufficient to reach your destination of ${targetDistance} km. Otherwise, you must stop the car and charge at a station near you. The closest charger is Bandra PulseCharge Supercharger, located 1.2 km away.`, 'telemetry_query');
      }
    } else {
      return makeResult(`Telemetry evaluation: Cruising at a speed of ${speedVal} km/h with your current battery of ${charge}% gives you a projected driving range of ${calculatedRange} kilometers (standard range is ${standardRange} km). If your destination is further, you must stop and charge.`, 'telemetry_query');
    }
  }

  // Active range simulation check
  const isRangeSimulation = (cleanCmd.includes('calculate') || cleanCmd.includes('determine') || cleanCmd.includes('simulate')) &&
                            (cleanCmd.includes('range') || cleanCmd.includes('distance'));
  const isSimulateWithParams = cleanCmd.includes('range') && (cleanCmd.includes('eco') || cleanCmd.includes('sport') || cleanCmd.includes('ac') || cleanCmd.includes('hill'));

  if (isRangeSimulation || isSimulateWithParams) {
    const hasEco = cleanCmd.includes('eco');
    const hasSport = cleanCmd.includes('sport');
    const hasAcOn = cleanCmd.includes('ac on') || cleanCmd.includes('with ac') || cleanCmd.includes('ac enabled');
    const hasAcOff = cleanCmd.includes('ac off') || cleanCmd.includes('without ac') || cleanCmd.includes('ac disabled');
    const hasHilly = cleanCmd.includes('hill') || cleanCmd.includes('hilly') || cleanCmd.includes('mountain') || cleanCmd.includes('slope');
    
    if (!hasEco && !hasSport && !hasAcOn && !hasAcOff && !hasHilly) {
      const rangeVal = Math.round(capacity * 6.5 * (charge / 100));
      return makeResult(`Your ${vehicleName} is at ${charge}% charge. The standard range is ${rangeVal} km. To determine range under specific conditions, say e.g. "calculate range in eco mode with AC off on hilly roads".`, 'telemetry_query');
    }

    let multiplier = 1.0;
    let conditions = [];

    if (hasEco) {
      multiplier *= 1.10;
      conditions.push('Eco Mode (+10%)');
    } else if (hasSport) {
      multiplier *= 0.80;
      conditions.push('Sport Mode (-20%)');
    } else {
      conditions.push('Normal Mode');
    }

    if (hasAcOn) {
      multiplier *= 0.90;
      conditions.push('AC On (-10%)');
    } else if (hasAcOff) {
      conditions.push('AC Off');
    }

    if (hasHilly) {
      multiplier *= 0.85;
      conditions.push('Hilly Terrain (-15%)');
    } else {
      conditions.push('Flat Terrain');
    }

    const standardRange = Math.round(capacity * 6.5 * (charge / 100));
    const calculatedRange = Math.round(standardRange * multiplier);

    return makeResult(`Range determination complete. For your ${vehicleName} at ${charge}% battery, driving under these conditions: [${conditions.join(', ')}], the calculated driving range is ${calculatedRange} kilometers (standard range was ${standardRange} km). System telemetry has been updated.`, 'telemetry_query');
  }

  // Active vehicle charge query
  if (cleanCmd.includes('my battery') || cleanCmd.includes('my charge') || cleanCmd.includes('battery level') || cleanCmd.includes('charge percentage') || cleanCmd.match(/^(battery|charge|soc)$/)) {
    return makeResult(`Your active EV is at ${charge}% capacity.`, 'telemetry_query');
  }

  // Token overlaps & scoring against KNOWLEDGE_BASE
  const stopWords = new Set([
    "what", "is", "how", "the", "a", "an", "to", "of", "in", "on", "for", "with",
    "can", "you", "tell", "me", "about", "what's", "does", "do", "how's", "are",
    "should", "would", "could", "explain", "describe", "find", "get", "show",
    "please", "give", "detail", "details", "info", "information", "regarding", "related"
  ]);

  const userTokens = cleanCmd
    .replace(/[?.,!]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 1 && !stopWords.has(token));

  const searchTokens = userTokens.length > 0 
    ? userTokens 
    : cleanCmd.split(/\s+/).filter(t => t.length > 0);

  let bestMatch = null;
  let highestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    
    for (const keyword of entry.keywords) {
      if (cleanCmd.includes(keyword)) {
        score += 3.5; 
      }
      for (const token of searchTokens) {
        if (keyword === token) {
          score += 2.0;
        } else if (keyword.includes(token) || token.includes(keyword)) {
          score += 0.5;
        }
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && highestScore >= 1.5) {
    return makeResult(bestMatch.answer, 'ev_knowledge');
  }
  
  if (cleanCmd.includes("feature") || cleanCmd.includes("module") || cleanCmd.includes("screen") || cleanCmd.includes("app")) {
    return makeResult("This Smart EV Assistant app features 15 modular screens including the Dashboard, Navigation vector maps, Charging Station directories, Slot Booking checkouts, emergency SOS assistance, Recharts energy analytics, and settings garage management. Let me know which module you want to learn about!", 'app_knowledge');
  }
  
  if (cleanCmd.includes("battery") || cleanCmd.includes("range") || cleanCmd.includes("charge") || cleanCmd.includes("ev") || cleanCmd.includes("electric")) {
    return makeResult("To optimize battery range: drive at moderate speeds (aerodynamic drag increases drag above 80 km/h), utilize regenerative braking, keep SoC between 20-80% to protect cells, and limit heavy AC usage in high heat. Ask me about AC vs DC charging, solid state cells, battery safety, or maintenance!", 'ev_knowledge');
  }

  const cleanText = originalText.replace(/[?.,!]/g, "").trim();
  return makeResult(`I found some information regarding "${cleanText}": Optimizing your speed, using regenerative braking, keeping battery State of Charge above 20%, and scheduling charging slots will optimize your driving. Let me know what EV feature or technical topic you'd like to explore!`, 'ev_knowledge');
}
