import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDoctor extends Document {
  _id: string;
  userId: Types.ObjectId;
  licenseNumber: string;
  specialization: string;
  department: string;
  qualifications: string[];
  experience: number; // years
  consultationFee: number;
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  maxPatientsPerDay: number;
  currentPatients: number;
  rating: number;
  totalConsultations: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  qualifications: [{
    type: String
  }],
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: 0
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: 0
  },
  availability: {
    monday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    tuesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    wednesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    thursday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    friday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    saturday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '13:00' },
      available: { type: Boolean, default: false }
    },
    sunday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '13:00' },
      available: { type: Boolean, default: false }
    }
  },
  maxPatientsPerDay: {
    type: Number,
    default: 20
  },
  currentPatients: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalConsultations: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
