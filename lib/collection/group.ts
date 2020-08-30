import Pulse from '../pulse';
import State from '../state';
import Collection, { DefaultDataItem } from './collection';
import { defineConfig } from '../utils';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;
export type InstanceContext = (() => Collection) | (() => Pulse);

export class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
	_output: Array<DataType> = [];
	_states: Array<State<DataType>> = []; // States of the Group
	notFoundPrimaryKeys: Array<PrimaryKey> = [];
  computedFunc?: (data: DataType) => DataType;
  collection: () => Collection<DataType>;
  public get index(): Array<PrimaryKey> {
    return this.value;
  }
	public get output(): Array<DataType> {
		// Add state(group) to foundState (for auto tracking used states in computed functions)
		if (this.instance().runtime.trackState)
			this.instance().runtime.foundStates.add(this);

		return this._output;
	}

	public get states(): Array<State<DataType>> {
		// Add state(group) to foundState (for auto tracking used states in computed functions)
		if (this.instance().runtime.trackState)
			this.instance().runtime.foundStates.add(this);

		return this._states;
	}

  constructor(context: InstanceContext, initialIndex?: Array<PrimaryKey>, config: { name?: string } = {}) {
    // This invokes the parent class with either the collection or the Pulse instance as context
    // This means groups can be created before (or during) a Collection instantization
    super((context() instanceof Pulse ? context : (context() as Collection<DataType>).instance) as () => Pulse, initialIndex || []);
    if (context() instanceof Collection) this.collection = context as () => Collection<DataType>;

    if (config.name) this.name = config.name;

    this.type(Array);

    this.sideEffects = () => this.build();

    // initial build
    this.build();
  }
  public build() {
		this.notFoundPrimaryKeys = [];

		// Check if _value is an array if not something went wrong because a group is always an array
		if (!Array.isArray(this._value)) {
			console.error("Agile: A group state has to be an array!");
			return;
		}

		// Map though group _value (collectionKey array) and get their state from collection
		const finalStates = this._value
			.map((primaryKey) => {
				// Get collection data at the primaryKey position
				let data = this.collection().data[primaryKey];

				// If no data found add this key to missing PrimaryKeys
				if (!data) {
					this.notFoundPrimaryKeys.push(primaryKey);
					return;
				}

				return data as State<DataType>;
			}).filter(item => item !== undefined);

		// Map though found States and return their publicValue
		const finalOutput = finalStates
			.map((state) => {
				// @ts-ignore
				return state.getPublicValue();
			});

		// Log not found primaryKeys
		if (this.notFoundPrimaryKeys.length > 0 && this.instance().config.logJobs)
			console.warn(`Agile: Couldn't find states with the primary keys in group '${this.key}'`, this.notFoundPrimaryKeys);

		// @ts-ignore
		this._states = finalStates;
		this._output = finalOutput;
  }

  public has(primaryKey: PrimaryKey) {
    return this.value.includes(primaryKey) || false;
  }

  public get size(): number {
    return this.value.length;
  }

  public compute(func: (data: DataType) => DataType): void {
    this.computedFunc = func;
  }

  public add(primaryKey: PrimaryKey, options: GroupAddOptions = {}): this {
    // set defaults
    options = defineConfig(options, { method: 'push', overwrite: true });
    const useIndex = options.atIndex !== undefined;
    const exists = this.nextState.includes(primaryKey);

    if (options.overwrite) this.nextState = this.nextState.filter(i => i !== primaryKey);
    // if we do not want to overwrite and key already exists in group, exit
    else if (exists) return this;

    // if atIndex is set, inject at that index.
    if (useIndex) {
      if (options.atIndex > this.nextState.length) options.atIndex = this.nextState.length - 1;
      this.nextState.splice(options.atIndex, 0, primaryKey);
    }
    // push or unshift into state
    else this.nextState[options.method](primaryKey);

    // send nextState to runtime and return
    this.set();
    return this;
  }

  public remove(primaryKey: PrimaryKey): this {
    this.nextState = this.nextState.filter(i => i !== primaryKey);
    this.set();
    return this;
  }
}

export default Group;

export interface GroupAddOptions {
  atIndex?: number; //
  method?: 'unshift' | 'push'; // method to add to group
  overwrite?: boolean; // set to false to leave primary key in place if already present
}
