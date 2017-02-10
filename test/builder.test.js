const expect = require('chai').expect;
const Builder = require('../builder');
const ParamSpecTypeError = Builder.ParamSpecTypeError;
const MissingArgumentError = Builder.MissingArgumentError;
const NullArgumentError = Builder.NullArgumentError;

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

  describe('constructor', function () {
    const cnstr = function () { return true; };
    // Chai throw(...) assertions expect a function, which will be called to see what it throws
    function buildWithParamSpec(paramspec) {
      return function() {
        return new Builder(paramspec, cnstr);
      }
    }

    it('requires an array for the first parameter', function () {
      expect(buildWithParamSpec()).to.throw(TypeError, 'array of parameter'); // undefined
      expect(buildWithParamSpec(null)).to.throw(TypeError, 'array of parameter'); // null
      expect(buildWithParamSpec(1)).to.throw(TypeError, 'array of parameter'); // number
      expect(buildWithParamSpec("hello")).to.throw(TypeError, 'array of parameter'); // string
      expect(buildWithParamSpec(true)).to.throw(TypeError, 'array of parameter'); // boolean
      expect(buildWithParamSpec(cnstr)).to.throw(TypeError, 'array of parameter'); // function
      expect(buildWithParamSpec({})).to.throw(TypeError, 'array of parameter'); // non-array object
    });

    it('requires a function for the second parameter', function () {
      function buildWithConstructor(cnstr) {
        return function() {
          return new Builder([], cnstr);
        }
      }

      expect(buildWithConstructor()).to.throw(TypeError, 'requires a function'); // undefined
      expect(buildWithConstructor(null)).to.throw(TypeError, 'requires a function'); // null
      expect(buildWithConstructor(1)).to.throw(TypeError, 'requires a function'); // number
      expect(buildWithConstructor("hello")).to.throw(TypeError, 'requires a function'); // string
      expect(buildWithConstructor(true)).to.throw(TypeError, 'requires a function'); // boolean
      expect(buildWithConstructor({})).to.throw(TypeError, 'requires a function'); // object
      expect(buildWithConstructor([])).to.throw(TypeError, 'requires a function'); // array
    });

    it('requires non-null objects for parameter specifications', function () {
      expect(buildWithParamSpec([null])).to.throw(ParamSpecTypeError); // null
      expect(buildWithParamSpec([undefined])).to.throw(ParamSpecTypeError); // undefined
      expect(buildWithParamSpec([cnstr])).to.throw(ParamSpecTypeError); // function
      expect(buildWithParamSpec([1])).to.throw(ParamSpecTypeError); // number
      expect(buildWithParamSpec(["hello"])).to.throw(ParamSpecTypeError); // string
      expect(buildWithParamSpec([true])).to.throw(ParamSpecTypeError); // boolean
    });

    it('requires parameter specifications to have a string name', function () {
      expect(buildWithParamSpec([{}])).to.throw(ParamSpecTypeError); // no "name" property
      expect(buildWithParamSpec([{ name: null }])).to.throw(ParamSpecTypeError); // name is null
      expect(buildWithParamSpec([{ name: 1 }])).to.throw(ParamSpecTypeError); // name is a number
      expect(buildWithParamSpec([{ name: true }])).to.throw(ParamSpecTypeError); // name is a boolean
      expect(buildWithParamSpec([{ name: cnstr }])).to.throw(ParamSpecTypeError); // name is a function
      expect(buildWithParamSpec([{ name: {} }])).to.throw(ParamSpecTypeError); // name is an object
      expect(buildWithParamSpec([{ name: [] }])).to.throw(ParamSpecTypeError); // name is an array
    });

    it('requires parameter itemName, if truthy, to be a string', function () {
      expect(buildWithParamSpec([{ name: 'myParam', itemName: 1 }])).to.throw(ParamSpecTypeError); // name is a number
      expect(buildWithParamSpec([{ name: 'myParam', itemName: true }])).to.throw(ParamSpecTypeError); // name is a boolean
      expect(buildWithParamSpec([{ name: 'myParam', itemName: cnstr }])).to.throw(ParamSpecTypeError); // name is a function
      expect(buildWithParamSpec([{ name: 'myParam', itemName: {} }])).to.throw(ParamSpecTypeError); // name is an object
      expect(buildWithParamSpec([{ name: 'myParam', itemName: [] }])).to.throw(ParamSpecTypeError); // name is a number
    });
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

    it('enforces required parameters', function () {
      const Bldr = new Builder([
        { name: 'param1', isRequired: true },
        { name: 'param2' },
        { name: 'param3', isRequired: true }
      ], TestConstructor);

      expect(function () {
        (new Bldr()).build();
      }).to.throw(MissingArgumentError);
      expect(function () {
        (new Bldr()).setParam2(0).build();
      }).to.throw(MissingArgumentError);
      expect(function () {
        (new Bldr()).setParam1(0).build();
      }).to.throw(MissingArgumentError);
      expect(function () {
        (new Bldr()).setParam3(0).build();
      }).to.throw(MissingArgumentError);
      expect(function () {
        (new Bldr()).setParam1(false).setParam3(false).build();
      }).to.be.ok;
    });

    it('enforces non-nullable parameters', function () {
      const Bldr = new Builder([
        { name: 'param1', isRequired: true, isNullable: true },
        { name: 'param2' },
        { name: 'param3', isRequired: true }
      ], TestConstructor);

      expect(function () {
        (new Bldr()).setParam1(null).setParam3(null).build();
      }).to.throw(NullArgumentError);
      expect(function () {
        (new Bldr()).setParam1(undefined).setParam3(0).build();
      }).to.throw(MissingArgumentError);
      expect(function () {
        return (new Bldr()).setParam1(null).setParam3(0).build();
      }).to.be.ok;
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

    it('requires an array for list parameters', function () {
      const Bldr = new Builder([
        { name: 'param1', isList: true }
      ], TestConstructor);
      function setParam1(param1Val) {
        return function () {
          return (new Bldr()).setParam1(param1Val);
        };
      }

      expect(setParam1()).to.throw(TypeError); // undefined
      expect(setParam1(null)).to.throw(TypeError); // null
      expect(setParam1(1)).to.throw(TypeError); // number
      expect(setParam1("hello")).to.throw(TypeError); // string
      expect(setParam1(true)).to.throw(TypeError); // boolean
      expect(setParam1(setParam1)).to.throw(TypeError); // function
      expect(setParam1({})).to.throw(TypeError); // non-array object
      expect(setParam1([])).to.be.ok; // happy-path
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
        .addMapParam('key2', 'val2.2')
        .addMapParam('key3', 'val3')
        .addMapParam('key4', 'val4')
        .build();
      expect(buildResult.args).to.deep.equal([{
        'key1': 'val1',
        'key2': 'val2.2',
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
