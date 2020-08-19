import { extractAll } from '../../lib/utils';
import { expect } from 'chai';
import 'mocha';

describe('extractAll function', () => {
  function baseExpect<T>(result: Set<T>) {
    expect(result).to.be.a('Set')
  }

  it('finds constructed Strings, but not primitives (in Array)', () => {
    // create test array of objects to search for
    const testArray: any[] = [
      'should not find',
      1234, // should not find
      new String('should find'),
      new String('should also find')
    ];

    // run test of extractAll
    const result = extractAll(String, testArray);

    baseExpect(result)
    // should only find two items
    expect(result.size).to.equal(2)
    // should not contain a primitive string item
    expect(result.has(testArray[0])).to.be.false
    // should not contain a primitive number item
    expect(result.has(testArray[1])).to.be.false
    // should contain string-construcor items
    expect(result.has(testArray[2])).to.be.true
    expect(result.has(testArray[3])).to.be.true
  });

  it('finds constructed Strings, but not primitives (in Object values)', () => {
    // create test object with objects to search for
    const testObj: { [key: string]: any } = {
      prim: 'should not find',
      num: 1234, // should not find
      find1: new String('should find'),
      find2: new String('should also find'),
      find3: new String('should also find, as well')
    };

    // run test of extractAll
    const result = extractAll(String, testObj);

    baseExpect(result)
    // should only find two items
    expect(result.size).to.equal(3)
    // should not contain a primitive string item
    expect(result.has(testObj.prim)).to.be.false
    // should not contain a primitive number item
    expect(result.has(testObj.num)).to.be.false
    // should contain string-construcor items
    expect(result.has(testObj.find1)).to.be.true
    expect(result.has(testObj.find2)).to.be.true
    expect(result.has(testObj.find3)).to.be.true
  });
});
