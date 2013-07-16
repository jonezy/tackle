var _ = require('underscore');
var async = require('async');
var cheerio = require('cheerio');
var colors = require('colors');
var http = require('http');
var https = require('https');
var moment = require('moment');
var url = require('url');

var urls = [];
var rootDomain = '';

var start, end;
var limit;

module.exports = exports = Tackle = function(domain, opts, done) {
  urls = [];
  if(domain.slice(0, 4) !== 'http') domain = 'http://' + domain;
  rootDomain = url.parse(domain).protocol + '//' + url.parse(domain).host;
  if(rootDomain.indexOf('/', rootDomain.length - '/'.length) === -1)
    rootDomain = rootDomain + '/';

  if(opts) {
    if(opts.limit) limit = opts.limit;

  }
  console.log();
  console.log('Collecting links on: %s'.bold, domain);
  console.log('---------');

  crawl(domain, function() {
    if(limit !== 'undefined') {
      _.shuffle(urls);
      urls = urls.slice(0,limit);
    }
    test(done);
  });
};

var test = function(done) {
  console.log();
  console.log('Testing %s urls.  This might take a minute'.bold, urls.length);
  start = new Date();
  console.log('---------');

  async.forEachLimit(urls, 5, function(u, next) {
    testUrl(u,next);
  },
  function(err) {
    end = new Date();
    if(err) console.log(err);
    done && done(buildReport());
  });
};

var testUrl = function(url, cb) {
  var req;
  if(!url.checked) {
    req = url.isSecure ? 
            https.get(url.url, function(res) { handleResponse(res, url, cb); }) :
            http.get(url.url, function(res) { handleResponse(res, url, cb); });

    req.on('error', function(err) {
      url.isUp = false;
      url.checked = true;
      cb(null);
    });
  } else {
    cb(null);
  }
};

var handleResponse = function(res, url, cb) {
  if(res.statusCode == 200 || res.statusCode === 301 || res.statusCode === 302) {
    url.isUp = true;
    url.checked = true;
  }
  else {
    url.isUp = false;
    url.checked = true;
  }

  res.on('data', function(data) { });
  res.on('error', function(err) {
    url.isUp = false;
    url.checked = true;
    cb(null);
  });

  res.on('end', function() {
    var msg = 'Checked: ' + url.url.green;
    if(!url.isUp) msg = 'Checked: ' +  url.url.red;
    console.log(msg);
    cb(null);
  });
};

var crawl = function(url, cb) {
  var req = url.slice(0, 5) === 'https' ? 
            https.get(url, function(res) { handleCrawlResponse(res, cb); }) :
            http.get(url, function(res) { handleCrawlResponse(res, cb); });

  req.on('error', function(err) {
    console.log(err);
  });
};

var handleCrawlResponse = function(res, cb) {
  var data;
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
};

var collect = function($, sel) {
  var links = $(sel);
  console.log('Found  %s  of type %s', links.length, sel);
  _.each(_.pairs(links), function(link) {
    if(link[1].attribs && (link[1].attribs.href || link[1].attribs.src)) {
      var href = link[1].attribs.href ? link[1].attribs.href : link[1].attribs.src;
      if(href.indexOf('javascript:') === -1) {
        if (href.slice(0,1) === '/') href = href.substr(1, href.length);
        if (href.slice(0,2) === '//') href = 'http:' + href;
        if (href.slice(0,4) !== 'http') href = rootDomain + '' + href;

        // eventually turn this into a whitelist op
        if(href !== rootDomain + '#') {
          var isSecure = href.slice(0,5) === 'https';
          var u = {
            'url': href,
            'isUp': false,
            'isSecure': isSecure,
            'checked': false
          };

          if(find(u, urls) === undefined) 
            urls.push(u);
        }
      }
    }
  });
};

var find = function(object, array) {
  _.each(array, function(o) {
    if(o.url === object.url)
      return o;
  });
};

var buildReport = function() {
  var total = urls.length;
  var checked = [];
  var failed = [];
  var up = [];
  _.each(urls, function(u) {
    if(u.checked) checked.push(u); 
    if(!u.isUp) failed.push(u);
    else up.push(u);
  });

  var startMoment = moment(start);
  var endMoment = moment(end);
  var diff = endMoment.diff(startMoment, 'seconds');
  var duration = moment.duration(diff, 'seconds').humanize();


  return  {
    'total':total,
    'checked':checked,
    'up': up,
    'failed':failed,
    'duration': duration
  };
};