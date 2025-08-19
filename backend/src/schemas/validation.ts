import { z } from 'zod';

// Base validation rules
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long');
const ageSchema = z.number().int().min(18, 'Must be at least 18').max(100, 'Invalid age').optional();
const budgetSchema = z.number().int().min(0, 'Budget must be positive').max(50000, 'Budget too high').optional();

// User Registration Schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  age: ageSchema,
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  occupation: z.string().max(100, 'Occupation too long').optional(),
  bio: z.string().max(1000, 'Bio too long').optional(),
  budget: budgetSchema, // deprecated
  budget_min: budgetSchema,
  budget_max: budgetSchema,
  location: z.string().max(200, 'Location too long').optional(),
  moveInDate: z.string().optional(),
  lease_duration: z.string().max(50, 'Lease duration too long').optional(),
}).refine(
  (data) => {
    if (data.budget_min && data.budget_max) {
      return data.budget_min <= data.budget_max;
    }
    return true;
  },
  {
    message: 'Minimum budget cannot be greater than maximum budget',
    path: ['budget_min'],
  }
);

// User Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  age: ageSchema,
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  occupation: z.string().max(100, 'Occupation too long').optional(),
  bio: z.string().max(1000, 'Bio too long').optional(),
  budgetMin: budgetSchema,
  budgetMax: budgetSchema,
  location: z.string().max(200, 'Location too long').optional(),
  move_in_date: z.string().optional(),
  lease_duration: z.string().max(50, 'Lease duration too long').optional(),
  smoking: z.boolean().optional(),
  pets: z.boolean().optional(),
  nightOwl: z.boolean().optional(),
  cleanlinessLevel: z.number().int().min(1).max(5).optional(),
  guestsFrequency: z.number().int().min(1).max(5).optional(),
  noiseLevel: z.number().int().min(1).max(5).optional(),
}).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'Minimum budget cannot be greater than maximum budget',
    path: ['budgetMin'],
  }
);

// Match Request Schema
export const matchRequestSchema = z.object({
  fromUserId: z.number().int().positive('Invalid user ID'),
  toUserId: z.number().int().positive('Invalid user ID'),
  message: z.string().max(500, 'Message too long').optional(),
}).refine(
  (data) => data.fromUserId !== data.toUserId,
  {
    message: 'Cannot send match request to yourself',
    path: ['toUserId'],
  }
);

// Message Schema (for future messaging system)
export const messageSchema = z.object({
  conversationId: z.number().int().positive('Invalid conversation ID'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
});

// Report Schema (for user safety)
export const reportSchema = z.object({
  reportedId: z.number().int().positive('Invalid user ID'),
  reason: z.enum([
    'INAPPROPRIATE_CONTENT',
    'HARASSMENT',
    'SPAM',
    'FAKE_PROFILE',
    'SAFETY_CONCERN',
    'OTHER'
  ]),
  description: z.string().max(1000, 'Description too long').optional(),
});

// Block Schema (for user safety)
export const blockSchema = z.object({
  blockedId: z.number().int().positive('Invalid user ID'),
});

// Search/Filter Schema
export const searchFilterSchema = z.object({
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  location: z.string().optional(),
  radius: z.number().int().min(1).max(100).optional(), // miles
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  ageMin: z.number().int().min(18).max(100).optional(),
  ageMax: z.number().int().min(18).max(100).optional(),
  smoking: z.boolean().optional(),
  pets: z.boolean().optional(),
  nightOwl: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'Minimum budget cannot be greater than maximum budget',
    path: ['budgetMin'],
  }
).refine(
  (data) => {
    if (data.ageMin && data.ageMax) {
      return data.ageMin <= data.ageMax;
    }
    return true;
  },
  {
    message: 'Minimum age cannot be greater than maximum age',
    path: ['ageMin'],
  }
);

// Email Verification Schema (for future email verification)
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Password Reset Schema (for future password reset)
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// 2FA Setup Schema (for future 2FA)
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  token: z.string().length(6, 'Invalid 2FA token'),
});

export const twoFactorVerifySchema = z.object({
  token: z.string().length(6, 'Invalid 2FA token'),
});

// Image Upload Schema (for future image uploads)
export const imageUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().regex(/^image\/(jpeg|jpg|png|gif)$/, 'Invalid image type'),
  size: z.number().max(5 * 1024 * 1024, 'Image too large (max 5MB)'), // 5MB max
});

// Location Schema (for PostGIS features)
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(200, 'Address too long').optional(),
});

// Validation middleware helper types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
export type SearchFilterInput = z.infer<typeof searchFilterSchema>;
export type LocationInput = z.infer<typeof locationSchema>;