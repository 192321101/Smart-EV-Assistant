import express from 'express';
import protect from '../middleware/auth.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Station from '../models/Station.js';

const router = express.Router();

// Helper to find nearest charging station
async function getNearestStation(coords) {
  try {
    let nearestStation = await Station.findOne({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coords
          }
        }
      }
    });
    if (!nearestStation) {
      nearestStation = await Station.findOne({}); // Fallback
    }
    return nearestStation;
  } catch (err) {
    console.error('Error finding nearest station:', err);
    return null;
  }
}

// @route   GET /api/emergency/active
// @desc    Check for an active SOS broadcast request
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const request = await EmergencyRequest.findOne({ 
      userId: req.user.id, 
      status: { $in: ['dispatched', 'enroute', 'arrived'] } 
    }).sort({ createdAt: -1 });
    
    if (request) {
      const nearestStation = await getNearestStation(request.location.coordinates);
      return res.json({ success: true, active: true, request, nearestStation });
    }

    res.json({ success: true, active: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error checking active SOS request.' });
  }
});

// @route   POST /api/emergency/request
// @desc    Create a new EmergencyRequest distress beacon
// @access  Private
router.post('/request', protect, async (req, res) => {
  const { lat, lng, message } = req.body;

  try {
    // 1. Cancel previous active requests
    await EmergencyRequest.updateMany(
      { userId: req.user.id, status: { $in: ['dispatched', 'enroute', 'arrived'] } }, 
      { status: 'cancelled' }
    );

    // 2. Generate responder details
    const names = ['Officer Rajesh Kumar', 'Assistant Amit Patel', 'Rescue Driver Vijay Singh'];
    const selectedName = names[Math.floor(Math.random() * names.length)];
    const phones = ['+919876543230', '+919876543231', '+919876543232'];
    const selectedPhone = phones[Math.floor(Math.random() * phones.length)];
    const randomEta = Math.floor(10 + Math.random() * 8); // 10-17 mins

    const userLat = parseFloat(lat) || 19.0596;
    const userLng = parseFloat(lng) || 72.8311;
    // Position responder slightly offset (approx 3km north-east)
    const respLat = userLat + 0.025;
    const respLng = userLng + 0.025;

    // 3. Create document
    const emergencyRequest = await EmergencyRequest.create({
      userId: req.user.id,
      status: 'dispatched',
      location: {
        type: 'Point',
        coordinates: [userLng, userLat]
      },
      message: message || 'Vehicle breakdown alert. Requiring roadside power rescue.',
      contactsNotified: true,
      responderDetails: {
        unitId: `EcoTow-#${Math.floor(100 + Math.random() * 900)}`,
        name: selectedName,
        phone: selectedPhone,
        eta_mins: randomEta,
        location: {
          type: 'Point',
          coordinates: [respLng, respLat]
        }
      }
    });

    const nearestStation = await getNearestStation([userLng, userLat]);

    res.status(201).json({ success: true, request: emergencyRequest, nearestStation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating SOS request.' });
  }
});

// @route   POST /api/emergency/trigger
// @desc    Backward compatibility legacy endpoint wrapping the new request logic
// @access  Private
router.post('/trigger', protect, async (req, res) => {
  const { lat, lng, message } = req.body;
  try {
    // Forward query parameters to new request flow
    await EmergencyRequest.updateMany(
      { userId: req.user.id, status: { $in: ['dispatched', 'enroute', 'arrived'] } }, 
      { status: 'cancelled' }
    );

    const names = ['Officer Rajesh Kumar', 'Assistant Amit Patel', 'Rescue Driver Vijay Singh'];
    const selectedName = names[Math.floor(Math.random() * names.length)];
    const phones = ['+919876543230', '+919876543231', '+919876543232'];
    const selectedPhone = phones[Math.floor(Math.random() * phones.length)];
    const randomEta = Math.floor(10 + Math.random() * 8);

    const userLat = parseFloat(lat) || 19.0596;
    const userLng = parseFloat(lng) || 72.8311;
    const respLat = userLat + 0.025;
    const respLng = userLng + 0.025;

    const request = await EmergencyRequest.create({
      userId: req.user.id,
      status: 'dispatched',
      location: {
        type: 'Point',
        coordinates: [userLng, userLat]
      },
      message: message || 'Vehicle breakdown alert. Requiring roadside power rescue.',
      contactsNotified: true,
      responderDetails: {
        unitId: `EcoTow-#${Math.floor(100 + Math.random() * 900)}`,
        name: selectedName,
        phone: selectedPhone,
        eta_mins: randomEta,
        location: {
          type: 'Point',
          coordinates: [respLng, respLat]
        }
      }
    });

    const nearestStation = await getNearestStation([userLng, userLat]);
    
    // Format alert properties to match the legacy EmergencyAlert schema
    const alertLegacy = {
      _id: request._id,
      userId: request.userId,
      status: request.status === 'cancelled' ? 'cancelled' : 'active',
      location: request.location,
      message: request.message,
      responderDetails: {
        unitId: request.responderDetails.unitId,
        eta_mins: request.responderDetails.eta_mins,
        name: request.responderDetails.name
      },
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };

    res.status(201).json({ success: true, alert: alertLegacy, nearestStation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error triggering SOS alert.' });
  }
});

// @route   GET /api/emergency/request/:id
// @desc    Track status of a specific EmergencyRequest
// @access  Private
router.get('/request/:id', protect, async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Emergency request not found.' });
    }

    // SEC-009: Ownership check — users may only read their own emergency requests.
    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: This emergency request belongs to another user.' });
    }

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error retrieving SOS request details.' });
  }
});

// @route   GET /api/emergency/nearby
// @desc    Retrieve nearby support services coordinates & details
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    // Generate a set of nearby mock help support centers around the driver's default viewport
    const supportServices = [
      { name: 'Bandra Tow Dispatch Yard', distance_km: 1.2, phone: '+919876543220', type: 'Eco Tow Station' },
      { name: 'EcoCharge Battery Repair Depot', distance_km: 2.4, phone: '+919876543221', type: 'Battery Diagnostics' },
      { name: 'Western Express EV Repair Clinic', distance_km: 3.5, phone: '+919876543222', type: 'EV Service Clinic' },
      { name: 'VoltRescue Rapid Battery Swap Node', distance_km: 4.8, phone: '+919876543223', type: 'Battery Swap Center' }
    ];
    res.json({ success: true, services: supportServices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching nearby services.' });
  }
});

// @route   POST /api/emergency/contacts/notify
// @desc    Trigger mock SMS broadcast alerts to family contact cards
// @access  Private
router.post('/contacts/notify', protect, async (req, res) => {
  const { requestId } = req.body;
  try {
    if (requestId) {
      // SEC-010: Ownership check — users can only update notification state on their own requests.
      const request = await EmergencyRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found.' });
      }
      if (request.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: This request belongs to another user.' });
      }
      await EmergencyRequest.findByIdAndUpdate(requestId, { contactsNotified: true });
    }
    const notifiedList = [
      '+919876543210 (Amit Sharma - Father)',
      '+919876543211 (Sunita Sharma - Mother)'
    ];
    res.json({ success: true, notified: notifiedList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error notifying emergency contacts.' });
  }
});

// @route   POST /api/emergency/cancel
// @desc    Cancel active SOS broadcasts
// @access  Private
router.post('/cancel', protect, async (req, res) => {
  try {
    await EmergencyRequest.updateMany(
      { userId: req.user.id, status: { $in: ['dispatched', 'enroute', 'arrived'] } }, 
      { status: 'cancelled' }
    );
    res.json({ success: true, message: 'Distress request deactivated and cancelled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error cancelling emergency request.' });
  }
});

export default router;
