export interface Channel {
  id: string;
  username: string;
  avatar: string;
  subscription?: Subscription;
}

export interface Subscription {
  id?: string;
  active?: boolean;
  notification_options: NotificationOptions;
}

export enum NotificationOptions {
  EVERYTHING,
  MUTED
}
