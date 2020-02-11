import { PrimaryKey } from '..';
import { GroupName } from '../collection/group';

export function normalizeArray(
  items: PrimaryKey | GroupName | Array<PrimaryKey> | Array<GroupName>
): Array<PrimaryKey> {
  return Array.isArray(items) ? items : [items];
}
