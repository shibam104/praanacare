"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Vitals_1 = __importDefault(require("../models/Vitals"));
const Alert_1 = __importDefault(require("../models/Alert"));
const Chat_1 = __importDefault(require("../models/Chat"));
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use((0, auth_1.roleMiddleware)(['patient']));
router.get('/dashboard', async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const latestVitals = await Vitals_1.default.findOne({ patientId: patient._id })
            .sort({ timestamp: -1 });
        const recentAlerts = await Alert_1.default.find({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .limit(5);
        const activeChats = await Chat_1.default.find({
            patientId: patient._id,
            status: 'active'
        }).sort({ updatedAt: -1 });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const vitalsHistory = await Vitals_1.default.find({
            patientId: patient._id,
            timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: -1 });
        res.json({
            success: true,
            data: {
                patient,
                latestVitals,
                recentAlerts,
                activeChats,
                vitalsHistory
            }
        });
    }
    catch (error) {
        console.error('Patient dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/vitals', validation_1.validateVitals, validation_1.validateRequest, async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const vitalsData = {
            ...req.body,
            patientId: patient._id,
            recordedBy: 'patient'
        };
        const vitals = new Vitals_1.default(vitalsData);
        await vitals.save();
        const isEmergency = checkEmergencyConditions(vitals);
        if (isEmergency) {
            vitals.isEmergency = true;
            await vitals.save();
            const alert = new Alert_1.default({
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
            const io = req.app.get('io');
            io.emit('emergency-alert', {
                patientId: patient._id,
                alertId: alert._id,
                severity: 'critical'
            });
        }
        res.status(201).json({
            success: true,
            data: vitals,
            isEmergency
        });
    }
    catch (error) {
        console.error('Record vitals error:', error);
        res.status(500).json({ message: 'Server error recording vitals' });
    }
});
router.get('/vitals/history', async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const { page = 1, limit = 20, startDate, endDate } = req.query;
        const query = { patientId: patient._id };
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = new Date(startDate);
            if (endDate)
                query.timestamp.$lte = new Date(endDate);
        }
        const vitals = await Vitals_1.default.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Vitals_1.default.countDocuments(query);
        res.json({
            success: true,
            data: {
                vitals,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    }
    catch (error) {
        console.error('Vitals history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const { status, type, page = 1, limit = 20 } = req.query;
        const query = { patientId: patient._id };
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        const alerts = await Alert_1.default.find(query)
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
        console.error('Patient alerts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/alerts/:id/acknowledge', async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const alert = await Alert_1.default.findOneAndUpdate({ _id: req.params.id, patientId: patient._id }, {
            status: 'acknowledged',
            acknowledgedBy: req.user._id,
            acknowledgedAt: new Date()
        }, { new: true });
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        res.json({
            success: true,
            data: alert
        });
    }
    catch (error) {
        console.error('Acknowledge alert error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/chats', async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const chats = await Chat_1.default.find({ patientId: patient._id })
            .sort({ updatedAt: -1 })
            .populate('doctorId', 'firstName lastName specialization');
        res.json({
            success: true,
            data: chats
        });
    }
    catch (error) {
        console.error('Patient chats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/chats', async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const { initialMessage } = req.body;
        const chat = new Chat_1.default({
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
        res.status(201).json({
            success: true,
            data: chat
        });
    }
    catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
function checkEmergencyConditions(vitals) {
    const { heartRate, bloodPressure, temperature, oxygenSaturation } = vitals;
    if (heartRate > 120 || heartRate < 50)
        return true;
    if (bloodPressure.systolic > 180 || bloodPressure.diastolic > 110)
        return true;
    if (bloodPressure.systolic < 90 || bloodPressure.diastolic < 60)
        return true;
    if (temperature > 103 || temperature < 95)
        return true;
    if (oxygenSaturation < 90)
        return true;
    return false;
}
exports.default = router;
//# sourceMappingURL=patient.js.map