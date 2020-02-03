import localStorage from '../__mocks__/localStorage';

const window = {};

Object.defineProperty(window, 'localStorage', { value: localStorage() });

export default window;
