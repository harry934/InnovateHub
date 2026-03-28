const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/users/mentors
// @desc    Get all mentors (with optional filters)
// @access  Private
router.get('/mentors', auth, async (req, res) => {
    try {
        const { category, minRating, availability } = req.query;
        
        let query = { role: 'mentor' };
        
        if (availability === 'true') {
            query['profile.availability'] = true;
        }
        
        // Note: Category and rating filtering would require more complex queries based on profile structure
        // For now, returning all mentors for the frontend to filter or simple implementation
        
        const mentors = await User.find(query).select('-password');
        res.json(mentors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    const { bio, skills, experience, availability } = req.body;
    
    const profileFields = {};
    if (bio) profileFields['profile.bio'] = bio;
    if (skills) profileFields['profile.skills'] = skills; // Expecting array
    if (experience) profileFields['profile.experience'] = experience;
    if (availability !== undefined) profileFields['profile.availability'] = availability;

    try {
        let user = await User.findById(req.user.id);
        
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');
        
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
