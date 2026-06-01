import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';
import Telemetry from '../models/Telemetry.js';
import VoiceLog from '../models/VoiceLog.js';
import { generateConversationalReply } from '../utils/voiceAssistant.js';
import EmergencyRequest from '../models/EmergencyRequest.js';

export default function registerTelemetrySocket(io) {
  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.warn('🔌 [Socket Auth] Connection rejected: No token supplied.');
      return next(new Error('Authentication failed: Missing token'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforevassistant123!');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.warn(`🔌 [Socket Auth] Connection rejected: Token invalid (${err.message})`);
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  // Track active intervals by socket/user
  const activeChargeIntervals = new Map();
  const activeDrivingIntervals = new Map();
  const activeEmergencyIntervals = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Driver connected. User ID: ${socket.userId}, Socket ID: ${socket.id}`);

    // --- 1. Charging Session Live Updates ---
    socket.on('session:subscribe', async ({ sessionId }) => {
      console.log(`📡 [Socket.io] Subscribing to charging session: ${sessionId}`);
      socket.join(sessionId);

      // Clear any existing charge interval for this socket
      if (activeChargeIntervals.has(socket.id)) {
        clearInterval(activeChargeIntervals.get(socket.id));
      }

      const session = await Session.findById(sessionId);
      if (!session) return;

      const vehicle = await Vehicle.findById(session.vehicleId);
      if (!vehicle) return;

      const station = await Station.findById(session.stationId);
      const pricing = station ? station.pricing_per_kWh : 15.0;

      // Check if slot has fast DC or AC charging
      const slot = station?.slots?.find(s => s.id === session.slotId);
      const isFast = slot ? slot.type.toLowerCase().includes('dc') : true;

      // Simulation parameters
      const powerKW = slot?.power_kW || (isFast ? 150 : 22);
      const chargeStep = isFast ? 1.5 : 0.4; // % increase per tick (2 seconds)
      
      let currentCharge = vehicle.currentCharge_percent;
      let energyDelivered = session.energy_delivered_kwh || 0;
      let cost = session.total_cost || 0;
      let timeElapsed = 0;

      const interval = setInterval(async () => {
        // Fetch session again to verify it wasn't stopped via HTTP endpoint
        const freshSession = await Session.findById(sessionId);
        if (!freshSession || freshSession.status !== 'active') {
          console.log(`🔋 [Socket.io] Session ${sessionId} ended via API. Stopping simulation.`);
          clearInterval(interval);
          activeChargeIntervals.delete(socket.id);
          return;
        }

        timeElapsed += 2; // Simulated update every 2 seconds
        
        if (currentCharge >= 100) {
          currentCharge = 100;
          
          // Finalize session
          freshSession.status = 'completed';
          freshSession.end_time = new Date();
          freshSession.energy_delivered_kwh = parseFloat(energyDelivered.toFixed(2));
          freshSession.total_cost = parseFloat(cost.toFixed(2));
          await freshSession.save();

          // Release station slot
          if (station) {
            const stationSlot = station.slots.find(s => s.id === session.slotId);
            if (stationSlot) {
              stationSlot.status = 'available';
              await station.save();
              
              // Broadcast slot status release via Socket.IO
              io.emit('station:status_update', { stationId: session.stationId, slotId: session.slotId, status: 'available' });
            }
          }

          // Update vehicle SoC
          vehicle.currentCharge_percent = 100;
          vehicle.range_km = Math.round(vehicle.batteryCapacity_kWh * 6.5);
          await vehicle.save();

          // Reset Telemetry Database record
          await Telemetry.findOneAndUpdate(
            { vehicleId: vehicle._id },
            {
              batteryPercent: 100,
              range_km: Math.round(vehicle.batteryCapacity_kWh * 6.5),
              isCharging: false,
              powerDraw_kW: 0,
              estimatedChargeTime_mins: 0,
              speed_kmh: 0
            },
            { upsert: true }
          );

          io.to(sessionId).emit('session:update', {
            currentCharge: 100,
            energyDelivered: parseFloat(energyDelivered.toFixed(2)),
            powerDraw: 0,
            timeElapsed,
            cost: parseFloat(cost.toFixed(2)),
            estimatedChargeTime_mins: 0
          });

          io.to(sessionId).emit('charge:full');
          console.log(`🔋 [Socket.io] Session ${sessionId} completed. SoC reached 100%.`);
          
          clearInterval(interval);
          activeChargeIntervals.delete(socket.id);
          return;
        }

        // Increment SoC
        currentCharge = Math.min(100, currentCharge + chargeStep);
        
        // Calculate energy delivered: kW * hours (tick is 2s -> 2/3600 hours)
        const addedEnergy = (powerKW * (2 / 3600));
        energyDelivered += addedEnergy;
        cost += addedEnergy * pricing;

        // Update database (vehicle SoC and session metrics)
        const roundedCharge = Math.round(currentCharge);
        const range = Math.round(vehicle.batteryCapacity_kWh * 6.5 * (roundedCharge / 100));
        vehicle.currentCharge_percent = roundedCharge;
        vehicle.range_km = range;
        await vehicle.save();

        freshSession.energy_delivered_kwh = parseFloat(energyDelivered.toFixed(2));
        freshSession.total_cost = parseFloat(cost.toFixed(2));
        await freshSession.save();

        // Calculate ETA
        const timeRemainingSeconds = ((100 - roundedCharge) / chargeStep) * 2;
        const timeRemainingMins = Math.round(timeRemainingSeconds / 60);

        // Update Telemetry Database record
        await Telemetry.findOneAndUpdate(
          { vehicleId: vehicle._id },
          {
            batteryPercent: roundedCharge,
            range_km: range,
            isCharging: true,
            powerDraw_kW: powerKW,
            estimatedChargeTime_mins: timeRemainingMins,
            speed_kmh: 0
          },
          { upsert: true }
        );

        // Broadcast stats update
        io.to(sessionId).emit('session:update', {
          currentCharge: roundedCharge,
          energyDelivered: parseFloat(energyDelivered.toFixed(2)),
          powerDraw: powerKW,
          timeElapsed,
          cost: parseFloat(cost.toFixed(2)),
          estimatedChargeTime_mins: timeRemainingMins
        });
      }, 2000);

      activeChargeIntervals.set(socket.id, interval);
    });

    // --- 2. Driving Simulator Live Updates ---
    socket.on('driving:start', async ({ vehicleId, speedKmph, hvacOn, terrain }) => {
      console.log(`🚗 [Socket.io] Starting driving simulator for vehicle ${vehicleId}. Speed: ${speedKmph}km/h`);

      if (activeDrivingIntervals.has(socket.id)) {
        clearInterval(activeDrivingIntervals.get(socket.id));
      }

      const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: socket.userId });
      if (!vehicle) return;

      // Base depletion per tick (2 seconds)
      let baseDepletion = (parseFloat(speedKmph) / 100) * 0.3; // faster speed consumes more
      if (hvacOn) baseDepletion += 0.15; // AC consumes battery
      if (terrain === 'hills') baseDepletion += 0.25; // climbing consumes more

      const interval = setInterval(async () => {
        let currentCharge = vehicle.currentCharge_percent;

        if (currentCharge <= 0) {
          vehicle.currentCharge_percent = 0;
          vehicle.range_km = 0;
          await vehicle.save();

          // Reset Telemetry Database record
          await Telemetry.findOneAndUpdate(
            { vehicleId: vehicle._id },
            {
              batteryPercent: 0,
              range_km: 0,
              speed_kmh: 0,
              isCharging: false,
              powerDraw_kW: 0,
              estimatedChargeTime_mins: 0
            },
            { upsert: true }
          );

          socket.emit('vehicle:telemetry', {
            currentCharge: 0,
            range_km: 0,
            speed: 0
          });

          socket.emit('driving:stopped', { reason: 'battery_depleted' });
          console.log(`🚗 [Socket.io] Driving simulator stopped. Battery fully depleted.`);
          
          clearInterval(interval);
          activeDrivingIntervals.delete(socket.id);
          return;
        }

        // Deplete charge
        currentCharge = Math.max(0, currentCharge - baseDepletion);
        const range = Math.round(vehicle.batteryCapacity_kWh * 6.5 * (currentCharge / 100));

        const roundedCharge = Math.round(currentCharge);
        vehicle.currentCharge_percent = roundedCharge;
        vehicle.range_km = range;
        await vehicle.save();

        // Update Telemetry Database record
        await Telemetry.findOneAndUpdate(
          { vehicleId: vehicle._id },
          {
            batteryPercent: roundedCharge,
            range_km: range,
            speed_kmh: parseFloat(speedKmph) || 0,
            isCharging: false,
            powerDraw_kW: 0,
            estimatedChargeTime_mins: 0
          },
          { upsert: true }
        );

        // Emit telemetry updates
        socket.emit('vehicle:telemetry', {
          currentCharge: roundedCharge,
          range_km: range,
          speed: speedKmph,
          consumption_Wh_km: Math.round(200 + (speedKmph - 80) * 1.5 + (hvacOn ? 20 : 0))
        });

        // Trigger warning if battery drops below 20%
        if (currentCharge < 20 && (currentCharge + baseDepletion) >= 20) {
          socket.emit('charge:low', { message: 'Battery SoC is below 20%! Please navigate to the nearest charging station.' });
        }
      }, 2000);

      activeDrivingIntervals.set(socket.id, interval);
    });

    socket.on('driving:stop', async ({ vehicleId }) => {
      console.log(`🚗 [Socket.io] Stopping driving simulator for vehicle ${vehicleId}`);
      if (activeDrivingIntervals.has(socket.id)) {
        clearInterval(activeDrivingIntervals.get(socket.id));
        activeDrivingIntervals.delete(socket.id);
      }

      await Telemetry.findOneAndUpdate(
        { vehicleId },
        { speed_kmh: 0 }
      );

      socket.emit('driving:stopped', { reason: 'user_stopped' });
    });

    // --- 3. Voice Assistant Socket Events ---
    socket.on('voice:command', async ({ command }) => {
      console.log(`🎙️ [Socket.io] Received voice command from user: ${socket.userId}`);
      if (!command) return;

      // Emit typing indicator
      socket.emit('assistant:typing', { isProcessing: true });

      try {
        // 1. Log driver query
        await VoiceLog.create({
          userId: socket.userId,
          sender: 'user',
          text: command
        });

        // Get user vehicle details for dynamic range calculation
        const vehicle = await Vehicle.findOne({ userId: socket.userId, isDefault: true }) || await Vehicle.findOne({ userId: socket.userId });
        const telemetry = await Telemetry.findOne({ userId: socket.userId });

        // Fetch nearby stations
        let userCoords = [80.0945, 13.0473]; // default Poonamallee
        if (telemetry && telemetry.location && telemetry.location.coordinates) {
          userCoords = telemetry.location.coordinates;
        }

        const stations = await Station.find({
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: userCoords
              },
              $maxDistance: 5000000
            }
          }
        }).limit(5);

        // Check for battery update command
        const cleanCmd = command.toLowerCase().trim();
        const updateBatteryMatch = cleanCmd.match(/(?:set|update|change|is)\s+(?:my\s+)?(?:current\s+)?(?:battery|charge|percentage|soc)(?:\s+(?:battery|charge|percentage|soc))*\s+(?:to|as)\s+(\d+)/i) ||
                                   ((cleanCmd.includes('battery') || cleanCmd.includes('charge') || cleanCmd.includes('soc')) && cleanCmd.match(/(\d+)\s*(?:percent|%)/i));

        if (updateBatteryMatch) {
          const targetPercent = parseInt(updateBatteryMatch[1], 10);
          if (targetPercent >= 0 && targetPercent <= 100) {
            if (vehicle) {
              const capacity = vehicle.batteryCapacity_kWh || 40.5;
              const calculatedRange = Math.round(capacity * 6.5 * (targetPercent / 100));
              
              vehicle.currentCharge_percent = targetPercent;
              vehicle.range_km = calculatedRange;
              await vehicle.save();

              await Telemetry.findOneAndUpdate(
                { vehicleId: vehicle._id },
                { batteryPercent: targetPercent, range_km: calculatedRange },
                { upsert: true, new: true }
              );

              if (telemetry) {
                telemetry.batteryPercent = targetPercent;
                telemetry.range_km = calculatedRange;
              }

              // Broadcast update immediately to frontend
              socket.emit('vehicle:telemetry', {
                currentCharge: targetPercent,
                range_km: calculatedRange,
                speed: 0
              });
            }
          }
        }

        // 2. Generate conversational reply
        const result = generateConversationalReply(command, command, vehicle, telemetry, stations);

        // 3. Log assistant reply in DB
        await VoiceLog.create({
          userId: socket.userId,
          sender: 'assistant',
          text: result.text
        });

        // Simulated neural processing latency (800ms)
        setTimeout(() => {
          socket.emit('assistant:response', {
            text: result.text,
            intent: result.intent,
            action: result.action,
            targetPage: result.targetPage,
            params: result.params
          });
          socket.emit('assistant:typing', { isProcessing: false });
        }, 800);

      } catch (err) {
        console.error('❌ [Socket.io] Error processing voice command:', err);
        socket.emit('assistant:response', { text: 'Sorry, I encountered a system diagnostic error while processing your request.' });
        socket.emit('assistant:typing', { isProcessing: false });
      }
    });

    // --- 4. Emergency SOS Sockets ---
    socket.on('emergency:subscribe', async ({ requestId }) => {
      console.log(`📡 [Socket.io] Subscribing to emergency request: ${requestId}`);
      
      // Clean up previous interval if it exists
      if (activeEmergencyIntervals.has(socket.id)) {
        clearInterval(activeEmergencyIntervals.get(socket.id));
      }

      const request = await EmergencyRequest.findById(requestId);
      if (!request) return;

      const userCoords = request.location.coordinates;
      let startEta = request.responderDetails.eta_mins || 15;
      let currentEta = startEta;

      const interval = setInterval(async () => {
        const freshRequest = await EmergencyRequest.findById(requestId);
        // Stop if request was cancelled or resolved
        if (!freshRequest || freshRequest.status === 'cancelled' || freshRequest.status === 'resolved') {
          console.log(`📡 [Socket.io] Emergency request ${requestId} ended. Stopping tracking.`);
          clearInterval(interval);
          activeEmergencyIntervals.delete(socket.id);
          return;
        }

        // Move coordinates 15% closer to user [lng, lat]
        const respCoords = freshRequest.responderDetails.location.coordinates;
        const newLng = respCoords[0] + (userCoords[0] - respCoords[0]) * 0.15;
        const newLat = respCoords[1] + (userCoords[1] - respCoords[1]) * 0.15;

        // Decrement ETA
        currentEta = Math.max(0, currentEta - 1);

        let status = freshRequest.status;
        if (currentEta === 0) {
          status = 'arrived';
        } else if (currentEta <= 12) {
          status = 'enroute';
        }

        // Save progress to database
        freshRequest.status = status;
        freshRequest.responderDetails.eta_mins = currentEta;
        freshRequest.responderDetails.location.coordinates = [newLng, newLat];
        await freshRequest.save();

        // Emit updates
        socket.emit('emergency:update', { request: freshRequest });

        if (status === 'arrived') {
          socket.emit('emergency:arrived', { message: 'EcoTow rescue unit has arrived at your coordinates.' });
          console.log(`📡 [Socket.io] Emergency request ${requestId} - Responder Arrived!`);
          clearInterval(interval);
          activeEmergencyIntervals.delete(socket.id);
        }
      }, 3000); // simulation interval: 3 seconds

      activeEmergencyIntervals.set(socket.id, interval);
    });

    socket.on('emergency:unsubscribe', ({ requestId }) => {
      console.log(`📡 [Socket.io] Unsubscribing from emergency request: ${requestId}`);
      if (activeEmergencyIntervals.has(socket.id)) {
        clearInterval(activeEmergencyIntervals.get(socket.id));
        activeEmergencyIntervals.delete(socket.id);
      }
    });

    // --- 5. Navigation Geolocation Realtime Updates ---
    socket.on('location:update', async ({ lat, lng, speedKmph }) => {
      console.log(`📡 [Socket.io] Location update for user ${socket.userId}: [${lng}, ${lat}] (Speed: ${speedKmph} km/h)`);
      if (!lat || !lng) return;

      try {
        const vehicle = await Vehicle.findOne({ userId: socket.userId, isDefault: true }) || await Vehicle.findOne({ userId: socket.userId });
        
        if (vehicle) {
          // Update Telemetry log record with new coordinates and speed
          await Telemetry.findOneAndUpdate(
            { vehicleId: vehicle._id },
            {
              batteryPercent: vehicle.currentCharge_percent,
              range_km: vehicle.range_km,
              speed_kmh: parseFloat(speedKmph) || 0,
              isCharging: false,
              location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
              }
            },
            { upsert: true }
          );

          // Find nearby stations within 15km
          const stations = await Station.find({
            'location.coordinates': {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: 15000
              }
            }
          });

          // Emit live coordinate update response and nearby markers update
          socket.emit('location:updated', { 
            success: true, 
            coordinates: [parseFloat(lng), parseFloat(lat)],
            stations
          });
        }
      } catch (err) {
        console.error('❌ [Socket.io] Location update error:', err);
      }
    });

    // --- 6. Admin Monitoring Real-Time Updates ---
    let adminInterval = null;

    socket.on('admin:subscribe', async () => {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(socket.userId);
        if (user && user.role === 'admin') {
          socket.join('admin:monitoring');
          console.log(`🛡️ [Socket.io] Admin joined monitoring room. Socket ID: ${socket.id}`);

          if (adminInterval) clearInterval(adminInterval);

          // Stream live statistics every 3 seconds to this administrator
          adminInterval = setInterval(async () => {
            try {
              const activeSessionsCount = await Session.countDocuments({ status: 'active' });
              const totalDrivers = await User.countDocuments({ role: 'driver' });
              
              // Estimate load and grid occupancy
              const activeSessions = await Session.find({ status: 'active' });
              let activeLoadKw = 0;
              for (const session of activeSessions) {
                const station = await Station.findById(session.stationId);
                const slot = station?.slots?.find(sl => sl.id === session.slotId);
                activeLoadKw += slot?.power_kW || 75;
              }

              // Count total connected client sockets
              const totalSockets = io.sockets.sockets.size;

              // Query or simulate slot core temperatures and create fault logs
              const stations = await Station.find({});
              const simulatedAlerts = [];
              
              // Simulate overheat if Bandra s2 is occupied
              const bandra = stations.find(s => s._id === 'st_bandra_01');
              if (bandra) {
                const s2 = bandra.slots.find(s => s.id === 's2');
                if (s2 && s2.status === 'occupied') {
                  simulatedAlerts.push({
                    id: 'alert-core-overheat',
                    station: 'PulseCharge HyperHub',
                    slot: 's2',
                    issue: 'Overheating Core Temperature (79°C)',
                    level: 'critical'
                  });
                }
              }

              socket.emit('admin:telemetry', {
                metrics: {
                  totalDrivers: totalDrivers + 12, // baseline
                  activeSessions: activeSessionsCount,
                  activeLoadKw: Math.round(activeLoadKw),
                  totalSockets,
                  occupancyRate: activeSessionsCount > 0 ? Math.round((activeSessionsCount / 10) * 100) : 0
                },
                alerts: simulatedAlerts
              });
            } catch (err) {
              console.error('❌ [Socket.io] Admin interval query error:', err.message);
            }
          }, 3000);
        }
      } catch (err) {
        console.error('❌ [Socket.io] Admin subscription authorization error:', err.message);
      }
    });

    socket.on('admin:unsubscribe', () => {
      console.log(`🛡️ [Socket.io] Admin unsubscribed from monitoring room. Socket ID: ${socket.id}`);
      socket.leave('admin:monitoring');
      if (adminInterval) {
        clearInterval(adminInterval);
        adminInterval = null;
      }
    });

    // Clean up timers on disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 [Socket.io] Driver disconnected. Socket ID: ${socket.id}`);
      
      if (adminInterval) {
        clearInterval(adminInterval);
        adminInterval = null;
      }

      if (activeChargeIntervals.has(socket.id)) {
        clearInterval(activeChargeIntervals.get(socket.id));
        activeChargeIntervals.delete(socket.id);
      }

      if (activeDrivingIntervals.has(socket.id)) {
        clearInterval(activeDrivingIntervals.get(socket.id));
        activeDrivingIntervals.delete(socket.id);
      }

      if (activeEmergencyIntervals.has(socket.id)) {
        clearInterval(activeEmergencyIntervals.get(socket.id));
        activeEmergencyIntervals.delete(socket.id);
      }

      // Reset speed & power draw state in DB for user's vehicles on disconnect
      const vehicle = await Vehicle.findOne({ userId: socket.userId, isDefault: true }) || await Vehicle.findOne({ userId: socket.userId });
      if (vehicle) {
        await Telemetry.findOneAndUpdate(
          { vehicleId: vehicle._id },
          { speed_kmh: 0, isCharging: false, powerDraw_kW: 0, estimatedChargeTime_mins: 0 }
        );
      }
    });
  });
}
