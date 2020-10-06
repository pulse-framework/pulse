import App from './app';

export default App.API({
  baseURL: 'https://api.pulsejs.org',
  path: 'v1',
  timeout: 10000,
  options: {
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Access-Control-Allow-Origin': 'pulsejs.org'
    }
  }
});
