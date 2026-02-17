const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    mimetype: String,
    data: {
        type: Buffer,
        required: true
    },
    projectId: {
        type: String, // Firebase Project ID
        required: true
    },
    innovatorId: {
        type: String, // Firebase User ID
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', FileSchema);
