"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const Chat_1 = __importDefault(require("../models/Chat"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Vitals_1 = __importDefault(require("../models/Vitals"));
const Alert_1 = __importDefault(require("../models/Alert"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const openai = process.env.OPENAI_API_KEY ? new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
}) : null;
router.use(auth_1.authMiddleware);
router.post('/chat', async (req, res) => {
    try {
        const { message, chatId, patientId } = req.body;
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }
        let patient = null;
        if (patientId) {
            patient = await Patient_1.default.findById(patientId).populate('userId', 'firstName lastName');
        }
        else if (req.user.role === 'patient') {
            patient = await Patient_1.default.findOne({ userId: req.user._id }).populate('userId', 'firstName lastName');
        }
        const latestVitals = patient ? await Vitals_1.default.findOne({ patientId: patient._id }).sort({ timestamp: -1 }) : null;
        const recentAlerts = patient ? await Alert_1.default.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(5) : [];
        let chat = null;
        if (chatId) {
            chat = await Chat_1.default.findById(chatId);
        }
        else if (patient) {
            chat = await Chat_1.default.findOne({ patientId: patient._id, status: 'active' });
        }
        if (!chat) {
            chat = new Chat_1.default({
                patientId: patient?._id,
                messages: [],
                status: 'active',
                priority: 'medium',
                tags: []
            });
        }
        const userMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: message,
            timestamp: new Date()
        };
        chat.messages.push(userMessage);
        const context = buildAIContext(patient, latestVitals, recentAlerts);
        const aiResponse = await generateAIResponse(message, context);
        const aiMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: aiResponse.content,
            timestamp: new Date(),
            metadata: {
                confidence: aiResponse.confidence,
                riskScore: aiResponse.riskScore,
                recommendations: aiResponse.recommendations
            }
        };
        chat.messages.push(aiMessage);
        if (aiResponse.actions && aiResponse.actions.length > 0) {
            aiResponse.actions.forEach((action, index) => {
                const actionMessage = {
                    id: (Date.now() + 2 + index).toString(),
                    type: 'action',
                    content: '',
                    timestamp: new Date(),
                    action: {
                        type: action.type,
                        title: action.title,
                        description: action.description,
                        executed: false
                    }
                };
                chat.messages.push(actionMessage);
            });
        }
        await chat.save();
        if (aiResponse.riskScore > 80) {
            await handleEmergencyAction(patient, aiResponse, req);
        }
        res.json({
            success: true,
            data: {
                chat,
                aiResponse: {
                    content: aiResponse.content,
                    confidence: aiResponse.confidence,
                    riskScore: aiResponse.riskScore,
                    recommendations: aiResponse.recommendations,
                    actions: aiResponse.actions
                }
            }
        });
    }
    catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/chat/:id', async (req, res) => {
    try {
        const chat = await Chat_1.default.findById(req.params.id)
            .populate('patientId')
            .populate('patientId.userId', 'firstName lastName')
            .populate('doctorId')
            .populate('doctorId.userId', 'firstName lastName');
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        if (req.user.role === 'patient') {
            const patient = await Patient_1.default.findOne({ userId: req.user._id });
            if (chat.patientId._id.toString() !== patient?._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }
        res.json({
            success: true,
            data: chat
        });
    }
    catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/analyze-vitals', async (req, res) => {
    try {
        const { vitalsData, patientId } = req.body;
        if (!vitalsData) {
            return res.status(400).json({ message: 'Vitals data is required' });
        }
        const patient = patientId
            ? await Patient_1.default.findById(patientId).populate('userId', 'firstName lastName')
            : await Patient_1.default.findOne({ userId: req.user._id }).populate('userId', 'firstName lastName');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const historicalVitals = await Vitals_1.default.find({ patientId: patient._id })
            .sort({ timestamp: -1 })
            .limit(10);
        const analysis = await generateVitalsAnalysis(vitalsData, historicalVitals, patient);
        res.json({
            success: true,
            data: analysis
        });
    }
    catch (error) {
        console.error('Analyze vitals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/generate-recommendations', async (req, res) => {
    try {
        if (req.user.role !== 'employer') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { period = '7d', department } = req.query;
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - getPeriodMs(period));
        const query = {
            timestamp: { $gte: startDate, $lte: endDate }
        };
        if (department) {
            const patients = await Patient_1.default.find({ department, isActive: true });
            const patientIds = patients.map(p => p._id);
            query.patientId = { $in: patientIds };
        }
        const vitalsData = await Vitals_1.default.find(query).populate('patientId');
        const alertsData = await Alert_1.default.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate('patientId');
        const recommendations = await generateEmployerRecommendations(vitalsData, alertsData, period);
        res.json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        console.error('Generate recommendations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
function buildAIContext(patient, latestVitals, recentAlerts) {
    let context = 'You are Praana AI, an intelligent health assistant for industrial workers. ';
    if (patient) {
        context += `Patient: ${patient.userId.firstName} ${patient.userId.lastName}, `;
        context += `Department: ${patient.department}, `;
        context += `Shift: ${patient.shift}. `;
    }
    if (latestVitals) {
        context += `Latest vitals: Heart Rate: ${latestVitals.heartRate} bpm, `;
        context += `Blood Pressure: ${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic} mmHg, `;
        context += `Temperature: ${latestVitals.temperature}°F, `;
        context += `Oxygen Saturation: ${latestVitals.oxygenSaturation}%. `;
    }
    if (recentAlerts.length > 0) {
        context += `Recent alerts: ${recentAlerts.map(a => `${a.type} (${a.severity})`).join(', ')}. `;
    }
    context += 'Provide helpful, actionable health advice. If you detect emergency conditions, recommend immediate medical attention.';
    return context;
}
async function generateAIResponse(message, context) {
    try {
        if (!openai) {
            return {
                message: "AI service is not available. Please contact your healthcare provider directly.",
                confidence: 0,
                riskScore: 0,
                recommendations: ["Contact your healthcare provider for immediate assistance"]
            };
        }
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: context
                },
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });
        const content = completion.choices[0].message.content || 'I apologize, but I cannot process your request at the moment.';
        const analysis = analyzeMessageForRisk(message.toLowerCase());
        return {
            content,
            confidence: 85,
            riskScore: analysis.riskScore,
            recommendations: analysis.recommendations,
            actions: analysis.actions
        };
    }
    catch (error) {
        console.error('OpenAI API error:', error);
        const analysis = analyzeMessageForRisk(message.toLowerCase());
        return {
            content: generateFallbackResponse(message, analysis),
            confidence: 60,
            riskScore: analysis.riskScore,
            recommendations: analysis.recommendations,
            actions: analysis.actions
        };
    }
}
function analyzeMessageForRisk(message) {
    let riskScore = 0;
    const recommendations = [];
    const actions = [];
    if (message.includes('chest pain') || message.includes('difficulty breathing') || message.includes('can\'t breathe')) {
        riskScore = 95;
        recommendations.push('Seek immediate medical attention');
        actions.push({
            type: 'emergency',
            title: 'Emergency Alert Triggered',
            description: 'Medical emergency team and supervisor notified'
        });
    }
    if (message.includes('headache') || message.includes('dizzy') || message.includes('tired') || message.includes('fatigue')) {
        riskScore = 70;
        recommendations.push('Take a break in a cool, shaded area');
        recommendations.push('Drink water and electrolytes');
        actions.push({
            type: 'consultation',
            title: 'Doctor Consultation Booked',
            description: 'Video call with doctor scheduled for urgent review'
        });
    }
    if (message.includes('thirsty') || message.includes('dehydrated') || message.includes('hot')) {
        riskScore = 50;
        recommendations.push('Increase fluid intake');
        recommendations.push('Take regular breaks');
        actions.push({
            type: 'reminder',
            title: 'Hydration Reminder Set',
            description: 'Reminder to drink water every 30 minutes'
        });
    }
    if (riskScore === 0) {
        riskScore = 20;
        recommendations.push('Continue monitoring your health');
        recommendations.push('Stay hydrated and take regular breaks');
    }
    return { riskScore, recommendations, actions };
}
function generateFallbackResponse(message, analysis) {
    if (analysis.riskScore > 80) {
        return "I understand you're experiencing serious symptoms. Please seek immediate medical attention and notify your supervisor. Emergency services have been contacted.";
    }
    else if (analysis.riskScore > 50) {
        return "Based on your symptoms, I recommend taking immediate rest in a cool area and drinking water. I've scheduled a consultation with a doctor for you.";
    }
    else {
        return "Thank you for sharing your health status. I'm monitoring your condition and will provide recommendations based on your vitals and symptoms.";
    }
}
async function generateVitalsAnalysis(vitalsData, historicalVitals, patient) {
    const { heartRate, bloodPressure, temperature, oxygenSaturation } = vitalsData;
    let riskScore = 0;
    const concerns = [];
    const recommendations = [];
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
    if (historicalVitals.length > 0) {
        const avgHeartRate = historicalVitals.reduce((sum, v) => sum + v.heartRate, 0) / historicalVitals.length;
        const avgBP = historicalVitals.reduce((sum, v) => sum + v.bloodPressure.systolic, 0) / historicalVitals.length;
        if (heartRate > avgHeartRate + 20) {
            riskScore += 15;
            concerns.push('Heart rate significantly elevated from baseline');
        }
        if (bloodPressure.systolic > avgBP + 20) {
            riskScore += 15;
            concerns.push('Blood pressure significantly elevated from baseline');
        }
    }
    return {
        riskScore: Math.min(riskScore, 100),
        concerns,
        recommendations,
        severity: riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 40 ? 'medium' : 'low',
        aiInsights: generateAIInsights(vitalsData, concerns, riskScore)
    };
}
function generateAIInsights(vitalsData, concerns, riskScore) {
    if (riskScore > 80) {
        return "Critical health indicators detected. Immediate medical intervention required. Patient shows signs of severe distress.";
    }
    else if (riskScore > 60) {
        return "High-risk health indicators. Patient requires close monitoring and potential medical consultation.";
    }
    else if (riskScore > 40) {
        return "Moderate health concerns detected. Patient should be monitored and provided with appropriate interventions.";
    }
    else {
        return "Health indicators are within acceptable ranges. Continue regular monitoring and maintain current health practices.";
    }
}
async function generateEmployerRecommendations(vitalsData, alertsData, period) {
    const recommendations = [];
    const totalIncidents = alertsData.length;
    const avgHealthIndex = calculateOverallHealthIndex(vitalsData, alertsData);
    if (avgHealthIndex < 70) {
        recommendations.push({
            type: 'high',
            title: 'Implement Enhanced Safety Protocols',
            description: `Health index is ${avgHealthIndex}%, below optimal levels. Implement additional safety measures and monitoring.`,
            impact: 'High',
            estimatedCost: '$10,000',
            expectedROI: '6 months',
            affectedWorkers: new Set(vitalsData.map(v => v.patientId)).size
        });
    }
    if (totalIncidents > 20) {
        recommendations.push({
            type: 'critical',
            title: 'Emergency Response Protocol Activation',
            description: `${totalIncidents} incidents detected in ${period}. Activate emergency response protocols.`,
            impact: 'Critical',
            estimatedCost: '$5,000',
            expectedROI: 'Immediate',
            affectedWorkers: new Set(alertsData.map(a => a.patientId)).size
        });
    }
    const heatStressAlerts = alertsData.filter(a => a.type === 'heat_stress');
    if (heatStressAlerts.length > 5) {
        recommendations.push({
            type: 'medium',
            title: 'Increase Hydration Infrastructure',
            description: `${heatStressAlerts.length} heat stress incidents detected. Add hydration stations and cooling areas.`,
            impact: 'Medium',
            estimatedCost: '$3,000',
            expectedROI: '3 months',
            affectedWorkers: new Set(heatStressAlerts.map(a => a.patientId)).size
        });
    }
    return recommendations;
}
function calculateOverallHealthIndex(vitalsData, alertsData) {
    if (vitalsData.length === 0)
        return 100;
    let totalScore = 0;
    let count = 0;
    vitalsData.forEach(vital => {
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
    const alertPenalty = alertsData.length * 5;
    const avgScore = count > 0 ? totalScore / count : 100;
    return Math.max(avgScore - alertPenalty, 0);
}
function getPeriodMs(period) {
    const periods = {
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
    };
    return periods[period] || periods['7d'];
}
async function handleEmergencyAction(patient, aiResponse, req) {
    if (!patient)
        return;
    const alert = new Alert_1.default({
        patientId: patient._id,
        type: 'emergency',
        severity: 'critical',
        title: 'AI Detected Emergency Condition',
        description: aiResponse.content,
        status: 'active',
        aiAnalysis: {
            riskScore: aiResponse.riskScore,
            recommendations: aiResponse.recommendations,
            confidence: aiResponse.confidence
        }
    });
    await alert.save();
    const io = req.app.get('io');
    io.emit('emergency-alert', {
        patientId: patient._id,
        alertId: alert._id,
        severity: 'critical',
        aiDetected: true
    });
}
exports.default = router;
//# sourceMappingURL=ai.js.map