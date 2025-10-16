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
const DoctorSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('Doctor', DoctorSchema);
//# sourceMappingURL=Doctor.js.map