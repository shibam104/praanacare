import express from 'express';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Vitals from '../models/Vitals';
import Alert from '../models/Alert';
import Chat from '../models/Chat';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authentication and role middleware
router.use(authMiddleware);
router.use(roleMiddleware(['doctor']));

// @route   GET /api/doctor/dashboard
// @desc    Get doctor dashboard data
// @access  Private (Doctor)
router.get('/dashboard', async (req: any, res: express.Response): Promise<void> => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      res.status(404).json({ message: 'Doctor profile not found' });
      return;
    }

    // Get patients by urgency
    const patients = await Patient.find({ isActive: true })
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    // Get urgent alerts
    const urgentAlerts = await Alert.find({
      severity: { $in: ['high', 'critical'] },
      status: 'active'
    })
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get today's consultations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysConsultations = await Chat.find({
      doctorId: doctor._id,
      status: 'active',
      createdAt: { $gte: today, $lt: tomorrow }
    })
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get statistics
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const activeAlerts = await Alert.countDocuments({ status: 'active' });
    const urgentCases = await Alert.countDocuments({ 
      severity: { $in: ['high', 'critical'] },
      status: 'active'
    });

    const dashboard = {
      doctor,
      patients,
      urgentAlerts,
      todaysConsultations,
      statistics: {
        totalPatients,
        activeAlerts,
        urgentCases
      }
    };

    res.status(200).json({ dashboard });
    return;
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctor/patients
// @desc    Get all patients with their latest vitals
// @access  Private (Doctor)
router.get('/patients', async (req: any, res) => {
  try {
    const { urgency, department, page = 1, limit = 20 } = req.query;

    const query: any = { isActive: true };
    if (department) query.department = department;

    const patients = await Patient.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get latest vitals for each patient
    const patientsWithVitals = await Promise.all(
      patients.map(async (patient) => {
        const latestVitals = await Vitals.findOne({ patientId: patient._id })
          .sort({ timestamp: -1 });
        
        const activeAlerts = await Alert.find({
          patientId: patient._id,
          status: 'active'
        });

        // Calculate urgency based on vitals and alerts
        let urgencyLevel = 'low';
        if (latestVitals) {
          if (latestVitals.isEmergency) {
            urgencyLevel = 'high';
          } else if (activeAlerts.some(alert => alert.severity === 'high')) {
            urgencyLevel = 'high';
          } else if (activeAlerts.some(alert => alert.severity === 'medium')) {
            urgencyLevel = 'medium';
          }
        }

        return {
          ...patient.toObject(),
          latestVitals,
          activeAlerts,
          urgency: urgencyLevel
        };
      })
    );

    // Filter by urgency if specified
    const filteredPatients = urgency 
      ? patientsWithVitals.filter(p => p.urgency === urgency)
      : patientsWithVitals;

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: {
        patients: filteredPatients,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Doctor patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctor/patients/:id
// @desc    Get detailed patient information
// @access  Private (Doctor)
router.get('/patients/:id', async (req: any, res: express.Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone');

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    // Get vitals history
    const vitalsHistory = await Vitals.find({ patientId: patient._id })
      .sort({ timestamp: -1 })
      .limit(50);

    // Get alerts history
    const alertsHistory = await Alert.find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get chat history
    const chatHistory = await Chat.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ updatedAt: -1 });

    // Get latest vitals
    const latestVitals = vitalsHistory[0];

    // AI analysis summary (mock data for now)
    const aiSummary = generateAISummary(patient, latestVitals, alertsHistory);

    res.status(200).json({ patient });
    return;
  } catch (error) {
    console.error('Patient details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/doctor/alerts/:id/approve
// @desc    Approve AI treatment recommendation
// @access  Private (Doctor)
router.put('/alerts/:id/approve', async (req: any, res: express.Response): Promise<void> => {
  try {
    const { treatmentPlan, notes } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        $push: {
          actions: {
            type: 'consultation',
            description: treatmentPlan || 'Treatment approved by doctor',
            executed: true,
            executedAt: new Date(),
            executedBy: req.user._id
          }
        }
      },
      { new: true }
    ).populate('patientId')
     .populate('patientId.userId', 'firstName lastName');

    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('alert-updated', {
      alertId: alert._id,
      status: 'resolved',
      patientId: alert.patientId._id
    });

    res.status(200).json({ success: true });
    return;
  } catch (error) {
    console.error('Approve treatment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/doctor/consultations
// @desc    Start a consultation with a patient
// @access  Private (Doctor)
router.post('/consultations', async (req: any, res: express.Response): Promise<void> => {
  try {
    const { patientId, type, priority = 'medium' } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      res.status(404).json({ message: 'Doctor profile not found' });
      return;
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    // Create or update chat session
    let chat = await Chat.findOne({
      patientId: patient._id,
      doctorId: doctor._id,
      status: 'active'
    });

    if (!chat) {
      chat = new Chat({
        patientId: patient._id,
        doctorId: doctor._id,
        messages: [],
        status: 'active',
        priority,
        tags: [type]
      });
    }

    await chat.save();

    res.status(201).json({ consultation });
    return;
  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctor/schedule
// @desc    Get doctor's schedule
// @access  Private (Doctor)
router.get('/schedule', async (req: any, res: express.Response): Promise<void> => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      res.status(404).json({ message: 'Doctor profile not found' });
      return;
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get consultations for the day
    const consultations = await Chat.find({
      doctorId: doctor._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.status(200).json({ schedule });
    return;
  } catch (error) {
    console.error('Doctor schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate AI summary
function generateAISummary(patient: any, latestVitals: any, alertsHistory: any[]) {
  if (!latestVitals) {
    return {
      riskScore: 0,
      summary: 'No recent vitals data available',
      recommendations: ['Schedule regular health monitoring']
    };
  }

  const { heartRate, bloodPressure, temperature, oxygenSaturation } = latestVitals;
  
  let riskScore = 0;
  let concerns = [];
  let recommendations = [];

  // Analyze vitals
  if (heartRate > 100) {
    riskScore += 20;
    concerns.push('Elevated heart rate');
    recommendations.push('Monitor for stress or dehydration');
  }
  
  if (bloodPressure.systolic > 140 || bloodPressure.diastolic > 90) {
    riskScore += 25;
    concerns.push('High blood pressure');
    recommendations.push('Consider medication review');
  }
  
  if (temperature > 100) {
    riskScore += 30;
    concerns.push('Elevated temperature');
    recommendations.push('Monitor for infection or heat stress');
  }
  
  if (oxygenSaturation < 95) {
    riskScore += 35;
    concerns.push('Low oxygen saturation');
    recommendations.push('Immediate medical attention required');
  }

  // Analyze recent alerts
  const recentCriticalAlerts = alertsHistory.filter(alert => 
    alert.severity === 'critical' && 
    alert.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  if (recentCriticalAlerts.length > 0) {
    riskScore += 40;
    concerns.push('Recent critical alerts');
    recommendations.push('Urgent medical evaluation recommended');
  }

  return {
    riskScore: Math.min(riskScore, 100),
    summary: concerns.length > 0 
      ? `Patient shows ${concerns.join(', ')}. Risk level: ${riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low'}`
      : 'Patient vitals are within normal ranges',
    recommendations,
    concerns
  };
}

export default router;
