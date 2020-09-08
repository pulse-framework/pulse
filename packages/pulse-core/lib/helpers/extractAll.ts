import { isWatchableObject } from './isWatchableObj';

/**
 * A helper function to extract all instances of a target instance from an object
 * If this function fails, it will do so silently, so it can be safely used without much knowledge of `inObj`.
 * @param findClass Class to extract instances of
 * @param inObj Object to find all instances of `findType` within
 */
export function extractAll<I extends new (...args: any) => any, O>(findClass: I, inObj: O): Set<InstanceType<I>> {
  // safety net: object passed is not an obj, but rather an instance of the testClass in question, return that
  if (inObj instanceof findClass) return new Set([findClass]) as Set<InstanceType<I>>;
  // safety net: if type passed is not iterable, return empty set
  if (typeof inObj !== 'object') return new Set<InstanceType<I>>();

  // define return Set with typeof testClass
  const found: Set<InstanceType<I>> = new Set();
  // storage for the look function's state
  let next = [inObj];
  function look() {
    let _next = [...next]; // copy last state
    next = []; // reset the original state
    _next.forEach(o => {
      const typelessObject: any = o;
      // look at every property in object
      for (let property in o) {
        // check if instance type of class
        if (o[property] instanceof findClass) found.add(typelessObject[property]);
        // otherwise if object, store child object for next loop
        else if (isWatchableObject(o[property])) next.push(typelessObject[property]);
      }
    });
    // if next state has items, loop function
    if (next.length > 0) look();
  }
  look();
  return found;
}
