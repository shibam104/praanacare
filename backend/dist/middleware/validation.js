"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVitals = exports.validateLogin = exports.validateRegistration = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};
exports.validateRequest = validateRequest;
exports.validateRegistration = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required'),
    (0, express_validator_1.body)('role')
        .isIn(['patient', 'doctor', 'employer'])
        .withMessage('Role must be patient, doctor, or employer')
];
exports.validateLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
];
exports.validateVitals = [
    (0, express_validator_1.body)('heartRate')
        .isInt({ min: 30, max: 250 })
        .withMessage('Heart rate must be between 30 and 250'),
    (0, express_validator_1.body)('bloodPressure.systolic')
        .isInt({ min: 60, max: 250 })
        .withMessage('Systolic blood pressure must be between 60 and 250'),
    (0, express_validator_1.body)('bloodPressure.diastolic')
        .isInt({ min: 30, max: 150 })
        .withMessage('Diastolic blood pressure must be between 30 and 150'),
    (0, express_validator_1.body)('temperature')
        .isFloat({ min: 90, max: 110 })
        .withMessage('Temperature must be between 90°F and 110°F'),
    (0, express_validator_1.body)('oxygenSaturation')
        .isInt({ min: 70, max: 100 })
        .withMessage('Oxygen saturation must be between 70% and 100%'),
    (0, express_validator_1.body)('respiratoryRate')
        .isInt({ min: 8, max: 40 })
        .withMessage('Respiratory rate must be between 8 and 40')
];
//# sourceMappingURL=validation.js.map