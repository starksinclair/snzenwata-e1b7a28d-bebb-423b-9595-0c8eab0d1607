export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  org_name: string;
}

export interface AuthResponse {
  accessToken: string;
}
