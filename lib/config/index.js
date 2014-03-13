/*
 * Configuration
 * @module config
 * ==============
 */

var fs = require('fs');
var i18n = require('i18n');
var fsPlus = require('../fs-plus')
var log = require('../logger');


exports.config = require('./config');


/**
 * Validate the config object
 * @param opt_conf {Object}
 */
exports.validate = function validate(opt_conf) {

  var conf = opt_conf ? opt_conf : this.config;

  // Check whether the directories are valid
  conf.album_base_dirs.forEach(function(dir, i, arr) {
    if (!fs.existsSync(dir)) {
      arr[i] = undefined;
      log('Gallery Base Directory "' + dir + '" is not a valid path', 'warn');
    } else {
      arr[i] = arr[i].replace(/\\/g, '/').replace(/\/$/, '');
    }
  });
  conf.album_base_dirs = conf.album_base_dirs.filter(function(dir) { return dir; });
  if (conf.album_base_dirs.length) {
    log('Gallery Base Directory: ' + conf.album_base_dirs, 'info');
  } else {
    log('Not Any Valid Gallery Base Directories Specified', 'error');
  }

  // Check tmp dir in "mv" delete mode
  if (conf.delete_mode == 'mv') {
    if (!fs.existsSync(conf.tmp_dir)) {
      log('Tmp Directory "' + conf.tmp_dir + '" Not Exists', 'error');
    } else if (!fsPlus.isWritableSync(conf.tmp_dir)) {
      log('Tmp Directory "' + conf.tmp_dir + '" Not Writable', 'error');
    }
  }

  // conf.lang
  if (!conf.lang) {
    conf.lang = i18n.getLocale();
  } else if (!(conf.lang in i18n.getCatalog())) {
    log('Language specified in config file is not supported', 'warn');
    conf.lang = i18n.getLocale();
  }

  if (conf.env === 'development') {
    console.log();
    log('CONFIGURATION OPTIONS', 'debug');
    console.log(conf);
  }

};

