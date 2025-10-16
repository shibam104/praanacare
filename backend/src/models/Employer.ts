import mongoose, { Document, Schema, Types } from 'mongoose';

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

const EmployerSchema = new Schema<IEmployer>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required']
  },
  companySize: {
    type: String,
    required: [true, 'Company size is required'],
    enum: ['small', 'medium', 'large', 'enterprise']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    }
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required']
    },
    website: String
  },
  subscription: {
    plan: {
      type: String,
      required: [true, 'Subscription plan is required'],
      enum: ['basic', 'premium', 'enterprise']
    },
    startDate: {
      type: Date,
      required: [true, 'Subscription start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Subscription end date is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  settings: {
    alertThresholds: {
      heatStress: {
        type: Number,
        default: 80
      },
      fatigue: {
        type: Number,
        default: 70
      },
      respiratory: {
        type: Number,
        default: 60
      },
      injury: {
        type: Number,
        default: 50
      }
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    workingHours: {
      start: {
        type: String,
        default: '08:00'
      },
      end: {
        type: String,
        default: '17:00'
      },
      timezone: {
        type: String,
        default: 'UTC'
      }
    }
  },
  totalEmployees: {
    type: Number,
    default: 0
  },
  activeEmployees: {
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

export default mongoose.model<IEmployer>('Employer', EmployerSchema);
