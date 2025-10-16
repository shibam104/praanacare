import mongoose, { Document, Types } from 'mongoose';
export interface IChat extends Document {
    _id: string;
    patientId: Types.ObjectId;
    doctorId?: string;
    messages: {
        id: string;
        type: 'user' | 'ai' | 'doctor' | 'action';
        content: string;
        timestamp: Date;
        action?: {
            type: 'emergency' | 'consultation' | 'medication' | 'reminder';
            title: string;
            description: string;
            executed: boolean;
            executedAt?: Date;
        };
        metadata?: {
            confidence?: number;
            riskScore?: number;
            recommendations?: string[];
        };
    }[];
    status: 'active' | 'closed' | 'escalated';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    summary?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IChat, {}, {}, {}, mongoose.Document<unknown, {}, IChat, {}, {}> & IChat & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Chat.d.ts.map