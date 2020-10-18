import App from './app';
import accounts from './controllers/accounts';

const core = {
  accounts
};

export default App.Core(core);

export type ICore = typeof core;
