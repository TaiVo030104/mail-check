export interface AuthInfo {
  accessToken: string;
  refreshToken?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
  email: string;
  role: string;
  picture?: string;
}

export interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  role?: string;
  [key: string]: unknown;
}
