import { DefaultDataItem } from '../internal';

interface DataPropertyConfig<DataType extends DefaultDataItem> {
  index?: boolean;
  type?: 'string' | 'array' | 'boolean' | 'object' | 'number';
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  optional?: boolean;
  computed?: (data: DataType) => DataType;
}

export class Model {
  public string(): this {
    return this;
  }
  public max(amount: number): this {
    return this;
  }
  public min(amount: number): this {
    return this;
  }
  public required(): this {
    return this;
  }
  public index(): this {
    return this;
  }
  public optional(): this {
    return this;
  }
  public hidden(): this {
    return this;
  }
  public if(condition: any): this {
    return this;
  }
  public compute(func: (...args: any) => any): this {
    return this;
  }
}

export const model = new Model();
