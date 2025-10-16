"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Employer_1 = __importDefault(require("../models/Employer"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Vitals_1 = __importDefault(require("../models/Vitals"));
const Alert_1 = __importDefault(require("../models/Alert"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use((0, auth_1.roleMiddleware)(['employer']));
router.get('/dashboard', async (req, res) => {
    try {
        const employer = await Employer_1.default.findOne({ userId: req.user._id });
        if (!employer) {
            return res.status(404).json({ message: 'Employer profile not found' });
        }
        const totalEmployees = await Patient_1.default.countDocuments({ isActive: true });
        const activeEmployees = await Patient_1.default.countDocuments({ isActive: true });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentVitals = await Vitals_1.default.find({
            timestamp: { $gte: sevenDaysAgo }
        }).populate('patientId');
        const activeAlerts = await Alert_1.default.find({
            status: 'active',
            createdAt: { $gte: sevenDaysAgo }
        }).populate('patientId');
        const healthIndex = calculateHealthIndex(recentVitals, activeAlerts);
        const departmentStats = await Patient_1.default.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);
        const riskFactors = await Alert_1.default.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        const productivityData = await calculateProductivityImpact(recentVitals, activeAlerts);
        const aiRecommendations = generateAIRecommendations(healthIndex, riskFactors, activeAlerts);
        res.json({
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
    }
    catch (error) {
        console.error('Employer dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/analytics', async (req, res) => {
    try {
        const { period = '7d', department, startDate, endDate } = req.query;
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - getPeriodMs(period));
        const vitalsQuery = {
            timestamp: { $gte: start, $lte: end }
        };
        const alertsQuery = {
            createdAt: { $gte: start, $lte: end }
        };
        if (department) {
            const patients = await Patient_1.default.find({ department, isActive: true });
            const patientIds = patients.map(p => p._id);
            vitalsQuery.patientId = { $in: patientIds };
            alertsQuery.patientId = { $in: patientIds };
        }
        const vitalsData = await Vitals_1.default.find(vitalsQuery)
            .populate('patientId')
            .sort({ timestamp: 1 });
        const alertsData = await Alert_1.default.find(alertsQuery)
            .populate('patientId')
            .sort({ createdAt: 1 });
        const trendData = generateTrendData(vitalsData, alertsData, start, end);
        const departmentBreakdown = await getDepartmentBreakdown(start, end);
        const riskAnalysis = await getRiskFactorAnalysis(alertsData);
        const predictedAbsenteeism = predictAbsenteeism(vitalsData, alertsData);
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
    }
    catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const { severity, type, status = 'active', page = 1, limit = 20 } = req.query;
        const query = { status };
        if (severity)
            query.severity = severity;
        if (type)
            query.type = type;
        const alerts = await Alert_1.default.find(query)
            .populate('patientId')
            .populate('patientId.userId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Alert_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('Employer alerts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/alerts/:id/respond', async (req, res) => {
    try {
        const { action, notes } = req.body;
        const alert = await Alert_1.default.findByIdAndUpdate(req.params.id, {
            $push: {
                actions: {
                    type: 'notification',
                    description: action || 'Alert acknowledged by employer',
                    executed: true,
                    executedAt: new Date(),
                    executedBy: req.user._id
                }
            }
        }, { new: true }).populate('patientId')
            .populate('patientId.userId', 'firstName lastName');
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        const io = req.app.get('io');
        io.emit('alert-response', {
            alertId: alert._id,
            action,
            employerId: req.user._id
        });
        res.json({
            success: true,
            data: alert
        });
    }
    catch (error) {
        console.error('Respond to alert error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/employees', async (req, res) => {
    try {
        const { department, riskLevel, page = 1, limit = 20 } = req.query;
        const query = { isActive: true };
        if (department)
            query.department = department;
        const employees = await Patient_1.default.find(query)
            .populate('userId', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const employeesWithHealthStatus = await Promise.all(employees.map(async (employee) => {
            const latestVitals = await Vitals_1.default.findOne({ patientId: employee._id })
                .sort({ timestamp: -1 });
            const activeAlerts = await Alert_1.default.find({
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
        }));
        const filteredEmployees = riskLevel
            ? employeesWithHealthStatus.filter(emp => emp.riskLevel === riskLevel)
            : employeesWithHealthStatus;
        const total = await Patient_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('Employees overview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
function getPeriodMs(period) {
    const periods = {
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
    };
    return periods[period] || periods['7d'];
}
function calculateHealthIndex(vitals, alerts) {
    if (vitals.length === 0)
        return 100;
    let totalScore = 0;
    let count = 0;
    vitals.forEach(vital => {
        let score = 100;
        if (vital.heartRate > 100 || vital.heartRate < 60)
            score -= 20;
        if (vital.bloodPressure.systolic > 140 || vital.bloodPressure.diastolic > 90)
            score -= 25;
        if (vital.temperature > 100)
            score -= 30;
        if (vital.oxygenSaturation < 95)
            score -= 35;
        totalScore += Math.max(score, 0);
        count++;
    });
    const alertPenalty = alerts.length * 10;
    const avgScore = count > 0 ? totalScore / count : 100;
    return Math.max(avgScore - alertPenalty, 0);
}
function calculateProductivityImpact(vitals, alerts) {
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
function generateAIRecommendations(healthIndex, riskFactors, alerts) {
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
function generateTrendData(vitals, alerts, start, end) {
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const trendData = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const dayVitals = vitals.filter(v => v.timestamp >= dayStart && v.timestamp <= dayEnd);
        const dayAlerts = alerts.filter(a => a.createdAt >= dayStart && a.createdAt <= dayEnd);
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
async function getDepartmentBreakdown(start, end) {
    return await Patient_1.default.aggregate([
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
function getRiskFactorAnalysis(alerts) {
    const riskFactors = alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
    }, {});
    const total = alerts.length;
    const distribution = Object.entries(riskFactors).map(([type, count]) => ({
        name: type.replace('_', ' ').toUpperCase(),
        value: count,
        percentage: total > 0 ? (count / total) * 100 : 0
    }));
    return {
        distribution,
        topRiskFactor: distribution.reduce((max, current) => current.value > max.value ? current : max, { name: '', value: 0, percentage: 0 })
    };
}
function predictAbsenteeism(vitals, alerts) {
    const riskScore = calculateHealthIndex(vitals, alerts);
    const incidentRate = alerts.length / Math.max(vitals.length, 1);
    let predictedAbsenteeism = 5;
    if (riskScore < 60)
        predictedAbsenteeism += 15;
    if (incidentRate > 0.1)
        predictedAbsenteeism += 10;
    if (alerts.some(a => a.severity === 'critical'))
        predictedAbsenteeism += 20;
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
function calculateROI(alerts, vitals) {
    const totalEmployees = new Set(vitals.map(v => v.patientId)).size;
    const incidentsPrevented = Math.max(alerts.length * 0.7, 0);
    const healthcareCostReduction = incidentsPrevented * 500;
    const productivityImprovement = totalEmployees * 50;
    const totalMonthlySavings = healthcareCostReduction + productivityImprovement;
    const systemCost = 10000;
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
function calculateEmployeeRiskLevel(vitals, alerts) {
    if (!vitals && alerts.length === 0)
        return 'low';
    let riskScore = 0;
    if (vitals) {
        if (vitals.heartRate > 100 || vitals.heartRate < 60)
            riskScore += 2;
        if (vitals.bloodPressure.systolic > 140 || vitals.bloodPressure.diastolic > 90)
            riskScore += 2;
        if (vitals.temperature > 100)
            riskScore += 3;
        if (vitals.oxygenSaturation < 95)
            riskScore += 3;
    }
    riskScore += alerts.filter(a => a.severity === 'critical').length * 3;
    riskScore += alerts.filter(a => a.severity === 'high').length * 2;
    riskScore += alerts.filter(a => a.severity === 'medium').length * 1;
    if (riskScore >= 8)
        return 'high';
    if (riskScore >= 4)
        return 'medium';
    return 'low';
}
exports.default = router;
//# sourceMappingURL=employer.js.map