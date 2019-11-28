import { Global, ModuleInstance } from './interfaces';
import Collection from './module/modules/collection';
import Module from './module';
import { DynamicRelation } from './relationController';
import { JobType } from './runtime';

export default class Computed {
  public relatedToGroup: Array<any> = [];
  public dynamicRelation: DynamicRelation = null;

  constructor(
    private global: Global,
    public parentModuleInstance: ModuleInstance,
    public name: string,
    private computedFunction: (context: object) => any
  ) {}

  public run() {
    this.global.relations.cleanup(this.dynamicRelation);

    this.global.runningComputed = this;

    let context = this.global.getContext(this.parentModuleInstance);
    let output: any;

    try {
      output = this.computedFunction(context);
    } catch (error) {
      // if the computed function ran during init and an error is caught
      // theres a high chance it's because it depends on another computed function that
      // hasn't ran yet, so we re-ingest
      if (!this.global.initComplete) {
        // alert('yes');
        this.global.runtime.ingest({
          type: JobType.COMPUTED_REGEN,
          property: this,
          collection: this.parentModuleInstance
        });
        return;
      } else console.error(error);
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
