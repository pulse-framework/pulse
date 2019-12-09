```js
import Pulse from 'pulse-framework';

const pulse = new Pulse();

pulse.on('EVENT_NAME', this, payload => console.log(payload));

pulse.emit('EVENT_NAME', {});

export const collection = pulse.createCollection();

export const someData = collection
  .createData(defaultValue)
  .persist()
  .watch(() => {});

export const myGroup = collection.createGroup([]);

someData.value;
someData.set();
someData.subscribe(this);

collection.createAction('getChannels', () => {});

export const myComputedValue = collection.createComputed(() => {}, [someData]);
```
