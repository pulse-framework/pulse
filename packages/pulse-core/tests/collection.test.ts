import Pulse, { Collection, Group, Data, Selector } from '../lib';

interface ExampleData {
  id: string;
}

let //
  App: Pulse,
  MyCollection: Collection<ExampleData>;

const dataCount = 5;

function createExampleDataArray() {
  let i: number = 0,
    arr: ExampleData[] = [];
  while (i <= dataCount - 1) {
    arr.push({ id: (Math.floor(Math.random() * 10000) + 1 + Math.random()).toString() });
    i++;
  }
  return arr;
}

beforeAll(() => {
  App = new Pulse({ noCore: true });
});

beforeEach(() => {
  MyCollection = App.Collection<ExampleData>()(collection => ({
    defaultGroup: true,
    groups: { explicitlyDefinedGroup: collection.Group() },
    selectors: { mySelector: collection.Selector() }
  }));
});

describe('Collections', () => {
  test('Collection has reference to the Pulse instance', () => {
    expect(MyCollection.instance() instanceof Pulse).toBe(true);
  });

  test('Collection is configured correctly', () => {
    expect(MyCollection.groups['default'] instanceof Group).toBe(true);
    expect(MyCollection.groups['explicitlyDefinedGroup'] instanceof Group).toBe(true);
    expect(MyCollection.selectors['mySelector'] instanceof Selector).toBe(true);
  });

  function testGroupValues(groupName: string) {
    MyCollection.collect(createExampleDataArray(), groupName);
    expect(MyCollection.getGroup(groupName).value.length).toBe(dataCount);
    expect(MyCollection.getGroup(groupName).output.length).toBe(dataCount);
    // index is only set after output is accessed once
    expect(MyCollection.getGroup(groupName).index.length).toBe(dataCount);
  }

  test('Data is present in default group', () => testGroupValues('default'));

  test('Data is present in a dynamic group', () => testGroupValues('haha'));

  test('Data is present in a explicitly defined group', () => testGroupValues('explicitlyDefinedGroup'));

  test('Provisional data works correctly', () => {
    const exampleData = createExampleDataArray();
    const chosenId = exampleData[3].id;
    // get the data, creating a provisional data instance
    const data = MyCollection.getData(chosenId);

    const watcherId = data.watch(() => {});

    expect(MyCollection._provisionalData[chosenId]).toBe(data);
    // collect data, one of these items is key 3
    MyCollection.collect(exampleData);

    expect(MyCollection._provisionalData[chosenId]).toBe(undefined);
    expect(MyCollection.data[chosenId]).toBe(data);
    expect(MyCollection.data[chosenId].watchers[watcherId]).toBeDefined();
  });

  test('getDataValue returns null if data does not exist', () => {
    expect(MyCollection.getDataValue('myNameJeff')).toBe(null);
  });
});
