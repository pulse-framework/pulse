import { API } from '.';
import { AccountBody, DeviceBody } from './interfaces';

// This file shows a basic example of an API route.
// Uou are free to organise the Typescript interfaces to your preference.

export interface LoginPayload {
  username: string;
  password: string;
  remember?: boolean;
  deviceFingerprint?: string;
}

export interface LoginResponse {
  account: AccountBody;
  device: DeviceBody;
  token: string;
}

/**
 * Login to my cool API
 */
export const login = async (payload: LoginPayload): Promise<LoginResponse> =>
  (await API.post('auth/login', payload)).data;
