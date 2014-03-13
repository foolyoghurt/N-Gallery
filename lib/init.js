var http = require('http'),
  net = require('net'),
  fs = require('fs'),
  exec = require('child_process').exec,
  util = require('util');
  app = require('../app'),
  log = require('../lib/logger'),
  conf = require('../lib/config').config;

module.exports = function (cwd, args) {

  var url = 'http://localhost' + (conf.port ? (':' + conf.port) : '');
  var cmds = {
    f: null,
    file: null,
    b: false,
    dirs: []
  };
  
  util._extend(cmds, args);
  if (cmds._.length) {
    cmds.dirs = cmds._;
  }
  
  // -file | -f : specify file path in which one album base path per line
  // -b : open site url in browser immediately

  for (var key in cmds) {
    if (key != '_') {
      log(key + ': ' + cmds[key], 'debug');
    }
  }
  console.log();
  
  if (cmds.f || cmds.file) {
    var fileName = cmds.f || cmds.file;
    var lines = fs.readFileSync(fileName, 'utf8').split('\n');
    conf.album_base_dirs = [];
    lines.forEach(function(line) {
      if (!line.match(/^\s*$/)) {
        conf.album_base_dirs.push(line.trim());
      }
    });
  } else if (cmds.dirs.length) {
    conf.album_base_dirs = cmds.dirs;
  }

  // if not run from the right click menu (TODO)
  if(!cmds.mode || (cmds.mode != 'set-path' && cmds.mode != 'add-path')) {
    app.run(conf.port);
    if (cmds.b) {
      openUrlInBrowser(url);
    }
    return;

  }

  // Check if the port is listened
  if (cmds.mode == 'set-path') {
    var server = net.createServer();

    server.once('error', function (err) {
      if (err.code === 'EADDRINUSE') {
        // port is currently in use
      }
    });

    server.once('listening', function () {
      // close the server if listening doesn't fail
      server.close();

      app.run(conf.port);

    });

    server.listen(conf.port);
  }

  http.get({
      hostname: 'localhost',
      port: conf.port,
      path: "/operationHandler?album_base_dir=" + cwd + "&mode=" + cmds.mode},
    function (res) {
      var stat = '';

      //another chunk of data has been received, so append it to `str`
      res.on('data', function (chunk) {
        stat += chunk;
      });

      //the whole response has been received, so we just print it out here
      res.on('end', function () {
        stat = JSON.parse(stat);
        if (stat.status == 'OK') {
          if (cmds.mode == 'set-path') {
            openUrlInBrowser(url);
          }
        } else {
          log(stat.msg, 'fail');
        }
      });
    });

};

function openUrlInBrowser(url) {
  var cmd = (process.platform === 'win32') ? 'start' : 'xdg-open'; 
  exec(cmd + ' ' + url,
    function (err) {
      if (err) {
        log(err, 'error');
      }
    });
}
