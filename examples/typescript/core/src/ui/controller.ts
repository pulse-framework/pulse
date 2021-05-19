import { action, Controller, state, event } from '@pulsejs/core';
import { AlertType, Theme, ThemeKey } from './types';
import { themes } from './themes';

class UI extends Controller {
  public state = {
    themeKey: state<ThemeKey>(ThemeKey.DARK).persist(),
    theme: state<Theme>(() => themes[this.state.themeKey])
  };
  //   public callbacks = {
  //     onAlert: callback(),
  //     onAppNotification: callback()
  //   };
  public events = {
    tabViewMounted: event()
  };
  public alert = action(({}, type: AlertType, title?: string, message?: string) => {
    // log.info(type, title, message);
    // this.callbacks.onAlert.call(type, title, message);
  });
}

export const ui = new UI();
