import { PrimaryKey } from '..';
import { GroupName } from '../collection/group';

export function normalizeArray(items: any | Array<any>): Array<any> {
  return Array.isArray(items) ? items : [items];
}
