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
        // Create a Supabase client using the service role key for admin operations
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

        // First, try to verify as a Supabase session token
        try {
            const { data: { user: supabaseUser }, error: supabaseError } = await req.supabase.auth.getUser(token);
            
            if (!supabaseError && supabaseUser) {
                console.log('Valid Supabase session token found for user:', supabaseUser.id);
                
                // Fetch the user's profile from the users table
                const { data: userData, error: userError } = await req.supabase
                    .from('users')
                    .select('id, role, email')
                    .eq('id', supabaseUser.id)
                    .single();

                if (userError && userError.code === 'PGRST116') {
                    // User profile doesn't exist, create it
                    const email = supabaseUser.email || null;
                    
                    // Generate a username from email if available
                    let username = null;
                    if (email) {
                        username = email.split('@')[0]; // Use part before @ as username
                        // Add a random number to make it unique
                        username = username + Math.floor(Math.random() * 1000);
                    } else {
                        username = 'user_' + supabaseUser.id.substring(0, 8);
                    }
                    
                    const newUser = {
                        id: supabaseUser.id,
                        username: username,
                        email: email,
                        family_id: null,
                        role: 'member',
                        points: 0
                    };
                    
                    const { data: insertedUser, error: insertError } = await req.supabase
                        .from('users')
                        .insert(newUser)
                        .select()
                        .single();
                    
                    if (insertError) {
                        console.error('Error creating user profile:', insertError);
                        return res.status(500).json({ message: 'Failed to create user profile' });
                    }
                    
                    req.user = {
                        id: insertedUser.id,
                        role: insertedUser.role,
                        email: insertedUser.email
                    };
                } else if (userError) {
                    console.error('Error fetching user:', userError);
                    return res.status(401).json({ message: 'User not found' });
                } else {
                    req.user = {
                        id: userData.id,
                        role: userData.role,
                        email: userData.email
                    };
                }
                
                return next();
            }
        } catch (supabaseAuthError) {
            console.log('Not a valid Supabase session token, trying JWT...');
        }

        // If not a Supabase session token, try JWT
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);

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