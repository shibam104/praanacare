"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const Employer_1 = __importDefault(require("../models/Employer"));
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jsonwebtoken_1.default.sign({ userId }, secret, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};
router.post('/register', validation_1.validateRegistration, validation_1.validateRequest, async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, ...additionalData } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = new User_1.default({
            email,
            password,
            firstName,
            lastName,
            role
        });
        await user.save();
        let profile;
        switch (role) {
            case 'patient':
                profile = new Patient_1.default({
                    userId: user._id,
                    employeeId: additionalData.employeeId,
                    department: additionalData.department,
                    shift: additionalData.shift,
                    workLocation: additionalData.workLocation,
                    emergencyContact: additionalData.emergencyContact,
                    medicalHistory: additionalData.medicalHistory || [],
                    allergies: additionalData.allergies || [],
                    currentMedications: additionalData.currentMedications || []
                });
                break;
            case 'doctor':
                profile = new Doctor_1.default({
                    userId: user._id,
                    licenseNumber: additionalData.licenseNumber,
                    specialization: additionalData.specialization,
                    department: additionalData.department,
                    qualifications: additionalData.qualifications || [],
                    experience: additionalData.experience,
                    consultationFee: additionalData.consultationFee
                });
                break;
            case 'employer':
                profile = new Employer_1.default({
                    userId: user._id,
                    companyName: additionalData.companyName,
                    industry: additionalData.industry,
                    companySize: additionalData.companySize,
                    address: additionalData.address,
                    contactInfo: additionalData.contactInfo,
                    subscription: additionalData.subscription
                });
                break;
        }
        if (profile) {
            await profile.save();
        }
        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});
router.post('/login', validation_1.validateLogin, validation_1.validateRequest, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (!user.isActive) {
            return res.status(400).json({ message: 'Account is deactivated' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let profile;
        switch (user.role) {
            case 'patient':
                profile = await Patient_1.default.findOne({ userId: user._id });
                break;
            case 'doctor':
                profile = await Doctor_1.default.findOne({ userId: user._id });
                break;
            case 'employer':
                profile = await Employer_1.default.findOne({ userId: user._id });
                break;
        }
        res.json({
            success: true,
            user: {
                ...user.toObject(),
                profile
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, phone, ...profileData } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.user._id, { firstName, lastName, phone }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let profile;
        switch (user.role) {
            case 'patient':
                profile = await Patient_1.default.findOneAndUpdate({ userId: user._id }, profileData, { new: true, runValidators: true });
                break;
            case 'doctor':
                profile = await Doctor_1.default.findOneAndUpdate({ userId: user._id }, profileData, { new: true, runValidators: true });
                break;
            case 'employer':
                profile = await Employer_1.default.findOneAndUpdate({ userId: user._id }, profileData, { new: true, runValidators: true });
                break;
        }
        res.json({
            success: true,
            user: {
                ...user.toObject(),
                profile
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});
router.post('/change-password', auth_1.authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
        const user = await User_1.default.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error changing password' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map