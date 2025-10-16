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
const ChatSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
ChatSchema.index({ patientId: 1, status: 1 });
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ priority: 1, status: 1 });
exports.default = mongoose_1.default.model('Chat', ChatSchema);
//# sourceMappingURL=Chat.js.map