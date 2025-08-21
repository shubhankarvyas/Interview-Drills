import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import { requireAuth, redirectIfAuthenticated } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { IUser } from '../models/User';
import Joi from 'joi';

const router = Router();

/**
 * Validation schemas for auth routes
 */
const authQuerySchema = {
    query: Joi.object({
        error: Joi.string().valid('auth_failed', 'access_denied').optional(),
        state: Joi.string().max(500).optional(),
        code: Joi.string().max(500).optional(),
        scope: Joi.string().optional(), // Allow scope parameter from Google OAuth
        authuser: Joi.string().optional(), // Allow authuser parameter from Google OAuth
        prompt: Joi.string().optional(), // Allow prompt parameter from Google OAuth
        hd: Joi.string().optional() // Allow hosted domain parameter from Google OAuth
    }).unknown(true) // Allow unknown query parameters for OAuth flexibility
};

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
router.get('/google',
    redirectIfAuthenticated,
    (req: Request, res: Response, next: NextFunction): void => {
        // Check if Google OAuth is configured
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            res.status(503).json({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Google OAuth is not configured'
                }
            });
            return;
        }

        passport.authenticate('google', {
            scope: ['profile', 'email']
        })(req, res, next);
    }
);

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback',
    validateRequest(authQuerySchema),
    passport.authenticate('google', {
        failureRedirect: process.env.CORS_ORIGIN + '/?error=auth_failed'
    }),
    (req: Request, res: Response): void => {
        // Successful authentication
        const user = req.user as IUser;
        console.log('User authenticated successfully:', user?.email);

        // Set security headers for redirect
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        });

        res.redirect(process.env.CORS_ORIGIN + '/dashboard');
    }
);

/**
 * GET /auth/linkedin
 * Initiate LinkedIn OAuth flow
 */
router.get('/linkedin',
    redirectIfAuthenticated,
    (req: Request, res: Response, next: NextFunction): void => {
        // Check if LinkedIn OAuth is configured
        if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
            res.status(503).json({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'LinkedIn OAuth is not configured'
                }
            });
            return;
        }

        passport.authenticate('linkedin', {
            scope: ['r_emailaddress', 'r_liteprofile']
        })(req, res, next);
    }
);

/**
 * GET /auth/linkedin/callback
 * Handle LinkedIn OAuth callback
 */
router.get('/linkedin/callback',
    validateRequest(authQuerySchema),
    passport.authenticate('linkedin', {
        failureRedirect: process.env.CORS_ORIGIN + '/?error=auth_failed'
    }),
    (req: Request, res: Response): void => {
        // Successful authentication
        const user = req.user as IUser;
        console.log('User authenticated successfully via LinkedIn:', user?.email);

        // Set security headers for redirect
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        });

        res.redirect(process.env.CORS_ORIGIN + '/dashboard');
    }
);

/**
 * POST /auth/logout
 * Logout user and destroy session
 */
router.post('/logout', requireAuth, (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as IUser;
    const userEmail = user?.email;

    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            next(err);
            return;
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).json({
                    error: {
                        code: 'LOGOUT_ERROR',
                        message: 'Error occurred during logout'
                    }
                });
                return;
            }

            console.log('User logged out successfully:', userEmail);
            res.clearCookie('connect.sid');
            res.json({
                message: 'Logged out successfully'
            });
        });
    });
});

/**
 * GET /api/me
 * Get current authenticated user information
 */
router.get('/me', requireAuth, (req: Request, res: Response): void => {
    const user = req.user as IUser;

    if (!user) {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'User not authenticated'
            }
        });
        return;
    }

    // Return user information (excluding sensitive data)
    const userInfo = {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt
    };

    res.json(userInfo);
});

export default router;