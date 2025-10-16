import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import Employer from '../models/Employer';
import { validateRequest, validateRegistration, validateLogin } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  } as jwt.SignOptions);
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, validateRequest, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password, firstName, lastName, role, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role
    });

    await user.save();

    // Create role-specific profile
    let profile;
    switch (role) {
      case 'patient':
        profile = new Patient({
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
        profile = new Doctor({
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
        profile = new Employer({
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

    // Generate token
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, validateRequest, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req: any, res: Response): Promise<Response | void> => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get role-specific profile
    let profile;
    switch (user.role) {
      case 'patient':
        profile = await Patient.findOne({ userId: user._id });
        break;
      case 'doctor':
        profile = await Doctor.findOne({ userId: user._id });
        break;
      case 'employer':
        profile = await Employer.findOne({ userId: user._id });
        break;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        profile
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req: any, res: Response): Promise<Response | void> => {
  try {
    const { firstName, lastName, phone, ...profileData } = req.body;
    
    // Update user basic info
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update role-specific profile
    let profile;
    switch (user.role) {
      case 'patient':
        profile = await Patient.findOneAndUpdate(
          { userId: user._id },
          profileData,
          { new: true, runValidators: true }
        );
        break;
      case 'doctor':
        profile = await Doctor.findOneAndUpdate(
          { userId: user._id },
          profileData,
          { new: true, runValidators: true }
        );
        break;
      case 'employer':
        profile = await Employer.findOneAndUpdate(
          { userId: user._id },
          profileData,
          { new: true, runValidators: true }
        );
        break;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authMiddleware, async (req: any, res: Response): Promise<Response | void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

export default router;
