export interface AccountBody {
  id: number;
  username: string;
  email: string;
}
export interface DeviceBody {
  id: string;
  useragent: string;
  sendNotifications: boolean;
}
