"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const EmployerSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('Employer', EmployerSchema);
//# sourceMappingURL=Employer.js.map