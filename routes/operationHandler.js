/*
 * Dealing with Ajax request
 * @module routes/operationHandler
 * ============================
 * 
 * For the delete operation on directory of three different types, each of which is different
 * 
 * "album": delete the images in it directly
 * "folder": delete recursively, so sub dirs will be deleted too
 * "root": delete just the images in it, sub dirs will be reserved
 * 
 */

var fs = require('fs.extra');
var util = require('util');
var fsPlus = require('../lib/fs-plus');
var path = require('path');
var log = require('../lib/logger');
var conf = require('../lib/config').config;

var reImgType = /(\.jpg|\.jpeg|\.gif|\.png)$/i;
var errorMsg = {
  0: 'Unknown error',
  1: 'No permission',
  2: 'File path not valid',
  3: 'Delete Failed',
  4: 'Move File Failed',
  5: 'Configuration Error, check out the config file'
};

exports.operationHandler = function (req, res) {

  var ret;
  var whiteList = conf.ip_white_list;
  var address = req.connection.remoteAddress;
  
  // check the permission
    if (whiteList.indexOf(address) == -1) {
    res.send({status: 'ERROR', msg: errorMsg[1]});
    log('Request from ' + address + ' was rejected!', 'fail');
    return;
  }


  // delete one image
  if (req.query['pic_path']) {
    ret = deleteImgs(req.query['pic_path']);
    
  } else if (req.query['pics_path']) {
    ret = deleteImgs(JSON.parse(req.query['pics_path']));
    
  } else if (req.query['albums']) {
    ret = deleteDirs(JSON.parse(req.query['albums']))
    
  } else if (req.query['album_base_dir']) {
    var mode = req.query['mode'];
    ret = changeGalleryBaseDir(req.query['album_base_dir'], mode);    
  }
  
  res.send(ret);
  
  if (ret.status == 'ERROR') {
    if (ret.err) {
      log(ret.err, 'error');
    }
    log(ret.msg, 'error');
  }

};


/**
 * Delete images
 * @param picsPath {[string] | string}
 * @returns {{status: string, msg: string, err: Error}}
 */
function deleteImgs(picsPath) {

  var ret = {};

  if (typeof picsPath === 'string') {
    picsPath = [picsPath];
  } else if (!util.isArray(picsPath) || !picsPath.length) {
    throw new Error('Argument type error, should be array or string');
  }

  // delete mode
  if (conf.delete_mode == 'del') {
    for (var i = 0; i < picsPath.length; i++) {
      try {
        fs.unlinkSync(picsPath[i]);
        ret = {status: 'OK'};
        log(picsPath[i], 'delete');
      } catch (e) {
        ret = {status: 'ERROR', msg: errorMsg[3], err: e};
      }
    }
  }

  // move mode
  else if (conf.delete_mode == 'mv') {
    var tmpDir = conf.tmp_dir;
    var dirName = fsPlus.toLinuxPath(path.dirname(picsPath[0])).replace(/\//g, '$').replace(':', '$$');
    if (!fs.existsSync(path.join(tmpDir, dirName))) {
      fs.mkdirRecursiveSync(path.join(tmpDir, dirName));
    }
    try {
      picsPath.forEach(function (picPath) {
        var fileName = path.basename(picPath);
        var destPath = path.join(tmpDir, dirName, fileName);
        fsPlus.moveSync(picPath, path.join(tmpDir, dirName));
        log(picPath + ' => ' + destPath, 'move');
      });
      ret = {status: 'OK'};
    } catch (e) {
      ret = {status: 'ERROR', msg: errorMsg[4], err: e};
    }

  } else {
    ret = {status: 'ERROR', msg: errorMsg[5]};
  }

  return ret;

}


/**
 * Delete multiple directories recursively
 * @param dirs {[{path: string, type: string}] | {path: string, type: string}}
 * @returns {{status: string, msg: string, err: Error}}
 */
function deleteDirs(dirs) {

  var ret = {status: 'OK'};

  if (!util.isArray(dirs) && typeof dirs === 'object') {
    dirs = [dirs];
  } else if (!util.isArray(dirs) || !dirs.length) {
    throw new Error('Argument type error, should be array or object');
  }

  dirs.forEach(function (dir) {

    var dirPath = dir.path;
    var dirType = dir.type;
    var tmpDir;
    var dirName;

    if (dirType == 'album' || dirType == 'folder') {

      // delete mode
      if (conf.delete_mode == 'del') {
        try {
          fs.rmrfSync(dirPath);
          log('FOLDER: ' + dirPath, 'delete');
        } catch (e) {
          ret = {status: 'ERROR', msg: errorMsg[3], err: e};
        }
      }

      // move mode
      else if (conf.delete_mode == 'mv') {
        tmpDir = conf.tmp_dir;
        dirName = fsPlus.toLinuxPath(dirPath).replace(/\//g, '$').replace(':', '$$');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirRecursiveSync(tmpDir);
        }
        try {
          var destPath = path.join(tmpDir, dirName);
          fsPlus.moveSync(dirPath, destPath);
          log('FOLDER: ' + dirPath + ' => ' + destPath, 'move');
        } catch (e) {
          ret = {status: 'ERROR', msg: errorMsg[4], err: e};
        }

      } else {
        ret = {status: 'ERROR', msg: errorMsg[5]};
      }

    }

    // just delete the images of directory, sub dirs will be reserved
    else if (dirType == 'root') {

      var files = fs.readdirSync(dirPath);

      // delete mode
      if (conf.delete_mode == 'del') {
        try {
          files.forEach(function (file) {
            var file_path = path.join(dirPath, file);
            if (fs.statSync(file_path).isFile() && reImgType.test(file)) {
              fs.unlinkSync(file_path);
              log(file_path, 'delete');
            }
          });
        } catch (e) {
          ret = {status: 'ERROR', msg: errorMsg[4]};
        }
      }

      // move mode
      else if (conf.delete_mode == 'mv') {
        tmpDir = conf.tmp_dir;
        dirName = fsPlus.toLinuxPath(dirPath).replace(/\//g, '$').replace(':', '$$');
        var destDirPath = path.join(tmpDir, dirName);

        if (!fs.existsSync(destDirPath)) {
          fs.mkdirRecursiveSync(destDirPath);
        }

        try {
          files.forEach(function (file) {
            var src = path.join(dirPath, file);
            var dest = path.join(destDirPath, file);
            if (fs.statSync(src).isFile() && reImgType.test(file)) {
              fsPlus.moveSync(src, destDirPath);
              log(src + ' => ' + dest, 'move');
            }
          });
        } catch (e) {
          ret = {status: 'ERROR', msg: errorMsg[4]};
        }
      } else {
        ret = {status: 'ERROR', msg: errorMsg[5]};
      }
    }

  });

  return ret;

}


/**
 * Change/add gallery base directory
 * @param baseDir {string}
 * @param mode {string}
 * @returns {{status: string, msg: string, err: Error}}
 */
function changeGalleryBaseDir(baseDir, mode) {

  var ret = {status: 'OK'};

  if (fs.existsSync(baseDir) && fs.statSync(baseDir).isDirectory()) {
    
    if (mode == 'add-path') {
      var noDuplicate = conf.album_base_dirs.every(function (dir) {
        return fsPlus.toLinuxPath(dir) !== fsPlus.toLinuxPath(baseDir);
      });

      if (noDuplicate) {
        conf.album_base_dirs.push(baseDir);
      } else {
        log('Same gallery base dir "' + baseDir + '" already exists');
      }
      
    } else if (mode == 'set-path') {
      conf.album_base_dirs = [baseDir];
    }
    
    log('Gallery base dir has been changed to: ' + conf.album_base_dirs, 'update');
    
  } else {
    log(errorMsg[2] + ': ' + baseDir, 'fail');
    ret = {status: "ERROR", msg: errorMsg[2] + ': ' + baseDir};
  }
  
  return ret;

}
