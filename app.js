/**
 * Module dependencies.
 */


var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var stylus = require('stylus');
var i18n = require('i18n');
var fs = require('fs');
var conf = require('./lib/config');
var log = require('./lib/logger');
var app = express();

i18n.configure({
  locales:['zh', 'en'],
  directory: __dirname + '/doc/locales'
});

// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon(__dirname + '/public/images/favicon.png'));
if (conf.env == 'development') {
  app.use(express.logger('dev'));
}
app.use(i18n.init);
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
if (conf.env == 'development') {
  app.use(stylus.middleware({
    force: true,
    src: __dirname + '/views',
    dest: __dirname + '/public'
  }));
}
app.use(express.static(path.join(__dirname, 'public')));

// 404
app.use(function(req, res, next){
  res.render('404', {content: '404 Not Found'});
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get(/^\/album\/(.*)/, routes.album);
app.get(/^\/folder\/(.*)/, routes.folder);
app.get(/^\/root\/(.*)/, routes.album);
app.get(/^\/local\/(.*)/, routes.local);
app.get('^/operationHandler', routes.operationHandler);
app.get('^/users', user.list);

exports.run = function (port) {
  
  // Check whether the directories are valid
  conf.album_base_dirs.forEach(function(dir, i, arr) {
    if (!fs.existsSync(dir)) {
      arr[i] = undefined;
      log(dir + ' is not a valid path', 'error');
    } else {
      arr[i] = arr[i].replace(/\\/g, '/').replace(/\/$/, '');
    }
  });
  conf.album_base_dirs = conf.album_base_dirs.filter(function(dir) { return dir; });
  log('Album Base Directory: ' + conf.album_base_dirs, 'info');
  
  http.createServer(app).listen(port, function () {
    console.log('Express server listening on port ' + port);
  });
};
