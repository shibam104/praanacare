import mongoose, { Document, Schema, Types } from 'mongoose';

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

const ChatSchema = new Schema<IChat>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  messages: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['user', 'ai', 'doctor', 'action']
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: {
        type: String,
        enum: ['emergency', 'consultation', 'medication', 'reminder']
      },
      title: String,
      description: String,
      executed: {
        type: Boolean,
        default: false
      },
      executedAt: Date
    },
    metadata: {
      confidence: {
        type: Number,
        min: 0,
        max: 100
      },
      riskScore: {
        type: Number,
        min: 0,
        max: 100
      },
      recommendations: [{
        type: String
      }]
    }
  }],
  status: {
    type: String,
    required: true,
    enum: ['active', 'closed', 'escalated'],
    default: 'active'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String
  }],
  summary: String
}, {
  timestamps: true
});

// Indexes for efficient queries
ChatSchema.index({ patientId: 1, status: 1 });
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ priority: 1, status: 1 });

export default mongoose.model<IChat>('Chat', ChatSchema);
