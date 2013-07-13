var async = require('async');
var http = require('http');
var cheerio = require('cheerio');
var _ = require('underscore');
var urls = [];
var rootDomain = '';

module.exports = exports = Tackle = function(domain) {
  rootDomain = domain;
  console.log(domain);
  crawl(domain, function() {
    console.log('testing');
    test();
  });
};

var test = function() {
  var calls = [];

  async.waterfall([
  function(cb) {
    _.each(urls, function(url) {
      var call = function(cb) { testUrl(url, cb); };
      calls.push(call);
    });
    cb();
  },
  function(cb) {
    async.parallel(calls, function(err, results) {
      if(err) cb(err);
      console.log('completed checking urls');
    });
  }
  ], function(err,results) {
    console.log('ended here');
    console.log(results);
  });

};

var testUrl = function(url, cb) {
  if(!url.checked) {
    http.get(url.url, function(res) {
      if(res.statusCode == 200) {
        url.isUp = true;
        url.checked = true;
        cb(null);
        //crawl(url.url,next);
      }
      else {
        cb(null);
      }

      res.on('data', function(data) {

      });
      res.on('end', function() {
        console.log('checked ', url.url);
      });
    });
  } else {
    next();
  }
};

var crawl = function(url, cb) {
  var data;
  http.get(url, function(res) {
    res.on('data', function(page) {
      data += page;
    });

    res.on('end', function() {
      var $ = cheerio.load(data);
      collect($, 'a');
      collect($, 'link');
      collect($, 'script');

      cb();
    });

  }).on('error', function(err) {
    console.log(err);
  });
};

var collect = function($, sel) {
  var links = $(sel);
  _.each(_.pairs(links), function(link) {
    if(link[1].attribs && (link[1].attribs.href || link[1].attribs.src)) {
      var href = link[1].attribs.href ? link[1].attribs.href : link[1].attribs.src;
      if(href.indexOf('http://') < 0) 
        href = rootDomain + '' + href;

      var url = {
        'url': href,
        'isUp': false,
        'checked': false
      };

      if(find(url, urls) === undefined) 
        urls.push(url);
    }
  });
};

var find = function(object, array) {
  _.each(array, function(o) {
    if(o.url === object.url)
      return o;
  });
};


Tackle('http://triune.richmondday.com');
