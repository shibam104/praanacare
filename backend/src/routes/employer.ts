import express from 'express';
import Employer from '../models/Employer';
import Patient from '../models/Patient';
import Vitals from '../models/Vitals';
import Alert from '../models/Alert';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authentication and role middleware
router.use(authMiddleware);
router.use(roleMiddleware(['employer']));

// @route   GET /api/employer/dashboard
// @desc    Get employer dashboard analytics
// @access  Private (Employer)
router.get('/dashboard', async (req: any, res: express.Response): Promise<void> => {
  try {
    const employer = await Employer.findOne({ userId: req.user._id });
    if (!employer) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    // Get workforce statistics
    const totalEmployees = await Patient.countDocuments({ isActive: true });
    const activeEmployees = await Patient.countDocuments({ isActive: true });

    // Get health risk metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVitals = await Vitals.find({
      timestamp: { $gte: sevenDaysAgo }
    }).populate('patientId');

    const activeAlerts = await Alert.find({
      status: 'active',
      createdAt: { $gte: sevenDaysAgo }
    }).populate('patientId');

    // Calculate health index
    const healthIndex = calculateHealthIndex(recentVitals, activeAlerts);

    // Get department-wise analytics
    const departmentStats = await Patient.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Get risk factor distribution
    const riskFactors = await Alert.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get productivity impact data
    const productivityData = await calculateProductivityImpact(recentVitals, activeAlerts);

    // Get AI recommendations
    const aiRecommendations = generateAIRecommendations(healthIndex, riskFactors, activeAlerts);

    res.status(200).json({
      success: true,
      data: {
        employer,
        statistics: {
          totalEmployees,
          activeEmployees,
          healthIndex,
          dailyIncidents: activeAlerts.length,
          avgProductivity: productivityData.avgProductivity
        },
        departmentStats,
        riskFactors,
        productivityData,
        aiRecommendations,
        recentAlerts: activeAlerts.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Employer dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employer/analytics
// @desc    Get detailed analytics data
// @access  Private (Employer)
router.get('/analytics', async (req: any, res) => {
  try {
    const { period = '7d', department, startDate, endDate } = req.query;

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - getPeriodMs(period));

    // Build query for vitals
    const vitalsQuery: any = {
      timestamp: { $gte: start, $lte: end }
    };

    // Build query for alerts
    const alertsQuery: any = {
      createdAt: { $gte: start, $lte: end }
    };

    // Add department filter if specified
    if (department) {
      const patients = await Patient.find({ department, isActive: true });
      const patientIds = patients.map(p => p._id);
      
      vitalsQuery.patientId = { $in: patientIds };
      alertsQuery.patientId = { $in: patientIds };
    }

    // Get vitals data for trend analysis
    const vitalsData = await Vitals.find(vitalsQuery)
      .populate('patientId')
      .sort({ timestamp: 1 });

    // Get alerts data
    const alertsData = await Alert.find(alertsQuery)
      .populate('patientId')
      .sort({ createdAt: 1 });

    // Generate trend data
    const trendData = generateTrendData(vitalsData, alertsData, start, end);

    // Get department-wise breakdown
    const departmentBreakdown = await getDepartmentBreakdown(start, end);

    // Get risk factor analysis
    const riskAnalysis = await getRiskFactorAnalysis(alertsData);

    // Get predicted absenteeism
    const predictedAbsenteeism = predictAbsenteeism(vitalsData, alertsData);

    // Get ROI analysis
    const roiAnalysis = calculateROI(alertsData, vitalsData);

    res.json({
      success: true,
      data: {
        period: { start, end },
        trendData,
        departmentBreakdown,
        riskAnalysis,
        predictedAbsenteeism,
        roiAnalysis
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employer/alerts
// @desc    Get active risk alerts
// @access  Private (Employer)
router.get('/alerts', async (req: any, res) => {
  try {
    const { severity, type, status = 'active', page = 1, limit = 20 } = req.query;

    const query: any = { status };
    if (severity) query.severity = severity;
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Employer alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/employer/alerts/:id/respond
// @desc    Respond to an alert
// @access  Private (Employer)
router.put('/alerts/:id/respond', async (req: any, res: express.Response): Promise<void> => {
  try {
    const { action, notes } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          actions: {
            type: 'notification',
            description: action || 'Alert acknowledged by employer',
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
    io.emit('alert-response', {
      alertId: alert._id,
      action,
      employerId: req.user._id
    });

    res.status(200).json({ success: true });
    return;
  } catch (error) {
    console.error('Respond to alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employer/employees
// @desc    Get employee health overview
// @access  Private (Employer)
router.get('/employees', async (req: any, res) => {
  try {
    const { department, riskLevel, page = 1, limit = 20 } = req.query;

    const query: any = { isActive: true };
    if (department) query.department = department;

    const employees = await Patient.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get health status for each employee
    const employeesWithHealthStatus = await Promise.all(
      employees.map(async (employee) => {
        const latestVitals = await Vitals.findOne({ patientId: employee._id })
          .sort({ timestamp: -1 });

        const activeAlerts = await Alert.find({
          patientId: employee._id,
          status: 'active'
        });

        const riskLevel = calculateEmployeeRiskLevel(latestVitals, activeAlerts);

        return {
          ...employee.toObject(),
          latestVitals,
          activeAlerts,
          riskLevel
        };
      })
    );

    // Filter by risk level if specified
    const filteredEmployees = riskLevel 
      ? employeesWithHealthStatus.filter(emp => emp.riskLevel === riskLevel)
      : employeesWithHealthStatus;

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: {
        employees: filteredEmployees,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Employees overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function getPeriodMs(period: string): number {
  const periods: { [key: string]: number } = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  return periods[period] || periods['7d'];
}

function calculateHealthIndex(vitals: any[], alerts: any[]): number {
  if (vitals.length === 0) return 100;

  let totalScore = 0;
  let count = 0;

  vitals.forEach(vital => {
    let score = 100;
    
    // Deduct points for abnormal vitals
    if (vital.heartRate > 100 || vital.heartRate < 60) score -= 20;
    if (vital.bloodPressure.systolic > 140 || vital.bloodPressure.diastolic > 90) score -= 25;
    if (vital.temperature > 100) score -= 30;
    if (vital.oxygenSaturation < 95) score -= 35;

    totalScore += Math.max(score, 0);
    count++;
  });

  // Deduct points for alerts
  const alertPenalty = alerts.length * 10;
  const avgScore = count > 0 ? totalScore / count : 100;

  return Math.max(avgScore - alertPenalty, 0);
}

function calculateProductivityImpact(vitals: any[], alerts: any[]): any {
  const totalEmployees = new Set(vitals.map(v => v.patientId)).size;
  const affectedEmployees = new Set(alerts.map(a => a.patientId)).size;
  
  const impactPercentage = totalEmployees > 0 ? (affectedEmployees / totalEmployees) * 100 : 0;
  const avgProductivity = Math.max(100 - impactPercentage, 0);

  return {
    totalEmployees,
    affectedEmployees,
    impactPercentage,
    avgProductivity
  };
}

function generateAIRecommendations(healthIndex: number, riskFactors: any[], alerts: any[]): any[] {
  const recommendations = [];

  if (healthIndex < 70) {
    recommendations.push({
      type: 'high',
      title: 'Improve Workplace Health Conditions',
      description: 'Health index is below optimal levels. Consider implementing additional safety measures.',
      impact: 'High',
      cost: '$5,000',
      roi: '6 months'
    });
  }

  if (riskFactors.some(rf => rf._id === 'heat_stress' && rf.count > 5)) {
    recommendations.push({
      type: 'medium',
      title: 'Increase Hydration Stations',
      description: 'High number of heat stress incidents detected. Add more hydration stations.',
      impact: 'Medium',
      cost: '$2,400',
      roi: '3 months'
    });
  }

  if (alerts.length > 10) {
    recommendations.push({
      type: 'high',
      title: 'Implement Staggered Break Schedules',
      description: 'High incident rate detected. Implement cooling breaks every 2 hours.',
      impact: 'High',
      cost: '$0',
      roi: 'Immediate'
    });
  }

  return recommendations;
}

function generateTrendData(vitals: any[], alerts: any[], start: Date, end: Date): any[] {
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const trendData = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayVitals = vitals.filter(v => 
      v.timestamp >= dayStart && v.timestamp <= dayEnd
    );
    const dayAlerts = alerts.filter(a => 
      a.createdAt >= dayStart && a.createdAt <= dayEnd
    );

    const healthIndex = calculateHealthIndex(dayVitals, dayAlerts);

    trendData.push({
      date: date.toISOString().split('T')[0],
      healthIndex,
      incidents: dayAlerts.length,
      vitalsRecorded: dayVitals.length
    });
  }

  return trendData;
}

async function getDepartmentBreakdown(start: Date, end: Date): Promise<any[]> {
  return await Patient.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'vitals',
        localField: '_id',
        foreignField: 'patientId',
        as: 'vitals'
      }
    },
    {
      $lookup: {
        from: 'alerts',
        localField: '_id',
        foreignField: 'patientId',
        as: 'alerts'
      }
    },
    {
      $group: {
        _id: '$department',
        employeeCount: { $sum: 1 },
        avgHealthIndex: { $avg: '$healthIndex' },
        totalAlerts: { $sum: { $size: '$alerts' } }
      }
    }
  ]);
}

function getRiskFactorAnalysis(alerts: any[]): any {
  const riskFactors = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {});

  const total = alerts.length;
  const distribution = Object.entries(riskFactors).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count as number,
    percentage: total > 0 ? ((count as number) / total) * 100 : 0
  }));

  return {
    distribution,
    topRiskFactor: distribution.reduce((max, current) => 
      current.value > max.value ? current : max, { name: '', value: 0, percentage: 0 }
    )
  };
}

function predictAbsenteeism(vitals: any[], alerts: any[]): any {
  const riskScore = calculateHealthIndex(vitals, alerts);
  const incidentRate = alerts.length / Math.max(vitals.length, 1);

  let predictedAbsenteeism = 5; // Base 5%
  
  if (riskScore < 60) predictedAbsenteeism += 15;
  if (incidentRate > 0.1) predictedAbsenteeism += 10;
  if (alerts.some(a => a.severity === 'critical')) predictedAbsenteeism += 20;

  return {
    next7Days: Math.min(predictedAbsenteeism, 25),
    next30Days: Math.min(predictedAbsenteeism * 1.5, 35),
    factors: {
      healthIndex: riskScore,
      incidentRate,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length
    }
  };
}

function calculateROI(alerts: any[], vitals: any[]): any {
  const totalEmployees = new Set(vitals.map(v => v.patientId)).size;
  const incidentsPrevented = Math.max(alerts.length * 0.7, 0); // Assume 70% prevention rate
  
  const healthcareCostReduction = incidentsPrevented * 500; // $500 per incident
  const productivityImprovement = totalEmployees * 50; // $50 per employee per month
  
  const totalMonthlySavings = healthcareCostReduction + productivityImprovement;
  const systemCost = 10000; // Monthly system cost
  
  const roi = ((totalMonthlySavings - systemCost) / systemCost) * 100;

  return {
    healthcareCostReduction,
    productivityImprovement,
    totalMonthlySavings,
    systemCost,
    roi: Math.round(roi),
    paybackPeriod: Math.ceil(systemCost / totalMonthlySavings)
  };
}

function calculateEmployeeRiskLevel(vitals: any, alerts: any[]): string {
  if (!vitals && alerts.length === 0) return 'low';
  
  let riskScore = 0;
  
  if (vitals) {
    if (vitals.heartRate > 100 || vitals.heartRate < 60) riskScore += 2;
    if (vitals.bloodPressure.systolic > 140 || vitals.bloodPressure.diastolic > 90) riskScore += 2;
    if (vitals.temperature > 100) riskScore += 3;
    if (vitals.oxygenSaturation < 95) riskScore += 3;
  }
  
  riskScore += alerts.filter(a => a.severity === 'critical').length * 3;
  riskScore += alerts.filter(a => a.severity === 'high').length * 2;
  riskScore += alerts.filter(a => a.severity === 'medium').length * 1;
  
  if (riskScore >= 8) return 'high';
  if (riskScore >= 4) return 'medium';
  return 'low';
}

export default router;
