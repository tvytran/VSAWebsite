const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);
        
        // Add user from payload, adapting to the new structure
        req.user = {
            id: decoded.sub,
            role: decoded.role
        };

        // Create a Supabase client using the service role key for admin operations
        // This bypasses RLS and allows us to perform operations as the service
        const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
        
        if (!process.env.SUPABASE_SERVICE_KEY) {
            console.warn('WARNING: SUPABASE_SERVICE_KEY not found. Using regular key which may cause permission issues.');
        }
        
        req.supabase = createClient(
            process.env.SUPABASE_URL,
            serviceKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
}; 