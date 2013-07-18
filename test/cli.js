var assert = require('assert');
var tackle = require('../bin/tackle');

describe('tackle cli', function() {
  it('should have a type option', function() {
    var found = findIn({'short':'-T','long':'--type'}, tackle.options);
    assert(found, true);
  });

  it('should have a limit option', function() {
    var found = findIn({'short':'-L','long':'--limit'}, tackle.options);
    assert(found, true);
  });

  it('should have one * command', function() {
    assert(tackle.commands[0]._name, '*');
  });
});

// helpers

function findIn(needle, haystack) {
  for(var h in haystack) {
    var option = haystack[h];
    if(option.short === needle.short && option.long === needle.long) {
      return true;
    }
  }
  return false;
}
