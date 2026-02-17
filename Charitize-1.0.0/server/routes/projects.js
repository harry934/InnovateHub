const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');

// @route   GET api/projects
// @desc    Get all projects (for admin/public view potentially)
// @access  Public/Private
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate('innovatorId', 'name').sort({ date: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/projects/my-projects
// @desc    Get current user's projects
// @access  Private
router.get('/my-projects', auth, async (req, res) => {
    try {
        const projects = await Project.find({ innovatorId: req.user.id }).sort({ date: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, category, description, goals, sections } = req.body;

    try {
        const newProject = new Project({
            title,
            category,
            description,
            goals,
            sections,
            innovatorId: req.user.id,
            status: 'pending'
        });

        const project = await newProject.save();
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, category, description, goals, status, sections } = req.body;

    // Build project object
    const projectFields = {};
    if (title) projectFields.title = title;
    if (category) projectFields.category = category;
    if (description) projectFields.description = description;
    if (goals) projectFields.goals = goals;
    if (status) projectFields.status = status;
    if (sections) projectFields.sections = sections;

    try {
        let project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Make sure user owns project or is admin (TODO: add admin check)
        if (project.innovatorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: projectFields },
            { new: true }
        );

        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
