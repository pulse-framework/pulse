export interface Days {
  monday: any;
  tuesday: any;
  wednesday: any;
  thursday: any;
  friday: any;
  saturday: any;
  sunday: any;
}

export const DefaultLoggers = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log
};

export function restoreDefaultLoggers(): void {
  for (const name in DefaultLoggers) //
    console[name] = DefaultLoggers[name];
}

export function makeMockLoggers(): void {
  for (const name in DefaultLoggers) //
    console[name] = jest.fn();
}
