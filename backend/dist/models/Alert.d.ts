import mongoose, { Document, Types } from 'mongoose';
export interface IAlert extends Document {
    _id: string;
    patientId: Types.ObjectId;
    doctorId?: string;
    employerId?: string;
    type: 'heat_stress' | 'fatigue' | 'respiratory' | 'injury' | 'emergency' | 'medication' | 'appointment';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    vitalsData?: {
        heartRate: number;
        bloodPressure: {
            systolic: number;
            diastolic: number;
        };
        temperature: number;
        oxygenSaturation: number;
    };
    environmentalData?: {
        ambientTemperature: number;
        humidity: number;
        airQuality: number;
    };
    symptoms: string[];
    aiAnalysis?: {
        riskScore: number;
        recommendations: string[];
        confidence: number;
    };
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolvedBy?: string;
    resolvedAt?: Date;
    actions: {
        type: 'notification' | 'consultation' | 'medication' | 'rest' | 'emergency';
        description: string;
        executed: boolean;
        executedAt?: Date;
        executedBy?: string;
    }[];
    notifications: {
        type: 'email' | 'sms' | 'push' | 'in_app';
        sent: boolean;
        sentAt?: Date;
        recipient: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IAlert, {}, {}, {}, mongoose.Document<unknown, {}, IAlert, {}, {}> & IAlert & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Alert.d.ts.map