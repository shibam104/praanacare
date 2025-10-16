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
const AlertSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    employerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    acknowledgedAt: Date,
    resolvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
                type: mongoose_1.Schema.Types.ObjectId,
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
AlertSchema.index({ patientId: 1, status: 1 });
AlertSchema.index({ type: 1, severity: 1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ status: 1 });
exports.default = mongoose_1.default.model('Alert', AlertSchema);
//# sourceMappingURL=Alert.js.map