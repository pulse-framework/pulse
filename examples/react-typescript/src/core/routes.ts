import { API } from '.';
import { AccountBody, DeviceBody } from './interfaces';

/**
 * Login to my cool API
 */
export const login = async (payload: {
  username: string;
  password: string;
  remember?: boolean;
  deviceFingerprint?: string;
}): Promise<{
  account: AccountBody;
  device: DeviceBody;
  token: string;
}> => (await API.post('auth/login', payload)).data;
