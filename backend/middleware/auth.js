const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res, next) {
    console.log('=== Auth middleware called ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Original URL:', req.originalUrl);

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

    console.log('Token found, length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');

    try {
        // Create a Supabase client using the service role key for admin operations
        const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        
        console.log('Supabase URL exists:', !!supabaseUrl);
        console.log('Service key exists:', !!serviceKey);
        
        if (!supabaseUrl || !serviceKey) {
            console.error('Missing Supabase environment variables');
            return res.status(500).json({ 
                success: false, 
                message: 'Server configuration error' 
            });
        }
        
        if (!process.env.SUPABASE_SERVICE_KEY) {
            console.warn('WARNING: SUPABASE_SERVICE_KEY not found. Using regular key which may cause permission issues.');
        }
        
        req.supabase = createClient(
            supabaseUrl,
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
            console.log('Attempting to verify as Supabase session token...');
            console.log('Supabase URL:', supabaseUrl);
            console.log('Service key length:', serviceKey ? serviceKey.length : 0);
            
            const { data: { user: supabaseUser }, error: supabaseError } = await req.supabase.auth.getUser(token);
            
            console.log('Supabase auth result:', { 
                user: supabaseUser ? 'found' : 'not found', 
                error: supabaseError ? supabaseError.message : null 
            });
            
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
                        points_total: 0,
                        points_semester: 0
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
                
                console.log('Auth middleware success, user:', req.user);
                return next();
            } else {
                console.log('Supabase session token verification failed:', supabaseError);
            }
        } catch (supabaseAuthError) {
            console.log('Supabase auth error:', supabaseAuthError.message);
            console.log('Supabase auth error stack:', supabaseAuthError.stack);
        }

        // If not a Supabase session token, try JWT
        console.log('Trying JWT verification...');
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET not found');
            return res.status(500).json({ 
                success: false, 
                message: 'Server configuration error' 
            });
        }
        
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

        console.log('JWT auth success, user:', req.user);
        next();
    } catch (err) {
        console.error('Token verification or DB error:', err.message);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid or user not found' 
        });
    }
}; 