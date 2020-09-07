import 'mocha';
import { expect } from 'chai';
import { Pulse, StatusTracker } from '../../lib/internal';

// todo: properly make reusable functions
// todo: use sub-units (describe->describe->it) for each function

describe('StatusTracker', () => {
  const App = new Pulse({ noCore: true });
  const tracker = new StatusTracker(() => App);

  it('-> is empty on initialization', () => {
    expect(tracker.all).to.eql({});
  });

  it('.set() -> adds item properly', () => {
    tracker.set('username');
    expect(tracker.all).to.have.key('username');
    expect(tracker.get('username')).to.eql({ message: null, status: null });
  });

  it('.get() -> returns nothing with a non-existent key', () => {
    expect(tracker.get('nonexistent')).to.eq(undefined);
  });

  it('.set() -> updates values properly', () => {
    tracker.set('username').status('invalid');
    expect(tracker.get('username').status).to.eq('invalid');
    expect(tracker.all.username.status).to.eq('invalid');

    tracker.set('username').status('none');
    expect(tracker.get('username').status).to.eq(null);
    expect(tracker.all.username.status).to.eq(null);

    tracker.set('username').message('test message');
    expect(tracker.get('username').message).to.eq('test message');
    expect(tracker.all.username.message).to.eq('test message');
  });

  it('.clear() -> resets value properly', () => {
    tracker.clear('username');
    expect(tracker.get('username').message).to.eq(null);
    expect(tracker.all.username.status).to.eq(null);
  });

  it('.remove() -> removes value properly', () => {
    expect(tracker.get('username')).to.eql({ message: null, status: null });
    tracker.remove('username');
    expect(tracker.get('username')).to.eql(undefined);
  });

  it('.clear() -> resets instance properly', () => {
    tracker.clear();
    expect(tracker.all).to.eql({});
  });
});
