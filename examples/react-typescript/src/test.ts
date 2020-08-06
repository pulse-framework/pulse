import { threadId } from 'worker_threads';

type Config<A> = ControllerConfigObj<A> | ((col?: Collection) => ControllerConfigObj<A>);

// ThingOne is an object that could contain any property name, but the type is fixed to boolean, but boolean would be something else in practice, however it will do for this example.
export interface ThingOne {
  [key: string]: boolean;
}
// This is a "config" object, stating that "thingOne" is an optional object but its type should follow the structure of A
export interface ControllerConfigObj<A> {
  thingOne?: A;
}

// This class takes two generics, DataType which is nessisary, and A which is an optional way to override the ThingOne type
class Collection<DataType = boolean, A = ThingOne> {
  // This is the magic that infers the type, if no generic is passed, Typescript will use the inferred type of this.config.thingOne for controller.thingOne
  public value: DataType | undefined;
  public thingOne: this['config']['thingOne'];

  constructor(public config: ControllerConfigObj<A>) {
    // initialize thingOne
    this.thingOne = this.config.thingOne;
  }
}
const App = {
  TCollection: <A = ThingOne>(config: Config<A>) => <DataType = boolean>() =>
    new Collection<DataType, A>(typeof config === 'function' ? config() : config)
};

// This controller is initialized WITHOUT a generic for DataType
export const Collection1 = new Collection({
  thingOne: {
    youShouldSeeMeThroughIntellisense: true
  }
});
// This controller is initialized WITHOUT a generic for DataType
export const Collection2 = new Collection<string>({
  thingOne: {
    youShouldSeeMeThroughIntellisense: true
  }
});
// This controller is initialized WITH a generic for DataType
export const Collection3 = App.TCollection((col) => ({
  thingOne: {
    youShouldSeeMeThroughIntellisense: true
  }
}))<string>();

Collection1.thingOne?.youShouldSeeMeThroughIntellisense; // works
Collection2.thingOne?.youShouldSeeMeThroughIntellisense; // no works
Collection3.thingOne?.youShouldSeeMeThroughIntellisense; // WORKS!

// If it appears to work when you hover, try uncommenting this and testing auto suggest
// MyController2.thingOne.
