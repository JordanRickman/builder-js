const expect = require('chai').expect;
const Builder = require('../builder');

// For verifying that the constructor is called correctly, we need to:
// 1) capture the constructor arguments
// 2) set a property of `this` within the constructor
// 3) have a prototype property
const constructorMsg = 'This object was constructed with TestConstructor';
const prototypeMsg = 'This object has the TestConstructor prototype';
function TestConstructor() {
  // Convert the native 'arguments' object to a true array for easier comparison
  this.args = Array.prototype.slice.call(arguments);
  this.cnstrTest = constructorMsg;
}
TestConstructor.prototype.protoTest = prototypeMsg;

describe('Builder', function() {
  it('exports the Builder constructor', function() {
    expect(Builder).to.exist;
    expect(Builder).to.be.a('function');
  });

  describe('#build()', function() {
    it('constructs via the passed constructor', function() {
      const Bldr = new Builder([], TestConstructor);
      const buildResult = (new Bldr()).build();
      expect(buildResult).to.exist;
      expect(buildResult.args).to.deep.equal([]); // must use deep equal, [] !== []
      expect(buildResult.cnstrTest).to.equal(constructorMsg);
      expect(buildResult.hasOwnProperty('cnstrTest')).to.be.true;
      expect(buildResult.protoTest).to.equal(prototypeMsg);
      expect(buildResult.hasOwnProperty('protoTest')).to.be.false;
      expect(buildResult.__proto__).to.equal(TestConstructor.prototype);
      expect(buildResult.constructor).to.equal(TestConstructor);
    });

    it('iterates through all specified parameters', function() {
      const Bldr = new Builder([
        { name: 'param1' },
        { name: 'param2' },
        { name: 'param3' }
      ], TestConstructor);
      const buildResult = (new Bldr()).build();
      expect(buildResult.args).to.deep.equal([undefined, undefined, undefined]);
    });
  });

  describe('#setX(value)', function() {
    it('is created for a specified parameter', function() {
      const Bldr = new Builder([{ name: 'param' }], TestConstructor);
      const builder = (new Bldr());
      expect(builder.setParam).to.exist;
      expect(builder.setParam).to.be.a('function');
    });

    it('sets the specified parameter', function() {
      const val = 'param value';
      const Bldr = new Builder([{ name: 'param' }], TestConstructor);
      const buildResult = (new Bldr()).setParam(val).build();
      expect(buildResult.args).to.deep.equal([val]);
    });

    it('leaves the parameter undefined if not called', function() {
      const Bldr = new Builder([{ name: 'param' }], TestConstructor);
      const buildResult = (new Bldr()).build();
      expect(buildResult.args.length).to.equal(1);
      expect(buildResult.args[0]).to.be.undefined;
    });

    it('uses the last value when called multiple times', function() {
      const val1 = 'param value 1';
      const val2 = 'param value 2';
      const val3 = 'param value 3';
      const Bldr = new Builder([{ name: 'param' }], TestConstructor);
      const buildResult = (new Bldr())
        .setParam(val1)
        .setParam(val2)
        .setParam(val3)
        .build();
      expect(buildResult.args).to.deep.equal([val3]);
    });

    it('works for multiple specified parameters', function() {
      const val1 = 'param 1 value';
      const val2 = 'param 2 value';
      const Bldr = new Builder([
        { name: 'param1' },
        { name: 'param2' }
      ], TestConstructor);
      const buildResult = (new Bldr())
        .setParam1(val1)
        .setParam2(val2)
        .build();
      expect(buildResult.args).to.deep.equal([val1, val2]);
    });

    it('works in any order of calling', function() {
      const val1 = 'param 1 value';
      const val2 = 'param 2 value';
      const Bldr = new Builder([
        { name: 'param1' },
        { name: 'param2' }
      ], TestConstructor);
      const buildResult = (new Bldr())
        // only difference from previous test: call setParam2, THEN setParam1
        .setParam2(val2)
        .setParam1(val1)
        .build();
      expect(buildResult.args).to.deep.equal([val1, val2]);
    });
  });
});
