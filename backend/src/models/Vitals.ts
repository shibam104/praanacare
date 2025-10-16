import mongoose, { Document, Schema, Types } from 'mongoose';

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

const VitalsSchema = new Schema<IVitals>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  heartRate: {
    type: Number,
    required: [true, 'Heart rate is required'],
    min: [30, 'Heart rate must be at least 30'],
    max: [250, 'Heart rate must be at most 250']
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: [true, 'Systolic blood pressure is required'],
      min: [60, 'Systolic BP must be at least 60'],
      max: [250, 'Systolic BP must be at most 250']
    },
    diastolic: {
      type: Number,
      required: [true, 'Diastolic blood pressure is required'],
      min: [30, 'Diastolic BP must be at least 30'],
      max: [150, 'Diastolic BP must be at most 150']
    }
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required'],
    min: [90, 'Temperature must be at least 90°F'],
    max: [110, 'Temperature must be at most 110°F']
  },
  oxygenSaturation: {
    type: Number,
    required: [true, 'Oxygen saturation is required'],
    min: [70, 'Oxygen saturation must be at least 70%'],
    max: [100, 'Oxygen saturation must be at most 100%']
  },
  respiratoryRate: {
    type: Number,
    required: [true, 'Respiratory rate is required'],
    min: [8, 'Respiratory rate must be at least 8'],
    max: [40, 'Respiratory rate must be at most 40']
  },
  bloodGlucose: {
    type: Number,
    min: [50, 'Blood glucose must be at least 50'],
    max: [500, 'Blood glucose must be at most 500']
  },
  weight: {
    type: Number,
    min: [30, 'Weight must be at least 30 kg'],
    max: [300, 'Weight must be at most 300 kg']
  },
  height: {
    type: Number,
    min: [100, 'Height must be at least 100 cm'],
    max: [250, 'Height must be at most 250 cm']
  },
  bmi: {
    type: Number,
    min: [10, 'BMI must be at least 10'],
    max: [60, 'BMI must be at most 60']
  },
  environmentalData: {
    ambientTemperature: {
      type: Number,
      required: [true, 'Ambient temperature is required']
    },
    humidity: {
      type: Number,
      required: [true, 'Humidity is required'],
      min: [0, 'Humidity must be at least 0%'],
      max: [100, 'Humidity must be at most 100%']
    },
    airQuality: {
      type: Number,
      required: [true, 'Air quality index is required'],
      min: [0, 'Air quality must be at least 0'],
      max: [500, 'Air quality must be at most 500']
    },
    noiseLevel: {
      type: Number,
      required: [true, 'Noise level is required'],
      min: [0, 'Noise level must be at least 0 dB'],
      max: [150, 'Noise level must be at most 150 dB']
    }
  },
  symptoms: [{
    type: String
  }],
  notes: String,
  recordedBy: {
    type: String,
    required: [true, 'Recorded by is required'],
    enum: ['patient', 'device', 'doctor', 'ai']
  },
  isEmergency: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
VitalsSchema.index({ patientId: 1, timestamp: -1 });
VitalsSchema.index({ timestamp: -1 });
VitalsSchema.index({ isEmergency: 1 });

export default mongoose.model<IVitals>('Vitals', VitalsSchema);
