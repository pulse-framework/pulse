export interface AccountBody {
	id: number;
	username: string;
	email: string;
}

export interface AuthCreds {
	username?: string;
	password?: string;
}
