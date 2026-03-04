const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');
const File = require('../models/File');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST api/projects/upload
// @desc    Upload project file to MongoDB
// @access  Public (should be Private but easier for now)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const newFile = new File({
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            data: req.file.buffer,
            projectId: req.body.projectId,
            innovatorId: req.body.innovatorId
        });

        const savedFile = await newFile.save();
        
        res.json({ 
            msg: 'File uploaded to MongoDB', 
            fileId: savedFile._id,
            url: `/api/projects/file/${savedFile._id}` 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/projects/file/:id
// @desc    Get file from MongoDB
router.get('/file/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ msg: 'File not found' });

        res.set('Content-Type', file.mimetype);
        res.send(file.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

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

// @route   DELETE api/projects/:id
// @desc    Delete project and its files
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Check user (Firebase UID from auth middleware)
        if (project.innovatorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Delete associated files from MongoDB
        await File.deleteMany({ projectId: req.params.id });

        // Delete project
        await Project.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Project and associated files removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
