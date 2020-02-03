import { Global, ModuleInstance } from './interfaces';
import Collection from './module/modules/collection';
import Module from './module';
import { DynamicRelation } from './relationController';
import { JobType } from './runtime';

export default class Computed {
  public relatedToGroup: Array<any> = [];
  public dynamicRelation: DynamicRelation = null;
  public hasRun: boolean = false;
  constructor(
    private global: Global,
    public parentModuleInstance: ModuleInstance,
    public name: string,
    private computedFunction: (context: object) => any
  ) {}

  public run() {
    this.hasRun = true;

    // this.global.relations.cleanup(this.dynamicRelation);

    this.global.runningComputed = this;

    let context = this.global.getContext(this.parentModuleInstance);
    let output: any;
    try {
      output = this.computedFunction(context);
    } catch (error) {
      // during init computed functions that depend on the output of other computed function will throw an error since that computed function has not generated yet
      // fail silently and flush runtime
      this.global.runtime.finished();
      // if init complete, fail loudly
      if (this.global.initComplete) console.error(error);
    }
    // override output with default if undefined or null
    if (
      (output === undefined || output === null) &&
      this.global.config.computedDefault
    )
      output = this.global.config.computedDefault;

    this.global.runningComputed = false;

    return output;
  }
}
