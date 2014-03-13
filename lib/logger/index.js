var colors = require('colors');
var colorTheme = {
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  success: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'green',
  update: 'cyan',
  move: 'yellow',
  delete: 'yellow',

  // Operation failed
  fail: 'red',
  error: 'red'
};

colors.setTheme(colorTheme);

function logToConsole (data, type) {
  if (!type || !(type in colorTheme)) {
    type = 'info';
  }

  var typeStr = type.toLocaleUpperCase();
  process.stdout.write('[');
  process.stdout.write(typeStr[type]);
  process.stdout.write('] ');
  console.log(data);
}

function logToFile (data, type) {
  // TODO
}

var logger = function (data, type, file) {
  file ? logToFile(data, type) : logToConsole(data, type);
};

logger.setFormat = function (format) {
  // TODO
};

module.exports = logger;
