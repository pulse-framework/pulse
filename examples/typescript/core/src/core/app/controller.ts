import { Controller, state } from '@pulsejs/core/lib';

class App extends Controller {
  public state = {
    baseURL: state<string>('https://api.notify.me'),
    assetURL: state<string>('https://media.notify.me')
  };
}

export const app = new App();
