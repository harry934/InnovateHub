const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('InnovateHub API is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${new Date().toISOString()}:`, err.stack);
    res.status(500).json({ 
        msg: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'Check logs' : err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
