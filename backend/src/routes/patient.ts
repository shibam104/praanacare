import express from 'express';
import Patient from '../models/Patient';
import Vitals from '../models/Vitals';
import Alert from '../models/Alert';
import Chat from '../models/Chat';
import { validateVitals, validateRequest } from '../middleware/validation';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authentication and role middleware
router.use(authMiddleware);
router.use(roleMiddleware('patient'));

// @route   GET /api/patient/dashboard
// @desc    Get patient dashboard data
// @access  Private (Patient)
router.get('/dashboard', async (req: any, res: express.Response): Promise<express.Response | void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }

    // Get latest vitals
    const latestVitals = await Vitals.findOne({ patientId: patient._id })
      .sort({ timestamp: -1 });

    // Get recent alerts
    const recentAlerts = await Alert.find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get active chats
    const activeChats = await Chat.find({ 
      patientId: patient._id, 
      status: 'active' 
    }).sort({ updatedAt: -1 });

    // Get vitals history (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const vitalsHistory = await Vitals.find({
      patientId: patient._id,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: -1 });

    const dashboard = {
      patient,
      latestVitals,
      recentAlerts,
      activeChats,
      vitalsHistory
    };

    res.status(200).json({ dashboard });
    return;
  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/patient/vitals
// @desc    Record patient vitals
// @access  Private (Patient)
router.post('/vitals', validateVitals, validateRequest, async (req: any, res: express.Response): Promise<express.Response | void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }

    const vitalsData = {
      ...req.body,
      patientId: patient._id,
      recordedBy: 'patient'
    };

    const vitals = new Vitals(vitalsData);
    await vitals.save();

    // Check for emergency conditions
    const isEmergency = checkEmergencyConditions(vitals);
    if (isEmergency) {
      vitals.isEmergency = true;
      await vitals.save();

      // Create emergency alert
      const alert = new Alert({
        patientId: patient._id,
        type: 'emergency',
        severity: 'critical',
        title: 'Emergency Vitals Detected',
        description: 'Critical vitals detected, immediate attention required',
        vitalsData: {
          heartRate: vitals.heartRate,
          bloodPressure: vitals.bloodPressure,
          temperature: vitals.temperature,
          oxygenSaturation: vitals.oxygenSaturation
        },
        symptoms: vitals.symptoms,
        status: 'active'
      });
      await alert.save();

      // Emit real-time alert
      const io = req.app.get('io');
      io.emit('emergency-alert', {
        patientId: patient._id,
        alertId: alert._id,
        severity: 'critical'
      });
    }

    res.status(201).json({ stored: true });
    return;
  } catch (error) {
    console.error('Record vitals error:', error);
    res.status(500).json({ message: 'Server error recording vitals' });
  }
});

// @route   GET /api/patient/vitals/history
// @desc    Get patient vitals history
// @access  Private (Patient)
router.get('/vitals/history', async (req: any, res: express.Response): Promise<express.Response | void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }

    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    const query: any = { patientId: patient._id };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const vitals = await Vitals.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vitals.countDocuments(query);

    const history = {
      vitals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    };

    res.status(200).json({ history });
    return;
  } catch (error) {
    console.error('Vitals history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/alerts
// @desc    Get patient alerts
// @access  Private (Patient)
router.get('/alerts', async (req: any, res: express.Response): Promise<express.Response | void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }

    const { status, type, page = 1, limit = 20 } = req.query;
    
    const query: any = { patientId: patient._id };
    if (status) query.status = status;
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(query);

    const alertsData = {
      alerts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    };

    res.status(200).json({ alerts: alertsData });
    return;
  } catch (error) {
    console.error('Patient alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/patient/alerts/:id/acknowledge
// @desc    Acknowledge an alert
// @access  Private (Patient)
router.put('/alerts/:id/acknowledge', async (req: any, res: express.Response): Promise<express.Response | void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }

    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, patientId: patient._id },
      {
        status: 'acknowledged',
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    res.status(200).json({ acknowledged: true });
    return;
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/chats
// @desc    Get patient chat history
// @access  Private (Patient)
router.get('/chats', async (req: any, res: express.Response): Promise<express.Response | void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }

    const chats = await Chat.find({ patientId: patient._id })
      .sort({ updatedAt: -1 })
      .populate('doctorId', 'firstName lastName specialization');

    res.status(200).json({ chats });
    return;
  } catch (error) {
    console.error('Patient chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/patient/chats
// @desc    Start a new chat session
// @access  Private (Patient)
router.post('/chats', async (req: any, res: express.Response): Promise<express.Response | void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }

    const { initialMessage } = req.body;

    const chat = new Chat({
      patientId: patient._id,
      messages: [{
        id: Date.now().toString(),
        type: 'user',
        content: initialMessage,
        timestamp: new Date()
      }],
      status: 'active',
      priority: 'medium',
      tags: []
    });

    await chat.save();

    res.status(201).json({ chat });
    return;
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check emergency conditions
function checkEmergencyConditions(vitals: any): boolean {
  const { heartRate, bloodPressure, temperature, oxygenSaturation } = vitals;
  
  // Critical thresholds
  if (heartRate > 120 || heartRate < 50) return true;
  if (bloodPressure.systolic > 180 || bloodPressure.diastolic > 110) return true;
  if (bloodPressure.systolic < 90 || bloodPressure.diastolic < 60) return true;
  if (temperature > 103 || temperature < 95) return true;
  if (oxygenSaturation < 90) return true;
  
  return false;
}

export default router;
