export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  bio?: string;
  budget?: number;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  move_in_date?: string;
  lease_duration?: string;
  custom_duration?: string;
  created_at: string;
}

export interface Preferences {
  id: number;
  user_id: number;
  smoking: boolean;
  pets: boolean;
  night_owl: boolean;
  cleanliness_level: number;
  guests_frequency: number;
  noise_level: number;
}

export interface Match {
  id: number;
  from_user_id: number;
  to_user_id: number;
  compatibility_score?: number;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  responded_at?: string;
}

export interface UserWithPreferences extends Omit<User, 'password'> {
  smoking?: boolean;
  pets?: boolean;
  night_owl?: boolean;
  cleanliness_level?: number;
  guests_frequency?: number;
  noise_level?: number;
}

export interface MatchWithUser {
  match_id: number;
  from_user_id: number;
  to_user_id: number;
  status: string;
  match_created_at: string;
  id: number;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  bio?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  move_in_date?: string;
  lease_duration?: string;
  custom_duration?: string;
  smoking?: boolean;
  pets?: boolean;
  night_owl?: boolean;
  cleanliness_level?: number;
  guests_frequency?: number;
  noise_level?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  bio?: string;
  budget?: number;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  moveInDate?: string;
  lease_duration?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfileUpdateRequest {
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  bio?: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  move_in_date?: string;
  lease_duration?: string;
  smoking?: boolean;
  pets?: boolean;
  nightOwl?: boolean;
  cleanlinessLevel?: number;
  guestsFrequency?: number;
  noiseLevel?: number;
}

export interface MatchRequest {
  fromUserId: number;
  toUserId: number;
  message?: string;
}

export interface JWTPayload {
  id: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}