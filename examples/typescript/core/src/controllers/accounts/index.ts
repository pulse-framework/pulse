import App from '../../app';
import { state, computed } from './state';
import * as actions from './actions';
import * as routes from './routes';

export default App.Controller({
  state: { ...state },
  routes
}).root({ ...actions, ...computed });
