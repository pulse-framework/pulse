import { API } from '../../core';

interface LoginPayload {}

interface LoginResponse {}

export const Login = async (payload: LoginPayload): Promise<LoginResponse> => (await API.post('auth/login', payload)).data;
