import mongoose, { Document, Schema, Types } from 'mongoose';

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

const PatientSchema = new Schema<IPatient>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  shift: {
    type: String,
    required: [true, 'Shift is required'],
    enum: ['day', 'night', 'rotating']
  },
  workLocation: {
    type: String,
    required: [true, 'Work location is required']
  },
  supervisorId: {
    type: String
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required']
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required']
    }
  },
  medicalHistory: [{
    type: String
  }],
  allergies: [{
    type: String
  }],
  currentMedications: [{
    type: String
  }],
  insuranceInfo: {
    provider: String,
    policyNumber: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPatient>('Patient', PatientSchema);
