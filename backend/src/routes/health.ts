import express from 'express';
import Vitals from '../models/Vitals';
import Alert from '../models/Alert';
import Patient from '../models/Patient';
import { authMiddleware } from '../middleware/auth';
import { validateVitals, validateRequest } from '../middleware/validation';

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

// @route   GET /api/health/vitals/realtime
// @desc    Get real-time vitals data
// @access  Private
router.get('/vitals/realtime', async (req: any, res: express.Response): Promise<void> => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Get latest vitals for the patient
    const latestVitals = await Vitals.findOne({ patientId })
      .sort({ timestamp: -1 });

    if (!latestVitals) {
      return res.status(404).json({ message: 'No vitals data found' });
    }

    // Get recent vitals for trend analysis
    const recentVitals = await Vitals.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Calculate trends
    const trends = calculateVitalsTrends(recentVitals);

    res.status(200).json({
      success: true,
      data: {
        current: latestVitals,
        trends,
        timestamp: new Date()
      }
    });
    return;
  } catch (error) {
    console.error('Real-time vitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/health/vitals/stream
// @desc    Stream vitals data (for IoT devices)
// @access  Private
router.post('/vitals/stream', validateVitals, validateRequest, async (req: any, res: express.Response): Promise<void> => {
  try {
    const vitalsData = req.body;
    
    // Validate patient exists
    const patient = await Patient.findById(vitalsData.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create vitals record
    const vitals = new Vitals({
      ...vitalsData,
      recordedBy: 'device'
    });

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
        description: 'Critical vitals detected from IoT device',
        vitalsData: {
          heartRate: vitals.heartRate,
          bloodPressure: vitals.bloodPressure,
          temperature: vitals.temperature,
          oxygenSaturation: vitals.oxygenSaturation
        },
        status: 'active'
      });
      await alert.save();

      // Emit real-time alert
      const io = req.app.get('io');
      io.emit('emergency-alert', {
        patientId: patient._id,
        alertId: alert._id,
        severity: 'critical',
        source: 'iot_device'
      });
    }

    // Emit real-time vitals update
    const io = req.app.get('io');
    io.emit('vitals-update', {
      patientId: patient._id,
      vitals: vitals,
      isEmergency
    });

    res.status(200).json({
      success: true,
      data: vitals,
      isEmergency
    });
    return;
  } catch (error) {
    console.error('Stream vitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/health/alerts/active
// @desc    Get active health alerts
// @access  Private
router.get('/alerts/active', async (req: any, res) => {
  try {
    const { severity, type, patientId } = req.query;

    const query: any = { status: 'active' };
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (patientId) query.patientId = patientId;

    const alerts = await Alert.find(query)
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Active alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/health/analytics/overview
// @desc    Get health analytics overview
// @access  Private
router.get('/analytics/overview', async (req: any, res) => {
  try {
    const { period = '7d', department } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - getPeriodMs(period));

    // Build query
    const query: any = {
      timestamp: { $gte: startDate, $lte: endDate }
    };

    if (department) {
      const patients = await Patient.find({ department, isActive: true });
      const patientIds = patients.map(p => p._id);
      query.patientId = { $in: patientIds };
    }

    // Get vitals data
    const vitalsData = await Vitals.find(query).populate('patientId');
    
    // Get alerts data
    const alertsData = await Alert.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('patientId');

    // Calculate analytics
    const analytics = calculateHealthAnalytics(vitalsData, alertsData, period);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Health analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/health/trends
// @desc    Get health trends data
// @access  Private
router.get('/trends', async (req: any, res) => {
  try {
    const { period = '30d', patientId, department } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - getPeriodMs(period));

    // Build query
    const query: any = {
      timestamp: { $gte: startDate, $lte: endDate }
    };

    if (patientId) {
      query.patientId = patientId;
    } else if (department) {
      const patients = await Patient.find({ department, isActive: true });
      const patientIds = patients.map(p => p._id);
      query.patientId = { $in: patientIds };
    }

    // Get vitals data
    const vitalsData = await Vitals.find(query)
      .populate('patientId')
      .sort({ timestamp: 1 });

    // Generate trend data
    const trends = generateTrendData(vitalsData, startDate, endDate);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Health trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/health/risk-assessment
// @desc    Perform health risk assessment
// @access  Private
router.post('/risk-assessment', async (req: any, res: express.Response): Promise<void> => {
  try {
    const { patientId, vitalsData, environmentalData } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Get patient data
    const patient = await Patient.findById(patientId).populate('userId', 'firstName lastName');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get historical data
    const historicalVitals = await Vitals.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(20);

    const recentAlerts = await Alert.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Perform risk assessment
    const assessment = performRiskAssessment(
      vitalsData,
      environmentalData,
      historicalVitals,
      recentAlerts,
      patient
    );

    // Calculate risk distribution
    const alerts = recentAlerts.filter(alert => alert.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000));
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    alerts.forEach((alert: any) => {
      const key = alert.severity as keyof typeof riskDistribution;
      if (key in riskDistribution) {
        riskDistribution[key]++;
      }
    });

    res.status(200).json({ riskDistribution });
    return;
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/health/emergency-status
// @desc    Get emergency status for all patients
// @access  Private
router.get('/emergency-status', async (req: any, res) => {
  try {
    // Get all active emergency alerts
    const emergencyAlerts = await Alert.find({
      severity: 'critical',
      status: 'active'
    })
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get patients with critical vitals
    const criticalVitals = await Vitals.find({
      isEmergency: true,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    })
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: {
        emergencyAlerts,
        criticalVitals,
        totalEmergencies: emergencyAlerts.length + criticalVitals.length,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Emergency status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function calculateVitalsTrends(vitals: any[]): any {
  if (vitals.length < 2) {
    return {
      heartRate: { trend: 'stable', change: 0 },
      bloodPressure: { trend: 'stable', change: 0 },
      temperature: { trend: 'stable', change: 0 },
      oxygenSaturation: { trend: 'stable', change: 0 }
    };
  }

  const latest = vitals[0];
  const previous = vitals[1];

  return {
    heartRate: {
      trend: latest.heartRate > previous.heartRate ? 'increasing' : 
             latest.heartRate < previous.heartRate ? 'decreasing' : 'stable',
      change: latest.heartRate - previous.heartRate
    },
    bloodPressure: {
      trend: latest.bloodPressure.systolic > previous.bloodPressure.systolic ? 'increasing' : 
             latest.bloodPressure.systolic < previous.bloodPressure.systolic ? 'decreasing' : 'stable',
      change: latest.bloodPressure.systolic - previous.bloodPressure.systolic
    },
    temperature: {
      trend: latest.temperature > previous.temperature ? 'increasing' : 
             latest.temperature < previous.temperature ? 'decreasing' : 'stable',
      change: latest.temperature - previous.temperature
    },
    oxygenSaturation: {
      trend: latest.oxygenSaturation > previous.oxygenSaturation ? 'increasing' : 
             latest.oxygenSaturation < previous.oxygenSaturation ? 'decreasing' : 'stable',
      change: latest.oxygenSaturation - previous.oxygenSaturation
    }
  };
}

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

function getPeriodMs(period: string): number {
  const periods: { [key: string]: number } = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  return periods[period] || periods['7d'];
}

function calculateHealthAnalytics(vitalsData: any[], alertsData: any[], period: string): any {
  const totalVitals = vitalsData.length;
  const totalAlerts = alertsData.length;
  const uniquePatients = new Set(vitalsData.map(v => v.patientId)).size;

  // Calculate health index
  const healthIndex = calculateOverallHealthIndex(vitalsData, alertsData);

  // Calculate risk distribution
  const riskDistribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  alertsData.forEach(alert => {
    riskDistribution[alert.severity]++;
  });

  // Calculate trend
  const trend = calculateTrend(vitalsData, alertsData);

  // Calculate top risk factors
  const riskFactors = alertsData.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {});

  const topRiskFactors = Object.entries(riskFactors)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return {
    period,
    summary: {
      totalVitals,
      totalAlerts,
      uniquePatients,
      healthIndex,
      trend
    },
    riskDistribution,
    topRiskFactors,
    recommendations: generateHealthRecommendations(healthIndex, riskFactors)
  };
}

function calculateOverallHealthIndex(vitalsData: any[], alertsData: any[]): number {
  if (vitalsData.length === 0) return 100;
  
  let totalScore = 0;
  let count = 0;
  
  vitalsData.forEach(vital => {
    let score = 100;
    
    if (vital.heartRate > 100 || vital.heartRate < 60) score -= 20;
    if (vital.bloodPressure.systolic > 140 || vital.bloodPressure.diastolic > 90) score -= 25;
    if (vital.temperature > 100) score -= 30;
    if (vital.oxygenSaturation < 95) score -= 35;
    
    totalScore += Math.max(score, 0);
    count++;
  });
  
  const alertPenalty = alertsData.length * 5;
  const avgScore = count > 0 ? totalScore / count : 100;
  
  return Math.max(avgScore - alertPenalty, 0);
}

function calculateTrend(vitalsData: any[], alertsData: any[]): string {
  if (vitalsData.length < 2) return 'stable';
  
  const recent = vitalsData.slice(0, Math.floor(vitalsData.length / 2));
  const older = vitalsData.slice(Math.floor(vitalsData.length / 2));
  
  const recentHealthIndex = calculateOverallHealthIndex(recent, alertsData);
  const olderHealthIndex = calculateOverallHealthIndex(older, alertsData);
  
  const difference = recentHealthIndex - olderHealthIndex;
  
  if (difference > 10) return 'improving';
  if (difference < -10) return 'declining';
  return 'stable';
}

function generateHealthRecommendations(healthIndex: number, riskFactors: any): string[] {
  const recommendations = [];
  
  if (healthIndex < 70) {
    recommendations.push('Implement enhanced health monitoring protocols');
    recommendations.push('Increase frequency of health check-ups');
  }
  
  if (riskFactors.heat_stress > 5) {
    recommendations.push('Improve workplace cooling and hydration facilities');
  }
  
  if (riskFactors.fatigue > 3) {
    recommendations.push('Optimize work schedules and break patterns');
  }
  
  if (riskFactors.respiratory > 2) {
    recommendations.push('Enhance air quality monitoring and filtration');
  }
  
  return recommendations;
}

function generateTrendData(vitalsData: any[], startDate: Date, endDate: Date): any[] {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const trendData = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayVitals = vitalsData.filter(v => 
      v.timestamp >= dayStart && v.timestamp <= dayEnd
    );

    if (dayVitals.length > 0) {
      const avgHeartRate = dayVitals.reduce((sum, v) => sum + v.heartRate, 0) / dayVitals.length;
      const avgBP = dayVitals.reduce((sum, v) => sum + v.bloodPressure.systolic, 0) / dayVitals.length;
      const avgTemp = dayVitals.reduce((sum, v) => sum + v.temperature, 0) / dayVitals.length;
      const avgO2Sat = dayVitals.reduce((sum, v) => sum + v.oxygenSaturation, 0) / dayVitals.length;

      trendData.push({
        date: date.toISOString().split('T')[0],
        heartRate: Math.round(avgHeartRate),
        bloodPressure: Math.round(avgBP),
        temperature: Math.round(avgTemp * 10) / 10,
        oxygenSaturation: Math.round(avgO2Sat),
        readings: dayVitals.length
      });
    }
  }

  return trendData;
}

function performRiskAssessment(
  vitalsData: any,
  environmentalData: any,
  historicalVitals: any[],
  recentAlerts: any[],
  patient: any
): any {
  let riskScore = 0;
  const riskFactors = [];
  const recommendations = [];

  // Analyze current vitals
  if (vitalsData) {
    const { heartRate, bloodPressure, temperature, oxygenSaturation } = vitalsData;
    
    if (heartRate > 100) {
      riskScore += 20;
      riskFactors.push('Elevated heart rate');
    }
    
    if (bloodPressure.systolic > 140 || bloodPressure.diastolic > 90) {
      riskScore += 25;
      riskFactors.push('High blood pressure');
    }
    
    if (temperature > 100) {
      riskScore += 30;
      riskFactors.push('Elevated temperature');
    }
    
    if (oxygenSaturation < 95) {
      riskScore += 35;
      riskFactors.push('Low oxygen saturation');
    }
  }

  // Analyze environmental factors
  if (environmentalData) {
    const { ambientTemperature, humidity, airQuality } = environmentalData;
    
    if (ambientTemperature > 35) {
      riskScore += 15;
      riskFactors.push('High ambient temperature');
      recommendations.push('Implement cooling measures');
    }
    
    if (humidity > 80) {
      riskScore += 10;
      riskFactors.push('High humidity');
    }
    
    if (airQuality > 150) {
      riskScore += 20;
      riskFactors.push('Poor air quality');
      recommendations.push('Improve ventilation');
    }
  }

  // Analyze historical patterns
  if (historicalVitals.length > 0) {
    const recentTrend = calculateVitalsTrends(historicalVitals.slice(0, 5));
    
    if (recentTrend.heartRate.trend === 'increasing') {
      riskScore += 10;
      riskFactors.push('Increasing heart rate trend');
    }
    
    if (recentTrend.temperature.trend === 'increasing') {
      riskScore += 15;
      riskFactors.push('Increasing temperature trend');
    }
  }

  // Analyze recent alerts
  const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical');
  const highAlerts = recentAlerts.filter(a => a.severity === 'high');
  
  riskScore += criticalAlerts.length * 25;
  riskScore += highAlerts.length * 15;

  // Generate recommendations based on risk factors
  if (riskFactors.includes('Elevated heart rate')) {
    recommendations.push('Monitor for stress and dehydration');
  }
  
  if (riskFactors.includes('High blood pressure')) {
    recommendations.push('Consider medication review');
  }
  
  if (riskFactors.includes('Elevated temperature')) {
    recommendations.push('Monitor for infection or heat stress');
  }
  
  if (riskFactors.includes('Low oxygen saturation')) {
    recommendations.push('Immediate medical attention required');
  }

  // Determine risk level
  let riskLevel = 'low';
  if (riskScore > 80) riskLevel = 'critical';
  else if (riskScore > 60) riskLevel = 'high';
  else if (riskScore > 40) riskLevel = 'medium';

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    riskFactors,
    recommendations,
    assessment: {
      patient: {
        name: `${patient.userId.firstName} ${patient.userId.lastName}`,
        department: patient.department,
        shift: patient.shift
      },
      timestamp: new Date(),
      confidence: calculateAssessmentConfidence(historicalVitals.length, recentAlerts.length)
    }
  };
}

function calculateAssessmentConfidence(historicalDataPoints: number, alertCount: number): number {
  let confidence = 50; // Base confidence
  
  if (historicalDataPoints > 10) confidence += 20;
  else if (historicalDataPoints > 5) confidence += 10;
  
  if (alertCount > 0) confidence += 15;
  
  return Math.min(confidence, 95);
}

export default router;

