const assert = require('chai').assert;
const Builder = require('../builder');

describe('Builder', function() {
  it('loads chai', function() {
    assert.ok(true);
  });

  it('correctly exports the Builder function', function() {
    assert.ok(Builder);
    assert.typeOf(Builder, 'function');
  });
});
