const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide all fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      const token = generateToken(user._id);

      // Set JWT in HttpOnly secure cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token
        }
      });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error during signup' });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Set JWT in HttpOnly secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

/**
 * @desc    Get user profile info
 * @route   GET /api/v1/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    // req.user is set by the requireAuth middleware
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving profile' });
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Clear JWT cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error during logout' });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  logout
};
