import App from './app';
import accounts from './controllers/accounts';
import posts from './controllers/posts';

const core = {
  accounts,
  posts
};

export default App.Core(core);

export type ICore = typeof core;
