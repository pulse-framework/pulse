import { protectedNames, arrayFunctions, isWatchableObject } from './helpers';
import Dep from './dep';
import { Global } from './interfaces';

interface Obj {
  [key: string]: any;
}

export default class Reactive {
  public properties: Array<string>;
  public object: Obj;
  private dispatch: any;
  private allowPrivateWrite: boolean = false;
  private touching: boolean = false;
  private touched: null | Dep;
  private sneaky: boolean;

  constructor(
    object: Obj = {},
    private global: Global,
    private collection: string,
    public mutable: Array<string>,
    public type: string
  ) {
    this.dispatch = this.global.dispatch;
    this.properties = Object.keys(object);

    this.object = this.reactiveObject(object);
  }

  reactiveObject(object: Obj, rootProperty?: string): object {
    const self = this;
    const objectKeys = Object.keys(object);

    // Loop over all properties of the to-be reactive object
    for (let i = 0; i < objectKeys.length; i++) {
      const key = objectKeys[i];
      const rootProperty = object.rootProperty;
      const currentProperty = key;
      let value = object[key];

      // If property is an array, make it reactive
      if (Array.isArray(value)) {
        // value = this.reactiveArray(value, key);
        // if property is an object, make it reactive also
      } else if (isWatchableObject(value) && !protectedNames.includes(key)) {
        // rootProperty should be the current key if first deep object
        value = this.deepReactiveObject(
          value,
          rootProperty || key,
          currentProperty
        );
      }

      // Create an instance of the dependency tracker
      const dep = new Dep(this.global, key, rootProperty, currentProperty);

      Object.defineProperty(object, key, {
        get: function pulseGetter() {
          if (self.sneaky) return value;

          if (self.global.touching) {
            self.global.touched = dep;
            return;
          }
          dep.register();

          // to prevent Vue from destorying our deep getters / setters
          // if (self.global.mappingData && isWatchableObject(value))
          //   return Object.assign({}, value);

          return value;
        },
        set: function pulseSetter(newValue) {
          // TODO: Deep reactive properties need to cause rootProperty(s) to update subscribers also

          // DEEP REACTIVE handler: "rootProperty" indicates if the object is "deep".
          if (rootProperty && self.mutable.includes(rootProperty)) {
            // mutate locally
            value = newValue;
            // dispatch mutation for deep property
            self.dispatch('mutation', {
              collection: self.collection,
              key: rootProperty,
              value: self.object[rootProperty],
              dep
            });

            // Regular muations
          } else {
            // if a protected name allow direct mutation
            if (protectedNames.includes(key)) {
              return (value = newValue);
            }
            // if backdoor open allow direct mutation
            if (self.allowPrivateWrite) {
              // dynamically convert new values to reactive if objects
              // This is risky as fuck and kinda doesn't even work
              if (isWatchableObject(value) && self.mutable.includes(key)) {
                // debugger
                newValue = self.deepReactiveObject(
                  newValue,
                  rootProperty || key,
                  currentProperty
                );
                console.log(value, newValue);
              }
              return (value = newValue);
            }

            // if property is mutable dispatch update
            if (self.mutable.includes(key)) {
              self.dispatch('mutation', {
                collection: self.collection,
                key,
                value: newValue,
                dep
              });
              // we did not apply the mutation since runtime will privatly
              // write the result since we dispatched above
            }
          }
        }
      });
    }
    return object;
  }

  deepReactiveObject(value, rootProperty?: string, propertyOnObject?: string) {
    let objectWithCustomPrototype = Object.create({
      rootProperty,
      propertyOnObject
    });

    // repopulate custom object with incoming values
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      const property = keys[i];
      objectWithCustomPrototype[property] = value[property];
    }

    this.allowPrivateWrite = true;
    const obj = this.reactiveObject(objectWithCustomPrototype, rootProperty);
    this.allowPrivateWrite = false;
    return obj;
  }

  reactiveArray(array, key) {
    const self = this;
    const reactiveArray = array.slice();

    for (let i = 0; i < arrayFunctions.length; i++) {
      const func = arrayFunctions[i];
      const original = Array.prototype[func];
      Object.defineProperty(reactiveArray, func, {
        value: function() {
          const result = original.apply(this, arguments);
          if (self.global.initComplete)
            self.dispatch('mutation', {
              collection: self.collection,
              key,
              value: result
            });
          return result;
        }
      });
    }
    return reactiveArray;
  }

  // when a component subscribes to data, a clean copy (with no getters or setters) must be provided
  // to the component, otherwise frameworks such as Vue will destroy our getters and setters with
  // its own, this removes all getters and setters for an entire object tree
  public cleanse(object?: any) {
    if (!object) object = this.object;
    if (!isWatchableObject(object)) return;
    const clean = Object.assign({}, object);
    const properties = Object.keys(clean);
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      if (isWatchableObject(clean[property]))
        clean[property] = this.cleanse(clean[property]);
    }
    return clean;
  }

  privateWrite(property, value) {
    this.allowPrivateWrite = true;
    this.object[property] = value;
    this.allowPrivateWrite = false;
  }

  // sneaky blocked the getter, sneaky.
  privateGet(property) {
    this.sneaky = true;
    const data = this.object[property];
    this.sneaky = false;
    return data;
  }

  exists(property: string): boolean {
    this.sneaky = true;
    const bool = !!this.object.hasOwnProperty(property);
    this.sneaky = false;
    return bool;
  }

  getKeys(): Array<string> {
    this.sneaky = true;
    const keys = Object.keys(this.object);
    this.sneaky = false;
    return keys;
  }
}

// look for computed output access to determine dependencies
// remove computed categories from public object on default config
