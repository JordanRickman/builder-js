'use strict';

function captlize1stChar(str) {
  return str.slice(0,1).toUpperCase() + str.slice(1);
}
class ParamSpecTypeError extends TypeError {
  constructor(paramName, message) {
    super(`Parameter spec ${paramName}${message ? ': '+message : ''}`);
  }
}
class MissingArgumentError extends TypeError {
  constructor(paramName) {
    super(`Required parameter ${paramName} is undefined or missing`);
  }
}
class NullArgumentError extends TypeError {
  constructor(paramName) {
    super(`Non-nullable parameter ${paramName} is null`);
  }
}
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

function Builder(paramspec, cnstr) {
  let Bldr = function() {
    this.args = {};
  };

  let requiredParams = []; // Array for fast iteration
  let nullables = {}; // Map for fast lookup
  for (const param of paramspec) {
    const name = param.name;
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
      Bldr.prototype['add'+captlize1stChar(name)] = function(val) {
        if (!this.args[name]) { this.args[name] = [] }
        this.args[name].push(val);
        return this;
      };
    }
    if (param.isMap) {
      Bldr.prototype['add'+captlize1stChar(name)] = function(key, val) {
        if (!this.args[name]) { this.args[name] = {} }
        this.args[name][key] = val;
        return this;
      };
    }
  }

  Bldr.prototype.build = function() {
    for (requiredParam in requiredParams) {
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

module.exports = Builder;
