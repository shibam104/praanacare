import express from 'express';
import { body, validationResult } from 'express-validator';

export const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
		return;
	}
	next();
};

export const validateRegistration = [
	body('email')
		.isEmail()
		.normalizeEmail()
		.withMessage('Please provide a valid email'),
	body('password')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),
	body('firstName')
		.trim()
		.notEmpty()
		.withMessage('First name is required'),
	body('lastName')
		.trim()
		.notEmpty()
		.withMessage('Last name is required'),
	body('role')
		.isIn(['patient', 'doctor', 'employer'])
		.withMessage('Role must be patient, doctor, or employer')
];

export const validateLogin = [
	body('email')
		.isEmail()
		.normalizeEmail()
		.withMessage('Please provide a valid email'),
	body('password')
		.notEmpty()
		.withMessage('Password is required')
];

export const validateVitals = [
	body('heartRate')
		.isInt({ min: 30, max: 250 })
		.withMessage('Heart rate must be between 30 and 250'),
	body('bloodPressure.systolic')
		.isInt({ min: 60, max: 250 })
		.withMessage('Systolic blood pressure must be between 60 and 250'),
	body('bloodPressure.diastolic')
		.isInt({ min: 30, max: 150 })
		.withMessage('Diastolic blood pressure must be between 30 and 150'),
	body('temperature')
		.isFloat({ min: 90, max: 110 })
		.withMessage('Temperature must be between 90°F and 110°F'),
	body('oxygenSaturation')
		.isInt({ min: 70, max: 100 })
		.withMessage('Oxygen saturation must be between 70% and 100%'),
	body('respiratoryRate')
		.isInt({ min: 8, max: 40 })
		.withMessage('Respiratory rate must be between 8 and 40')
];
