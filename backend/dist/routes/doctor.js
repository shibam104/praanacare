"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Vitals_1 = __importDefault(require("../models/Vitals"));
const Alert_1 = __importDefault(require("../models/Alert"));
const Chat_1 = __importDefault(require("../models/Chat"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use((0, auth_1.roleMiddleware)(['doctor']));
router.get('/dashboard', async (req, res) => {
    try {
        const doctor = await Doctor_1.default.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const patients = await Patient_1.default.find({ isActive: true })
            .populate('userId', 'firstName lastName email phone')
            .sort({ createdAt: -1 });
        const urgentAlerts = await Alert_1.default.find({
            severity: { $in: ['high', 'critical'] },
            status: 'active'
        })
            .populate('patientId')
            .populate('patientId.userId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todaysConsultations = await Chat_1.default.find({
            doctorId: doctor._id,
            status: 'active',
            createdAt: { $gte: today, $lt: tomorrow }
        })
            .populate('patientId')
            .populate('patientId.userId', 'firstName lastName')
            .sort({ createdAt: -1 });
        const totalPatients = await Patient_1.default.countDocuments({ isActive: true });
        const activeAlerts = await Alert_1.default.countDocuments({ status: 'active' });
        const urgentCases = await Alert_1.default.countDocuments({
            severity: { $in: ['high', 'critical'] },
            status: 'active'
        });
        res.json({
            success: true,
            data: {
                doctor,
                patients,
                urgentAlerts,
                todaysConsultations,
                statistics: {
                    totalPatients,
                    activeAlerts,
                    urgentCases
                }
            }
        });
    }
    catch (error) {
        console.error('Doctor dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/patients', async (req, res) => {
    try {
        const { urgency, department, page = 1, limit = 20 } = req.query;
        const query = { isActive: true };
        if (department)
            query.department = department;
        const patients = await Patient_1.default.find(query)
            .populate('userId', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const patientsWithVitals = await Promise.all(patients.map(async (patient) => {
            const latestVitals = await Vitals_1.default.findOne({ patientId: patient._id })
                .sort({ timestamp: -1 });
            const activeAlerts = await Alert_1.default.find({
                patientId: patient._id,
                status: 'active'
            });
            let urgencyLevel = 'low';
            if (latestVitals) {
                if (latestVitals.isEmergency) {
                    urgencyLevel = 'high';
                }
                else if (activeAlerts.some(alert => alert.severity === 'high')) {
                    urgencyLevel = 'high';
                }
                else if (activeAlerts.some(alert => alert.severity === 'medium')) {
                    urgencyLevel = 'medium';
                }
            }
            return {
                ...patient.toObject(),
                latestVitals,
                activeAlerts,
                urgency: urgencyLevel
            };
        }));
        const filteredPatients = urgency
            ? patientsWithVitals.filter(p => p.urgency === urgency)
            : patientsWithVitals;
        const total = await Patient_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('Doctor patients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/patients/:id', async (req, res) => {
    try {
        const patient = await Patient_1.default.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const vitalsHistory = await Vitals_1.default.find({ patientId: patient._id })
            .sort({ timestamp: -1 })
            .limit(50);
        const alertsHistory = await Alert_1.default.find({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .limit(20);
        const chatHistory = await Chat_1.default.find({ patientId: patient._id })
            .populate('doctorId', 'firstName lastName specialization')
            .sort({ updatedAt: -1 });
        const latestVitals = vitalsHistory[0];
        const aiSummary = generateAISummary(patient, latestVitals, alertsHistory);
        res.json({
            success: true,
            data: {
                patient,
                latestVitals,
                vitalsHistory,
                alertsHistory,
                chatHistory,
                aiSummary
            }
        });
    }
    catch (error) {
        console.error('Patient details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/alerts/:id/approve', async (req, res) => {
    try {
        const { treatmentPlan, notes } = req.body;
        const alert = await Alert_1.default.findByIdAndUpdate(req.params.id, {
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
        }, { new: true }).populate('patientId')
            .populate('patientId.userId', 'firstName lastName');
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        const io = req.app.get('io');
        io.emit('alert-updated', {
            alertId: alert._id,
            status: 'resolved',
            patientId: alert.patientId._id
        });
        res.json({
            success: true,
            data: alert
        });
    }
    catch (error) {
        console.error('Approve treatment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/consultations', async (req, res) => {
    try {
        const { patientId, type, priority = 'medium' } = req.body;
        const doctor = await Doctor_1.default.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const patient = await Patient_1.default.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        let chat = await Chat_1.default.findOne({
            patientId: patient._id,
            doctorId: doctor._id,
            status: 'active'
        });
        if (!chat) {
            chat = new Chat_1.default({
                patientId: patient._id,
                doctorId: doctor._id,
                messages: [],
                status: 'active',
                priority,
                tags: [type]
            });
        }
        await chat.save();
        res.status(201).json({
            success: true,
            data: chat
        });
    }
    catch (error) {
        console.error('Start consultation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/schedule', async (req, res) => {
    try {
        const doctor = await Doctor_1.default.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const consultations = await Chat_1.default.find({
            doctorId: doctor._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate('patientId')
            .populate('patientId.userId', 'firstName lastName')
            .sort({ createdAt: 1 });
        res.json({
            success: true,
            data: {
                doctor,
                consultations,
                availability: doctor.availability
            }
        });
    }
    catch (error) {
        console.error('Doctor schedule error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
function generateAISummary(patient, latestVitals, alertsHistory) {
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
    const recentCriticalAlerts = alertsHistory.filter(alert => alert.severity === 'critical' &&
        alert.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000));
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
exports.default = router;
//# sourceMappingURL=doctor.js.map