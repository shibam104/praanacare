import mongoose, { Document, Types } from 'mongoose';
export interface IEmployer extends Document {
    _id: string;
    userId: Types.ObjectId;
    companyName: string;
    industry: string;
    companySize: 'small' | 'medium' | 'large' | 'enterprise';
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    contactInfo: {
        phone: string;
        email: string;
        website?: string;
    };
    subscription: {
        plan: 'basic' | 'premium' | 'enterprise';
        startDate: Date;
        endDate: Date;
        isActive: boolean;
    };
    settings: {
        alertThresholds: {
            heatStress: number;
            fatigue: number;
            respiratory: number;
            injury: number;
        };
        notificationPreferences: {
            email: boolean;
            sms: boolean;
            push: boolean;
        };
        workingHours: {
            start: string;
            end: string;
            timezone: string;
        };
    };
    totalEmployees: number;
    activeEmployees: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IEmployer, {}, {}, {}, mongoose.Document<unknown, {}, IEmployer, {}, {}> & IEmployer & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Employer.d.ts.map