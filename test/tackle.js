var assert = require('assert');
var Tackle = require('../lib/tackle');

describe('tackle with invalid arguments' ,function() {
  describe('tackle with no domain', function() {
    it('should throw an error', function() {
      assert.throws(
        function() { var tackle = new Tackle('',{}); },
        Error
      );
    });
  });
});

describe('tackle with valid arguments', function() {
  describe('with domain', function() {
    it('should create without error', function() {
      assert.doesNotThrow(
        function() { var tackle = new Tackle('www.cnn.com',{});},
        Error
      );
    });
  });
});
