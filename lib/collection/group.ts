import Dep from '../dep';
import Pulse from '../pulse';
import State from '../state';
import Collection, { DefaultDataItem } from './collection';
import Computed from '../computed';
import { defineConfig } from '../utils';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;

export class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
	_masterOutput: Array<DataType> = [];
	missingPrimaryKeys: Array<PrimaryKey> = [];
	computedFunc?: (data: DataType) => DataType;
	public get output(): Array<DataType> {
		if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
		return this._masterOutput;
	}
	constructor(
		private collection: () => Collection,
		initialIndex?: Array<PrimaryKey>,
		config: { name?: string } = {}
	) {
		super(() => collection().instance(), initialIndex || []);

		if (config.name) this.name = config.name;

		this.type(Array);

		this.sideEffects = () => this.build();

		// initial build
		this.build();
	}
	public build() {
		this.missingPrimaryKeys = [];
		let group = this._masterValue
			.map(primaryKey => {
				let data = this.collection().data[primaryKey];
				if (!data) {
					this.missingPrimaryKeys.push(primaryKey);
					return undefined;
				}
				// on each data item in this group, run compute
				if (this.computedFunc) {
					let dataComputed = this.computedFunc(data.copy());
					return dataComputed;
					// use collection level computed func if local does not exist
				} else if (this.collection().computedFunc) {
					let dataComputed = this.collection().computedFunc(data.copy());
					return dataComputed;
				}

				return data.getPublicValue();
			})
			.filter(item => item !== undefined);

		this.dep.dynamic.forEach(state => state.dep.depend(this));
		//@ts-ignore
		this._masterOutput = group;
	}

	public has(primaryKey: PrimaryKey) {
		return this.value.includes(primaryKey) || false;
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
