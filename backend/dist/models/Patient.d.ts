import mongoose, { Document, Types } from 'mongoose';
export interface IPatient extends Document {
    _id: string;
    userId: Types.ObjectId;
    employeeId: string;
    department: string;
    shift: 'day' | 'night' | 'rotating';
    workLocation: string;
    supervisorId?: string;
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    medicalHistory: string[];
    allergies: string[];
    currentMedications: string[];
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPatient, {}, {}, {}, mongoose.Document<unknown, {}, IPatient, {}, {}> & IPatient & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Patient.d.ts.map