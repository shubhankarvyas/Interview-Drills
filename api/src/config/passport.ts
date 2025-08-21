import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { User, IUser } from '../models/User';

// Configure Google OAuth strategy only if credentials are available
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_API_URL || 'https://your-production-domain.com'
    : 'http://localhost:5001';

if (googleClientId && googleClientSecret) {
    passport.use(new GoogleStrategy({
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${baseUrl}/auth/google/callback`
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({ 'providers.google.id': profile.id });

            if (user) {
                // User exists, return the user
                return done(null, user);
            }

            // Check if user exists with the same email
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists with same email, update with Google provider info
                user.providers.google = {
                    id: profile.id,
                    email: profile.emails[0].value
                };
                user.picture = profile.photos[0]?.value || user.picture;
                await user.save();
                return done(null, user);
            }

            // Create new user
            const newUser = new User({
                email: profile.emails[0].value,
                name: profile.displayName,
                picture: profile.photos[0]?.value || '',
                providers: {
                    google: {
                        id: profile.id,
                        email: profile.emails[0].value
                    }
                }
            });

            await newUser.save();
            return done(null, newUser);

        } catch (error) {
            console.error('Error in Google OAuth strategy:', error);
            return done(error, null);
        }
    }));
} else {
    console.warn('Google OAuth credentials not found. Google authentication will not be available.');
}

// Configure LinkedIn OAuth strategy
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

if (linkedinClientId && linkedinClientSecret) {
    passport.use(new LinkedInStrategy({
        clientID: linkedinClientId,
        clientSecret: linkedinClientSecret,
        callbackURL: `${baseUrl}/auth/linkedin/callback`,
        scope: ['r_emailaddress', 'r_liteprofile']
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
            // Check if user already exists with this LinkedIn ID
            let user = await User.findOne({ 'providers.linkedin.id': profile.id });

            if (user) {
                // User exists, return the user
                return done(null, user);
            }

            // Check if user exists with the same email
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@linkedin.local`;
            user = await User.findOne({ email: email });

            if (user) {
                // User exists with same email, update with LinkedIn provider info
                user.providers.linkedin = {
                    id: profile.id,
                    email: email
                };
                user.picture = profile.photos && profile.photos[0] ? profile.photos[0].value : user.picture;
                await user.save();
                return done(null, user);
            }

            // Create new user
            const newUser = new User({
                email: email,
                name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
                picture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
                providers: {
                    linkedin: {
                        id: profile.id,
                        email: email
                    }
                }
            });

            await newUser.save();
            return done(null, newUser);

        } catch (error) {
            console.error('Error in LinkedIn OAuth strategy:', error);
            return done(error, null);
        }
    }));
} else {
    console.warn('LinkedIn OAuth credentials not found. LinkedIn authentication will not be available.');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;