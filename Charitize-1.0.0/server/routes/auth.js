const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user (Link Firebase Auth UID with MongoDB)
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, firebaseUid, role } = req.body;

    try {
        let user = await User.findOne({ 
            $or: [{ email }, { firebaseUid }] 
        });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            firebaseUid,
            role
        });

        await user.save();

        res.json({ 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                firebaseUid: user.firebaseUid
            } 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user (Verify existence in MongoDB)
// @access  Public
router.post('/login', async (req, res) => {
    const { firebaseUid } = req.body;

    try {
        let user = await User.findOne({ firebaseUid });

        if (!user) {
            return res.status(404).json({ msg: 'User not found in data store' });
        }

        res.json({ 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                onboardingCompleted: user.onboardingCompleted,
                firebaseUid: user.firebaseUid
            } 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.id });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
