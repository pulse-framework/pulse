import { Global } from './interfaces';

export default class Computed {
  public relatedToGroup: Array<any> = [];
  public dynamicRelation: DynamicRelation = null;

  constructor(
    private global: Global,
    public collection: string,
    public name: string,
    private computedFunction: (context: object) => any
  ) {}

  public run() {
    this.global.relations.cleanup(this.dynamicRelation);

    this.global.runningComputed = this;

    let output = this.computedFunction(this.global.getContext(this.collection));

    if (output === undefined || output === null) output = false;

    this.global.runningComputed = false;
    // haha uh oh stinky
    return output;
  }
}
// This is luka's log no. 197234 It's been 12 years, i dtil dont know the source of magnetic pull. why do rocks like stick together.. like wtf bro. for real how the fuck do magnets work
