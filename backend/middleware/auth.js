const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res, next) {
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

        // Fetch the user's actual role from the users table
        const { data: userData, error } = await req.supabase
            .from('users')
            .select('id, role')
            .eq('id', decoded.sub)
            .single();

        if (error || !userData) {
            console.error('User not found or error fetching user:', error);
            return res.status(401).json({ message: 'User not found or unauthorized' });
        }

        req.user = {
            id: userData.id,
            role: userData.role
        };

        next();
    } catch (err) {
        console.error('Token verification or DB error:', err.message);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid or user not found' 
        });
    }
}; 