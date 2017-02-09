'use strict';

///// Helper Functions /////
function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}
function captlize1stChar(str) {
  return str.slice(0,1).toUpperCase() + str.slice(1);
}
// Construct a new object with the given constructor and constructor arguments
function invokeCnstr(cnstr, args) {
  function F() {
      // constructor returns **this**
      return cnstr.apply(this, args);
  }
  F.prototype = cnstr.prototype;
  let f = new F();
  f.constructor = cnstr;
  return f;
}

///// Custom Errors /////
class ParamSpecTypeError extends TypeError {
  constructor(paramName, message) {
    super(`Parameter specification ${paramName}${message ? ': '+message : ''}`);
  }
}
// Error.prototype.name determines the error name in the stack trace
ParamSpecTypeError.prototype.name = 'ParamSpecTypeError';
class MissingArgumentError extends TypeError {
  constructor(paramName) {
    super(`Required parameter ${paramName} is undefined or missing`);
  }
}
MissingArgumentError.prototype.name = 'MissingArgumentError';
class NullArgumentError extends TypeError {
  constructor(paramName) {
    super(`Non-nullable parameter ${paramName} is null`);
  }
}
NullArgumentError.prototype.name = 'NullArgumentError';

///// Main Code - Builder Constructor /////
function Builder(paramspec, cnstr) {
  if (!isArray(paramspec)) {
    throw new TypeError('Builder constructor requires an array of parameter specifications as first argument.');
  }
  if (typeof(cnstr) !== 'function') {
    throw new TypeError('Builder constructor requires a function (constructor) as second argument.');
  }
  function typecheckParamSpec(param) {
    if (param === null || typeof(param) !== 'object') {
      throw new ParamSpecTypeError('must be a non-null object');
    } // if we didn't check for null, the typeof(param.name) below could blow up
    if (typeof(param.name) !== 'string') {
      throw new ParamSpecTypeError('requires string property "name"');
    }
    if (param.itemName && typeof(param.itemName) !== 'string') {
      throw new ParamSpecTypeError(param.name, 'itemName must be a string');
    }
  }

  let Bldr = function() {
    this.args = {};
  };
  let requiredParams = []; // Array for fast iteration
  let nullables = {}; // Map for fast lookup
  for (const param of paramspec) {
    typecheckParamSpec(param);

    const name = param.name;
    const itemName = (param.isList || param.isMap) && param.itemName ? param.itemName : name;
    if (param.isRequired) { requiredParams.push(name) }
    if (param.isNullable) { nullables[name] = true }

    Bldr.prototype['set'+captlize1stChar(name)] = function(val) {
      this.args[name] = val;
      return this;
    };

    if (param.isList && param.isMap) {
      throw new ParamSpecTypeError(name, 'isList and isMap are mutually exclusive');
    }
    if (param.isList) {
      Bldr.prototype['add'+captlize1stChar(itemName)] = function(val) {
        if (!this.args[name]) { this.args[name] = [] }
        this.args[name].push(val);
        return this;
      };
    }
    if (param.isMap) {
      Bldr.prototype['add'+captlize1stChar(itemName)] = function(key, val) {
        if (!this.args[name]) { this.args[name] = {} }
        this.args[name][key] = val;
        return this;
      };
    }
  }

  Bldr.prototype.build = function() {
    for (const requiredParam of requiredParams) {
      if (this.args[requiredParam] === undefined) {
        throw new MissingArgumentError(requiredParam);
      }
      if (!nullables[requiredParam] && this.args[requiredParam] === null) {
        throw new NullArgumentError(requiredParam);
      }
    }

    let argsList = [];
    for (const param of paramspec) { argsList.push(this.args[param.name]) }
    return invokeCnstr(cnstr, argsList);
  };

  return Bldr;
}

///// Exports: Builder constructor as module object, custom errors as properties
Builder.ParamSpecTypeError = ParamSpecTypeError;
Builder.MissingArgumentError = MissingArgumentError;
Builder.NullArgumentError = NullArgumentError;
module.exports = Builder;
