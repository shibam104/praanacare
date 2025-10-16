import mongoose, { Document, Schema, Types } from 'mongoose';

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
    bloodPressure: { systolic: number; diastolic: number };
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

const AlertSchema = new Schema<IAlert>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  employerId: {
    type: Schema.Types.ObjectId,
    ref: 'Employer'
  },
  type: {
    type: String,
    required: [true, 'Alert type is required'],
    enum: ['heat_stress', 'fatigue', 'respiratory', 'injury', 'emergency', 'medication', 'appointment']
  },
  severity: {
    type: String,
    required: [true, 'Alert severity is required'],
    enum: ['low', 'medium', 'high', 'critical']
  },
  title: {
    type: String,
    required: [true, 'Alert title is required']
  },
  description: {
    type: String,
    required: [true, 'Alert description is required']
  },
  vitalsData: {
    heartRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    temperature: Number,
    oxygenSaturation: Number
  },
  environmentalData: {
    ambientTemperature: Number,
    humidity: Number,
    airQuality: Number
  },
  symptoms: [{
    type: String
  }],
  aiAnalysis: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendations: [{
      type: String
    }],
    confidence: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    required: [true, 'Alert status is required'],
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  acknowledgedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  actions: [{
    type: {
      type: String,
      required: true,
      enum: ['notification', 'consultation', 'medication', 'rest', 'emergency']
    },
    description: {
      type: String,
      required: true
    },
    executed: {
      type: Boolean,
      default: false
    },
    executedAt: Date,
    executedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notifications: [{
    type: {
      type: String,
      required: true,
      enum: ['email', 'sms', 'push', 'in_app']
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    recipient: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
AlertSchema.index({ patientId: 1, status: 1 });
AlertSchema.index({ type: 1, severity: 1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ status: 1 });

export default mongoose.model<IAlert>('Alert', AlertSchema);
