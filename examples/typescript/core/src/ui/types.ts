export interface UI {}

export type AlertType = 'success' | 'error' | 'info';

export enum ThemeKey {
  DARK,
  LIGHT
}

export interface Theme {
  highlight: string;
}
