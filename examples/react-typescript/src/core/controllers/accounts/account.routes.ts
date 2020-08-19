import { API } from "../../core";
import { AccountBody, AuthCreds } from "./account.interfaces";

interface LoginResponse {
	account: AccountBody;
}

export const Login = async (payload: AuthCreds): Promise<LoginResponse> =>
	(await API.post("auth/login", payload)).data;
