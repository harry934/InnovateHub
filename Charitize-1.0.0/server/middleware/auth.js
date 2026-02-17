const admin = require('firebase-admin');

module.exports = async function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            id: decodedToken.uid,
            email: decodedToken.email
        };
        next();
    } catch (err) {
        console.error('Error verifying Firebase token:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
