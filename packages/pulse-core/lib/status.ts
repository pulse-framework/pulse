import { Pulse, State } from './internal';
import { copy } from './utils';

interface StatusObjectData {
  message: string | null;
  status: 'invalid' | 'success' | 'error' | null;
}

const initialData: StatusObjectData = {
  message: null,
  status: null
};

export class StatusTracker {
  public state: State<{ [key: string]: StatusObjectData }> = this.instance().State({});

  public get all(): { [key: string]: StatusObjectData } {
    return this.state.value;
  }

  constructor(private instance: () => Pulse) {}

  public get(key: string): StatusObjectData {
    return this?.state?.value[key];
  }

  public set(key: string): StatusObject {
    if (!this.state.value[key]) {
      this.state.set(Object.assign(copy(this.state.value), { [key]: initialData }));
    }

    return new StatusObject(this.state, key);
  }

  public remove(key: string): void {
    if (!this.state.value[key]) return;

    const copiedState: { [key: string]: StatusObjectData } = copy(this.state.value);

    copiedState[key] = undefined;
    delete copiedState[key];

    this.state.set(copiedState);
  }

  public clear(key?: string): void {
    // clearing a specific value
    if (key) {
      if (!this.state.value[key]) return;

      const copiedState: { [key: string]: StatusObjectData } = copy(this.state.value);

      copiedState[key] = initialData;

      this.state.set(copiedState);

      return;
    }

    this.state.reset();
  }
}

export class StatusObject {
  constructor(private state: State<{ [key: string]: StatusObjectData }>, private key: string) {}

  public status(newStatus: 'invalid' | 'success' | 'error' | 'none'): StatusObject {
    this.state.nextState[this.key].status = newStatus === 'none' ? null : newStatus;
    this.state.set();
    return this;
  }
  public message(messageText: string): StatusObject {
    this.state.nextState[this.key].message = messageText;
    this.state.set();
    return this;
  }
}

export default StatusTracker;
