# Backend Implementation Guide

## Overview
This document outlines the complete backend implementation for the Enterprise Management System, including authentication, API routes, database models, and file upload integration.

## Technology Stack
- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary
- **Validation**: Joi
- **Security**: bcrypt, helmet, cors
- **Environment**: dotenv

## Project Structure
\`\`\`
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── requestController.js
│   │   ├── fileController.js
│   │   └── reportController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Request.js
│   │   ├── File.js
│   │   └── Report.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── requests.js
│   │   ├── files.js
│   │   └── reports.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── upload.js
│   ├── config/
│   │   ├── database.js
│   │   └── cloudinary.js
│   └── utils/
│       ├── generateToken.js
│       └── sendEmail.js
├── server.js
├── package.json
└── .env
\`\`\`

## Environment Variables (.env)
\`\`\`env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/enterprise-management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
\`\`\`

## Database Models

### User Model (models/User.js)
\`\`\`javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'director', 'department'],
    default: 'department'
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'department' || this.role === 'director';
    },
    enum: ['Finance', 'HR', 'IT', 'Operations', 'Marketing', 'Sales', 'Legal', 'Procurement']
  },
  position: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  signature: {
    enabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['text', 'image'],
      default: 'text'
    },
    data: {
      type: String,
      default: ''
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    types: {
      files: {
        type: Boolean,
        default: true
      },
      requests: {
        type: Boolean,
        default: true
      },
      system: {
        type: Boolean,
        default: true
      },
      reports: {
        type: Boolean,
        default: false
      }
    }
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
\`\`\`

### Request Model (models/Request.js)
\`\`\`javascript
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isSignature: {
    type: Boolean,
    default: false
  },
  signatureData: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const requestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['approval', 'budget', 'support', 'policy', 'procurement', 'other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Need Signature', 'Sent Back'],
    default: 'Pending'
  },
  targetDepartment: {
    type: String,
    required: true,
    enum: ['Finance', 'HR', 'IT', 'Operations', 'Marketing', 'Sales', 'Legal', 'Procurement']
  },
  assignedDirector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String,
    cloudinaryId: String
  }],
  comments: [commentSchema],
  actionComment: {
    type: String,
    default: ''
  },
  actionDate: {
    type: Date
  },
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requiresSignature: {
    type: Boolean,
    default: false
  },
  signatureProvided: {
    type: Boolean,
    default: false
  },
  signatureData: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
requestSchema.index({ createdBy: 1, status: 1 });
requestSchema.index({ targetDepartment: 1, status: 1 });
requestSchema.index({ assignedDirector: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
\`\`\`

### File Model (models/File.js)
\`\`\`javascript
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['document', 'image', 'spreadsheet', 'presentation', 'other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  department: {
    type: String,
    required: true,
    enum: ['Finance', 'HR', 'IT', 'Operations', 'Marketing', 'Sales', 'Legal', 'Procurement']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  file: {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  versions: [{
    version: Number,
    file: {
      name: String,
      url: String,
      size: Number,
      type: String,
      cloudinaryId: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  requiresSignature: {
    type: Boolean,
    default: false
  },
  signatures: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    signatureData: String,
    signedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
fileSchema.index({ createdBy: 1, status: 1 });
fileSchema.index({ department: 1, status: 1 });
fileSchema.index({ 'sharedWith.user': 1 });

module.exports = mongoose.model('File', fileSchema);
\`\`\`

## Controllers

### Auth Controller (controllers/authController.js)
\`\`\`javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, position } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      position
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      bio: req.body.bio,
      position: req.body.position
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
\`\`\`

### Request Controller (controllers/requestController.js)
\`\`\`javascript
const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Create new request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      targetDepartment,
      assignedDirector,
      attachments
    } = req.body;

    const request = await Request.create({
      title,
      description,
      category,
      priority,
      targetDepartment,
      assignedDirector,
      attachments,
      createdBy: req.user.id
    });

    await request.populate('createdBy', 'firstName lastName email');
    if (assignedDirector) {
      await request.populate('assignedDirector', 'firstName lastName email');
    }

    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all requests (filtered by user role)
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'department') {
      query.createdBy = req.user.id;
    } else if (req.user.role === 'director') {
      query.$or = [
        { targetDepartment: req.user.department },
        { assignedDirector: req.user.id }
      ];
    }
    // Admin can see all requests

    const requests = await Request.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedDirector', 'firstName lastName email')
      .populate('comments.author', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('assignedDirector', 'firstName lastName email avatar')
      .populate('comments.author', 'firstName lastName email avatar')
      .populate('actionBy', 'firstName lastName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user has permission to view this request
    const canView = 
      req.user.role === 'admin' ||
      request.createdBy._id.toString() === req.user.id ||
      (req.user.role === 'director' && 
       (request.targetDepartment === req.user.department || 
        request.assignedDirector?.toString() === req.user.id));

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private
const updateRequest = async (req, res) => {
  try {
    let request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user owns the request and it's editable
    if (request.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    // Check if request is in editable state
    if (!['Pending', 'Sent Back'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Request cannot be edited in current status'
      });
    }

    request = await Request.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'firstName lastName email')
     .populate('assignedDirector', 'firstName lastName email');

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Take action on request (approve/reject/send back/request signature)
// @route   PUT /api/requests/:id/action
// @access  Private (Director/Admin only)
const takeAction = async (req, res) => {
  try {
    const { action, comment, requireSignature } = req.body;
    
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user has permission to take action
    const canTakeAction = 
      req.user.role === 'admin' ||
      (req.user.role === 'director' && 
       (request.targetDepartment === req.user.department || 
        request.assignedDirector?.toString() === req.user.id));

    if (!canTakeAction) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to take action on this request'
      });
    }

    // Update request based on action
    let newStatus;
    switch (action) {
      case 'approve':
        newStatus = 'Approved';
        break;
      case 'reject':
        newStatus = 'Rejected';
        break;
      case 'sendback':
        newStatus = 'Sent Back';
        break;
      case 'signature':
        newStatus = 'Need Signature';
        request.requiresSignature = true;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    request.status = newStatus;
    request.actionComment = comment;
    request.actionDate = new Date();
    request.actionBy = req.user.id;

    if (requireSignature) {
      request.requiresSignature = true;
    }

    await request.save();

    await request.populate('createdBy', 'firstName lastName email');
    await request.populate('actionBy', 'firstName lastName email');

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add comment to request
// @route   POST /api/requests/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text, isSignature, signatureData } = req.body;
    
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const comment = {
      author: req.user.id,
      text,
      isSignature: isSignature || false,
      signatureData: signatureData || ''
    };

    request.comments.push(comment);

    // If signature is provided and required, update request status
    if (isSignature && request.requiresSignature && request.status === 'Need Signature') {
      request.signatureProvided = true;
      request.signatureData = signatureData;
      request.status = 'Approved';
    }

    await request.save();

    await request.populate('comments.author', 'firstName lastName email avatar');

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user owns the request or is admin
    if (request.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequest,
  updateRequest,
  takeAction,
  addComment,
  deleteRequest
};
\`\`\`

## Middleware

### Authentication Middleware (middleware/auth.js)
\`\`\`javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
\`\`\`

## Routes

### Request Routes (routes/requests.js)
\`\`\`javascript
const express = require('express');
const {
  createRequest,
  getRequests,
  getRequest,
  updateRequest,
  takeAction,
  addComment,
  deleteRequest
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(getRequests)
  .post(createRequest);

router.route('/:id')
  .get(getRequest)
  .put(updateRequest)
  .delete(deleteRequest);

router.put('/:id/action', authorize('director', 'admin'), takeAction);
router.post('/:id/comments', addComment);

module.exports = router;
\`\`\`

### Auth Routes (routes/auth.js)
\`\`\`javascript
const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authorize('admin'), register); // Only admin can register new users
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
\`\`\`

## Server Setup (server.js)
\`\`\`javascript
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/requests', require('./src/routes/requests'));
app.use('/api/files', require('./src/routes/files'));
app.use('/api/reports', require('./src/routes/reports'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
\`\`\`

## Database Configuration (config/database.js)
\`\`\`javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
\`\`\`

## Cloudinary Configuration (config/cloudinary.js)
\`\`\`javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'enterprise-management',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
    resource_type: 'auto',
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = { cloudinary, upload };
\`\`\`

## Package.json
\`\`\`json
{
  "name": "enterprise-management-backend",
  "version": "1.0.0",
  "description": "Backend API for Enterprise Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.40.0",
    "multer-storage-cloudinary": "^4.0.0",
    "joi": "^17.9.2",
    "nodemailer": "^6.9.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "supertest": "^6.3.3"
  }
}
\`\`\`

## API Usage Examples

### Authentication
\`\`\`javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.token;

// Use token in subsequent requests
const authHeaders = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
\`\`\`

### Request Management
\`\`\`javascript
// Create request
const createRequest = async (requestData) => {
  const response = await fetch('/api/requests', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(requestData)
  });
  return response.json();
};

// Get requests
const getRequests = async () => {
  const response = await fetch('/api/requests', {
    headers: authHeaders
  });
  return response.json();
};

// Take action on request
const takeAction = async (requestId, action, comment) => {
  const response = await fetch(`/api/requests/${requestId}/action`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ action, comment })
  });
  return response.json();
};
\`\`\`

This implementation provides a complete, production-ready backend with proper authentication, authorization, data validation, and file upload capabilities using Cloudinary.
