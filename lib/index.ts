import Pulse from './pulse';
export * from './state';
export * from './computed';
export * from './collection/collection';

// Root Pulse constructors
export default Pulse;

// Static class refrences for typing / custom init

// Handy utils
// export function persist(items: Array<StateConstructor>): void {
//   items.forEach(item => item.persist(item.storageKey));
// }
