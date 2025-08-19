export interface User {
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
  created_at: string;
}

export interface UserWithPreferences extends User {
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

export interface MatchesResponse {
  incoming: MatchWithUser[];
  outgoing: MatchWithUser[];
  confirmed: MatchWithUser[];
}

export interface AuthResponse {
  token: string;
  userId: number;
}

export interface ApiError {
  error: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  bio?: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  moveInDate?: string;
  lease_duration?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ProfileUpdateData {
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

export interface MatchRequestData {
  fromUserId: number;
  toUserId: number;
  message?: string;
}