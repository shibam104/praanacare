import express from 'express';
import OpenAI from 'openai';
import Chat from '../models/Chat';
import Patient from '../models/Patient';
import Vitals from '../models/Vitals';
import Alert from '../models/Alert';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Initialize OpenAI (only if API key is provided)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Apply authentication middleware
router.use(authMiddleware);

// @route   POST /api/ai/chat
// @desc    Send message to AI assistant
// @access  Private
router.post('/chat', async (req: any, res: express.Response): Promise<void> => {
  try {
    const { message, chatId, patientId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get patient data for context
    let patient = null;
    if (patientId) {
      patient = await Patient.findById(patientId).populate('userId', 'firstName lastName');
    } else if (req.user.role === 'patient') {
      patient = await Patient.findOne({ userId: req.user._id }).populate('userId', 'firstName lastName');
    }

    // Get latest vitals for context
    const latestVitals = patient ? await Vitals.findOne({ patientId: patient._id }).sort({ timestamp: -1 }) : null;

    // Get recent alerts for context
    const recentAlerts = patient ? await Alert.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(5) : [];

    // Find or create chat session
    let chat = null;
    if (chatId) {
      chat = await Chat.findById(chatId);
    } else if (patient) {
      chat = await Chat.findOne({ patientId: patient._id, status: 'active' });
    }

    if (!chat) {
      chat = new Chat({
        patientId: patient?._id,
        messages: [],
        status: 'active',
        priority: 'medium',
        tags: []
      });
    }

    // Add user message
    const userMessage = {
      id: generateId(),
      type: 'user',
      content: req.body.message,
      timestamp: new Date()
    };
    chat.messages.push(userMessage);

    // Prepare context for AI
    const context = buildAIContext(patient, latestVitals, recentAlerts);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context);

    // Add AI response to chat
    const aiMessage = {
      id: generateId(),
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

    (aiResponse.actions || []).forEach((action: any, index: number) => {
      const actionMessage = {
        id: action.id ?? generateId(),
        type: 'action',
        content: action.title,
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

    await chat.save();

    // Check if emergency action is needed
    if (aiResponse.riskScore > 80) {
      await handleEmergencyAction(patient, aiResponse, req);
    }

    res.status(200).json(chat);
    return;
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ai/chat/:id
// @desc    Get chat history
// @access  Private
router.get('/chat/:id', async (req: any, res: express.Response): Promise<void> => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('patientId')
      .populate('patientId.userId', 'firstName lastName')
      .populate('doctorId')
      .populate('doctorId.userId', 'firstName lastName');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user has access to this chat
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (chat.patientId._id.toString() !== patient?._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.status(200).json(chat);
    return;
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ai/analyze-vitals
// @desc    Analyze patient vitals using AI
// @access  Private
router.post('/analyze-vitals', async (req: any, res: express.Response): Promise<void> => {
  try {
    const { vitalsData, patientId } = req.body;

    if (!vitalsData) {
      return res.status(400).json({ message: 'Vitals data is required' });
    }

    // Get patient context
    const patient = patientId 
      ? await Patient.findById(patientId).populate('userId', 'firstName lastName')
      : await Patient.findOne({ userId: req.user._id }).populate('userId', 'firstName lastName');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get historical vitals for comparison
    const historicalVitals = await Vitals.find({ patientId: patient._id })
      .sort({ timestamp: -1 })
      .limit(10);

    // Generate AI analysis
    const analysis = await generateVitalsAnalysis(vitalsData, historicalVitals, patient);

    res.status(200).json({ analysis });
    return;
  } catch (error) {
    console.error('Analyze vitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ai/generate-recommendations
// @desc    Generate AI recommendations for employer
// @access  Private (Employer)
router.post('/generate-recommendations', async (req: any, res: express.Response): Promise<void> => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { period = '7d', department } = req.query;

    // Get analytics data
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - getPeriodMs(period));

    const query: any = {
      timestamp: { $gte: startDate, $lte: endDate }
    };

    if (department) {
      const patients = await Patient.find({ department, isActive: true });
      const patientIds = patients.map(p => p._id);
      query.patientId = { $in: patientIds };
    }

    const vitalsData = await Vitals.find(query).populate('patientId');
    const alertsData = await Alert.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('patientId');

    // Generate AI recommendations
    const recommendations = await generateEmployerRecommendations(vitalsData, alertsData, period);

    res.status(200).json({ recommendations });
    return;
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function buildAIContext(patient: any, latestVitals: any, recentAlerts: any[]): string {
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

async function generateAIResponse(message: string, context: string): Promise<any> {
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

    // Analyze the response for risk factors and generate actions
    const analysis = analyzeMessageForRisk(message.toLowerCase());
    
    return {
      content,
      confidence: 85,
      riskScore: analysis.riskScore,
      recommendations: analysis.recommendations,
      actions: analysis.actions
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback response
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

function analyzeMessageForRisk(message: string): any {
  let riskScore = 0;
  const recommendations = [];
  const actions = [];

  // Emergency keywords
  if (message.includes('chest pain') || message.includes('difficulty breathing') || message.includes('can\'t breathe')) {
    riskScore = 95;
    recommendations.push('Seek immediate medical attention');
    actions.push({
      type: 'emergency',
      title: 'Emergency Alert Triggered',
      description: 'Medical emergency team and supervisor notified'
    });
  }

  // High risk keywords
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

  // Medium risk keywords
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

  // Low risk or general health
  if (riskScore === 0) {
    riskScore = 20;
    recommendations.push('Continue monitoring your health');
    recommendations.push('Stay hydrated and take regular breaks');
  }

  return { riskScore, recommendations, actions };
}

function generateFallbackResponse(message: string, analysis: any): string {
  if (analysis.riskScore > 80) {
    return "I understand you're experiencing serious symptoms. Please seek immediate medical attention and notify your supervisor. Emergency services have been contacted.";
  } else if (analysis.riskScore > 50) {
    return "Based on your symptoms, I recommend taking immediate rest in a cool area and drinking water. I've scheduled a consultation with a doctor for you.";
  } else {
    return "Thank you for sharing your health status. I'm monitoring your condition and will provide recommendations based on your vitals and symptoms.";
  }
}

async function generateVitalsAnalysis(vitalsData: any, historicalVitals: any[], patient: any): Promise<any> {
  const { heartRate, bloodPressure, temperature, oxygenSaturation } = vitalsData;
  
  let riskScore = 0;
  const concerns = [];
  const recommendations = [];

  // Analyze current vitals
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

  // Compare with historical data
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

function generateAIInsights(vitalsData: any, concerns: string[], riskScore: number): string {
  if (riskScore > 80) {
    return "Critical health indicators detected. Immediate medical intervention required. Patient shows signs of severe distress.";
  } else if (riskScore > 60) {
    return "High-risk health indicators. Patient requires close monitoring and potential medical consultation.";
  } else if (riskScore > 40) {
    return "Moderate health concerns detected. Patient should be monitored and provided with appropriate interventions.";
  } else {
    return "Health indicators are within acceptable ranges. Continue regular monitoring and maintain current health practices.";
  }
}

async function generateEmployerRecommendations(vitalsData: any[], alertsData: any[], period: string): Promise<any[]> {
  const recommendations = [];
  
  // Analyze data patterns
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
  
  // Heat stress analysis
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

function getPeriodMs(period: string): number {
  const periods: { [key: string]: number } = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  return periods[period] || periods['7d'];
}

async function handleEmergencyAction(patient: any, aiResponse: any, req: any): Promise<void> {
  if (!patient) return;
  
  // Create emergency alert
  const alert = new Alert({
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
  
  // Emit real-time emergency alert
  const io = req.app.get('io');
  io.emit('emergency-alert', {
    patientId: patient._id,
    alertId: alert._id,
    severity: 'critical',
    aiDetected: true
  });
}

export default router;
