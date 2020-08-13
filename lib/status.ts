import Pulse from './pulse';
import Collection from './collection';
import State from './state';
import { StateGroupType } from '.';
import { copy } from './utils';

interface StatusObjectData {
  message: string | null;
  status: 'invalid' | 'success' | 'error' | null;
}

const initialData: StatusObjectData = {
  message: null,
  status: null
};

export default class StatusTracker {
  private stateGroup: StateGroupType<StatusObjectData> = this.instance().StateGroup({});

  public get all(): {} {
    const output: object = {};

    for (const stateName in this.stateGroup) {
      const value = this.stateGroup[stateName].value;
      output[stateName] = value;
    }

    return output;
  }

  constructor(private instance: () => Pulse) {}

  public get(key: string): StatusObjectData {
    if (!this.stateGroup[key]) return;

    return this.stateGroup[key].value;
  }

  public set(key: string): StatusObject {
    if (!this.stateGroup[key]) {
      this.stateGroup[key] = this.instance().State(initialData);
    }

    return new StatusObject(this.stateGroup[key]);
  }

  public remove(key: string): any {
    if (!this.stateGroup[key]) return;
    const val = copy(this.stateGroup[key].value);

    this.stateGroup[key].destroy();
    this.stateGroup[key] = null;
    delete this.stateGroup[key];

    return val;
  }

  public clear(key?: string): void {
    if (key) {
      if (!this.stateGroup[key]) return;
      const val = copy(this.stateGroup[key].value);

      this.stateGroup[key].reset();
      return val;
    }

    for (const stateName in this.stateGroup) {
      this.stateGroup[stateName].reset();
    }
  }
}

export class StatusObject {
  constructor(private state: State<StatusObjectData>) {}

  public status(newStatus: 'invalid' | 'success' | 'error' | 'none'): StatusObject {
    this.state.set(Object.assign(this.state.value, { status: newStatus === 'none' ? null : newStatus }));
    return this;
  }
  public message(messageText: string): StatusObject {
    this.state.set(Object.assign(this.state.value, { message: messageText }));
    return this;
  }
}
