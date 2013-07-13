var async = require('async');
var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var _ = require('underscore');
var urls = [];
var rootDomain = '';

module.exports = exports = Tackle = function(domain) {
  urls = [];
  rootDomain = domain;
  console.log('Testing links on: ', domain);
  crawl(domain, function() {
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
        if(err) {
          console.log(err);
          cb(err);
        }
        var total = urls.length;
        var checked = [];
        var failed = [];
        _.each(urls, function(u) {
          if(u.checked) checked.push(u); 
          if(!u.isUp) failed.push(u);
        });
        console.log('---------');
        console.log(total, 'Total');
        console.log(failed.length, 'Failed');
        _.each(failed, function(u) {
          console.log(u.url);
        });
      });

    }
  ], function(err,results) {
    console.log('ended here');
    console.log(results);
  });
};

var testUrl = function(url, cb) {
  var req;
  if(!url.checked) {
    if(url.isSecure) {
      req = https.get(url.url, function(res) {
        handleResponse(res, url, cb);
      });
    } else {
      req = http.get(url.url, function(res) {
        handleResponse(res, url, cb);
      });
    }

    req.on('error', function(err) {
      url.isUp = false;
      url.checked = true;
      cb(null);
    });
  } else {
    next();
  }
};

var handleResponse = function(res, url, cb) {
  if(res.statusCode == 200) {
    url.isUp = true;
    url.checked = true;
    cb(null);
    //crawl(url.url,next);
  }
  else {
    url.isUp = false;
    url.checked = true;
    cb(null);
  }

  res.on('data', function(data) {

  });
  res.on('error', function(err) {
    url.isUp = false;
    url.checked = true;
    cb(null);
  });
  res.on('end', function() {
  });
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
  console.log('found ', links.length, ' of type ', sel);
  _.each(_.pairs(links), function(link) {
    if(link[1].attribs && (link[1].attribs.href || link[1].attribs.src)) {
      var href = link[1].attribs.href ? link[1].attribs.href : link[1].attribs.src;
      if(href.slice(0,4) !== 'http')
        href = rootDomain + '' + href;

      var isSecure = href.slice(0,5) === 'https';

        var url = {
          'url': href,
          'isUp': false,
          'isSecure': isSecure,
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
