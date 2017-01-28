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
  }); // end describe #build()

  describe('#setX(value)', function() {
    it('is created for a specified parameter', function() {
      const Bldr = new Builder([{ name: 'param' }], TestConstructor);
      const builder = (new Bldr());
      expect(builder.setParam).to.exist;
      expect(builder.setParam).to.be.a('function');
    });

    it('ignores the itemName attribute', function() {
      const Bldr = new Builder([
        { name: 'param', itemName: 'foo' },
        { name: 'listParam', isList: true, itemName: 'bar' },
        { name: 'mapParam', isList: true, itemName: 'baz' }
      ], TestConstructor);
      const builder = new Bldr();
      expect(builder.setFoo).to.be.undefined;
      expect(builder.setBar).to.be.undefined;
      expect(builder.setBaz).to.be.undefined;
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
  }); // end describe #setX(value)

  describe('#addX(value)', function() {
    it('is created for any list parameters', function() {
      const Bldr = new Builder([
        { name: 'listParam1', isList: true },
        { name: 'listParam2', isList: true }
      ], TestConstructor);
      const builder = new Bldr();
      expect(builder.addListParam1).to.exist;
      expect(builder.addListParam1).to.be.a('function');
      expect(builder.addListParam2).to.exist;
      expect(builder.addListParam2).to.be.a('function');
    });

    it('is only created for list or map parameters', function() {
      const Bldr = new Builder([
        { name: 'listParam', isList: true },
        { name: 'scalarParam' }
      ], TestConstructor);
      const builder = new Bldr();
      expect(builder.addListParam).to.exist;
      expect(builder.addListParam).to.be.a('function');
      expect(builder.addScalarParam).to.be.undefined;
    });

    it('uses the itemName attribute if it exists', function () {
      const Bldr = new Builder([
        { name: 'children', isList: true, itemName: 'child' }
      ], TestConstructor);
      const builder = new Bldr();
      expect(builder.addChild).to.exist;
      expect(builder.addChild).to.be.a('function');
    });

    it('accumulates in order the values passed to it', function() {
      const Bldr = new Builder([
        { name: 'listParam', isList: true }
      ], TestConstructor);
      const buildResult = (new Bldr())
        .addListParam('val1')
        .addListParam('val2')
        .addListParam('val3')
        .build();
      expect(buildResult.args).to.deep.equal([['val1', 'val2', 'val3']]);
    });

    it('appends to the list set by setX(value)', function() {
      const Bldr = new Builder([
        { name: 'listParam', isList: true }
      ], TestConstructor);
      const buildResult = (new Bldr())
        .setListParam(['val1', 'val2'])
        .addListParam('val3')
        .addListParam('val4')
        .build();
      expect(buildResult.args).to.deep.equal([['val1', 'val2', 'val3', 'val4']]);
    });

    it('is overridden by setX(value)', function() {
      const Bldr = new Builder([
        { name: 'listParam', isList: true }
      ], TestConstructor);
      const buildResult = (new Bldr())
        .addListParam('val3')
        .addListParam('val4')
        .setListParam(['val1', 'val2'])
        .build();
      expect(buildResult.args).to.deep.equal([['val1', 'val2']]);
    });
  }); // end describe #addX(value)

  describe('#addX(key, value)', function () {
    it('is created for any map parameters', function() {
      const Bldr = new Builder([
        { name: 'mapParam1', isMap: true },
        { name: 'mapParam2', isMap: true }
      ], TestConstructor);
      const builder = new Bldr();
      expect(builder.addMapParam1).to.exist;
      expect(builder.addMapParam1).to.be.a('function');
      expect(builder.addMapParam2).to.exist;
      expect(builder.addMapParam2).to.be.a('function');
    });

    it('is only created for list or map parameters', function() {
      const Bldr = new Builder([
        { name: 'listParam', isList: true },
        { name: 'mapParam', isMap: true },
        { name: 'scalarParam' }
      ], TestConstructor);
      const builder = new Bldr();
      expect(builder.addListParam).to.exist;
      expect(builder.addListParam).to.be.a('function');
      expect(builder.addMapParam).to.exist;
      expect(builder.addMapParam).to.be.a('function');
      expect(builder.addScalarParam).to.be.undefined;
    });

    it('uses the itemName attribute if it exists', function () {
      const Bldr = new Builder([
        { name: 'options', isMap: true, itemName: 'option' }
      ], TestConstructor);
      const builder = new Bldr();
      expect(builder.addOption).to.exist;
      expect(builder.addOption).to.be.a('function');
    });

    it('maps the key-value pairs passed to it into the parameter object', function() {
      const Bldr = new Builder([
        { name: 'mapParam', isMap: true }
      ], TestConstructor);
      const buildResult = (new Bldr())
        .addMapParam('key1', 'val1')
        .addMapParam('key2', 'val2')
        .addMapParam('key3', 'val3')
        .build();
      expect(buildResult.args).to.deep.equal([{
        'key1': 'val1',
        'key2': 'val2',
        'key3': 'val3'
      }]);
    });

    it('adds to the object set by setX(value)', function() {
      const Bldr = new Builder([
        { name: 'mapParam', isMap: true }
      ], TestConstructor);
      const buildResult = (new Bldr())
        .setMapParam({ 'key1': 'val1', 'key2': 'val2' })
        .addMapParam('key3', 'val3')
        .addMapParam('key4', 'val4')
        .build();
      expect(buildResult.args).to.deep.equal([{
        'key1': 'val1',
        'key2': 'val2',
        'key3': 'val3',
        'key4': 'val4'
      }]);
    });

    it('is overriden by setX(value)', function() {
      const Bldr = new Builder([
        { name: 'mapParam', isMap: true }
      ], TestConstructor);
      const buildResult = (new Bldr())
        .addMapParam('key3', 'val3')
        .addMapParam('key4', 'val4')
        .setMapParam({ 'key1': 'val1', 'key2': 'val2' })
        .build();
      expect(buildResult.args).to.deep.equal([{
        'key1': 'val1',
        'key2': 'val2'
      }]);
    });
  }); // end describe #addX(key, value)
});
