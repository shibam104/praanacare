import mongoose, { Document, Types } from 'mongoose';
export interface IVitals extends Document {
    _id: string;
    patientId: Types.ObjectId;
    timestamp: Date;
    heartRate: number;
    bloodPressure: {
        systolic: number;
        diastolic: number;
    };
    temperature: number;
    oxygenSaturation: number;
    respiratoryRate: number;
    bloodGlucose?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    environmentalData: {
        ambientTemperature: number;
        humidity: number;
        airQuality: number;
        noiseLevel: number;
    };
    symptoms: string[];
    notes?: string;
    recordedBy: 'patient' | 'device' | 'doctor' | 'ai';
    isEmergency: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IVitals, {}, {}, {}, mongoose.Document<unknown, {}, IVitals, {}, {}> & IVitals & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Vitals.d.ts.map