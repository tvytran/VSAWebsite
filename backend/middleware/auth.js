const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    console.log('Auth middleware called for path:', req.path);
    console.log('Headers:', req.headers);

    // Get token from header
    let token = req.header('x-auth-token');

    // If no token in x-auth-token, check Authorization header
    if (!token) {
        const authHeader = req.header('Authorization');
        console.log('Authorization header:', authHeader);
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log('Token extracted from Authorization header');
        }
    }

    // Check if no token
    if (!token) {
        console.log('No token found in headers');
        return res.status(401).json({ 
            success: false, 
            message: 'No token, authorization denied' 
        });
    }

    try {
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        console.log('Token decoded successfully:', decoded);
        
        // Add user from payload
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
}; 