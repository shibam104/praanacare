import mongoose, { Document, Types } from 'mongoose';
export interface IDoctor extends Document {
    _id: string;
    userId: Types.ObjectId;
    licenseNumber: string;
    specialization: string;
    department: string;
    qualifications: string[];
    experience: number;
    consultationFee: number;
    availability: {
        monday: {
            start: string;
            end: string;
            available: boolean;
        };
        tuesday: {
            start: string;
            end: string;
            available: boolean;
        };
        wednesday: {
            start: string;
            end: string;
            available: boolean;
        };
        thursday: {
            start: string;
            end: string;
            available: boolean;
        };
        friday: {
            start: string;
            end: string;
            available: boolean;
        };
        saturday: {
            start: string;
            end: string;
            available: boolean;
        };
        sunday: {
            start: string;
            end: string;
            available: boolean;
        };
    };
    maxPatientsPerDay: number;
    currentPatients: number;
    rating: number;
    totalConsultations: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDoctor, {}, {}, {}, mongoose.Document<unknown, {}, IDoctor, {}, {}> & IDoctor & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Doctor.d.ts.map