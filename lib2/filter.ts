import { Global } from './interfaces';

export default class Filter {
  public relatedToGroup: Array<any> = [];
  public relatedToInternalData: Array<any> = [];

  constructor(
    private global: Global,
    public collection: string,
    public name: string,
    private filterFunction: (context: object) => any
  ) {}

  public run() {
    // cleanup before running
    this.relatedToGroup = [];
    this.relatedToInternalData = [];

    this.global.runningFilter = this;

    let output = this.filterFunction(this.global.getContext(this.collection));

    if (output === undefined || output === null) output = false;

    this.global.runningFilter = false;

    return output;
  }

  addRelationToGroup(collectionName: string, groupName: string): void {
    const parsed = JSON.stringify({
      collection: collectionName,
      group: groupName
    });
    if (!this.relatedToGroup.includes(parsed)) this.relatedToGroup.push(parsed);
  }
  addRelationToInternalData(collectionName: string, primaryKey: string): void {
    const parsed = JSON.stringify({
      collection: collectionName,
      primaryKey
    });
    if (!this.relatedToInternalData.includes(parsed))
      this.relatedToInternalData.push(parsed);
  }
}
