/*
 * To dealing with Ajax request
 */

var fs = require('fs.extra');
var fsPlus = require('../lib/fs-plus');
var path = require('path');
var log = require('../lib/logger');
var conf = require('../lib/config');

var r_img = /(\.jpg|\.jpeg|\.gif|\.png)$/i;
var error_msg = {
  0: 'Unknown error',
  1: 'No permission to do this',
  2: 'File path is not valid',
  3: 'Delete Failed',
  4: 'Move File Failed',
  5: 'Configuration Error, check the config file'
};

exports.operationHandler = function (req, res) {

  // check the permission
  var white_list = conf.ip_white_list;
  var address = req.connection.remoteAddress;
  if (white_list.indexOf(address) == -1) {
    res.send({status: 'ERROR', msg: error_msg[1]});
    log('Request from ' + address + ' was rejected!', 'fail');
    return
  }


  // 删除单个文件
  var pic_path = req.query['pic_path'];
  var ret = {};
  if (pic_path) {
    
    // delete mode
    if (conf.delete_mode == 'del') {
      try {
        fs.unlinkSync(pic_path);
        ret = {status: 'OK'};
        log(pic_path, 'delete');
      } catch (e) {
        ret = {status: 'ERROR', msg: error_msg[3], err: e};
      }
    } 
    
    // move mode
    else if (conf.delete_mode == 'mv') {
      var tmpDir = conf.tmp_dir;
      var fileName = path.basename(pic_path);
      var dirName = toLinuxPath(path.dirname(pic_path)).replace(/\//g, '$').replace(':', '$$');
      if (!fs.existsSync(path.join(tmpDir, dirName))) {
        fs.mkdirRecursiveSync(path.join(tmpDir, dirName));
      }
      try {
        var destPath = path.join(tmpDir, dirName, fileName);
        //fs.renameSync(pic_path, destPath);
        fsPlus.moveSync(pic_path, path.join(tmpDir, dirName));
        ret = {status: 'OK'};
        log(pic_path + ' => ' + destPath, 'move');
      } catch (e) {
        ret = {status: 'ERROR', msg: error_msg[4], err: e};
      }
    } else {
      ret = {status: 'ERROR', msg: error_msg[5]};
    }
    
    res.send(ret);
    if (ret.status == 'ERROR') {
      if (ret.err) {
        log(ret.err, 'error');
      }
      log(ret.msg, 'error');
    }
    
    return;
    
  }
  
  
  // 删除多个文件
  var pics_path = req.query['pics_path'];
  var ret = {};
  if (pics_path) {
    
    var pics = JSON.parse(pics_path);

    // delete mode
    if (conf.delete_mode == 'del') {
      for (var i = 0; i < pics.length; i++) {
        try {
          fs.unlinkSync(pics[i]);
          ret = {status: 'OK'};
          log(pics[i], 'delete');
        } catch (e) {
          ret = {status: 'ERROR', msg: error_msg[3], err: e};
        }
      }
    } 
    
    // move mode
    else if (conf.delete_mode == 'mv') {
      var tmpDir = conf.tmp_dir;
      var dirName = toLinuxPath(path.dirname(pics[0])).replace(/\//g, '$').replace(':', '$$');
      if (!fs.existsSync(path.join(tmpDir, dirName))) {
        fs.mkdirRecursiveSync(path.join(tmpDir, dirName));
      }
      try {
        pics.forEach(function(picPath) {
          var fileName = path.basename(picPath);
          var destPath = path.join(tmpDir, dirName, fileName);
          //fs.renameSync(picPath, destPath);
          fsPlus.moveSync(picPath, path.join(tmpDir, dirName));
          log(picPath + ' => ' + destPath, 'move');
        });
        ret = {status: 'OK'};
      } catch (e) {
        ret = {status: 'ERROR', msg: error_msg[4], err: e};
      }
      
    } else {
      ret = {status: 'ERROR', msg: error_msg[5]};
    }

    res.send(ret);
    if (ret.status == 'ERROR') {
      if (ret.err) {
        log(ret.err, 'error');
      }
      log(ret.msg, 'error');
    }
    
    return;
    
  }


  // 删除多个文件夹
  var albums = req.query['albums'];
  var ret = {status: 'OK'};
  if (albums) {
    JSON.parse(albums).forEach(function (album) {

      var alb_path = album.path;
      var alb_type = album.type;

      if (alb_type == 'album' || alb_type == 'folder') {
        
        // delete mode
        if (conf.delete_mode == 'del') {
          try {
            fs.rmrfSync(alb_path);
            log('FOLDER: ' + alb_path, 'delete');
          } catch (e) {
            ret = {status: 'ERROR', msg: error_msg[3], err: e};
          }
        }

        // move mode
        else if (conf.delete_mode == 'mv') {
          var tmpDir = conf.tmp_dir;
          var dirName = toLinuxPath(alb_path).replace(/\//g, '$').replace(':', '$$');
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirRecursiveSync(tmpDir);
          }
          try {
            var destPath = path.join(tmpDir, dirName);
            //fs.renameSync(alb_path, destPath);
            fsPlus.moveSync(alb_path, destPath);
            log('FOLDER: ' + alb_path + ' => ' + destPath, 'move');
          } catch (e) {
            ret = {status: 'ERROR', msg: error_msg[4], err: e};
          }

        } else {
          ret = {status: 'ERROR', msg: error_msg[5]};
        }

      } 
            
      else if (alb_type == 'root') {

        var files = fs.readdirSync(alb_path);        

        // delete mode
        if (conf.delete_mode == 'del') {
          try {
            files.forEach(function (file) {
              var file_path = path.join(alb_path, file);
              if (fs.statSync(file_path).isFile() && r_img.test(file)) {
                fs.unlinkSync(file_path);
                log(file_path, 'delete');
              }
            });
          } catch (e) {
            ret = {status: 'ERROR', msg: error_msg[4]};
          }
        }

        // move mode
        else if (conf.delete_mode == 'mv') {
          var tmpDir = conf.tmp_dir;
          var dirName = toLinuxPath(alb_path).replace(/\//g, '$').replace(':', '$$');
          var destDirPath = path.join(tmpDir, dirName);

          if (!fs.existsSync(destDirPath)) {
            fs.mkdirRecursiveSync(destDirPath);
          }
          
          try {
            files.forEach(function(file) {
              var src = path.join(alb_path, file);
              var dest = path.join(destDirPath, file);
              if (fs.statSync(src).isFile() && r_img.test(file)) {
                fsPlus.moveSync(src, destDirPath);
                log(src + ' => ' + dest, 'move');
              }
            });
          } catch (e) {
            ret = {status: 'ERROR', msg: error_msg[4]};
          }
        } else {
          ret = {status: 'ERROR', msg: error_msg[5]};
        }
      }
        
    });

    res.send(ret);
    if (ret.status == 'ERROR') {
      if (ret.err) {
        log(ret.err, 'error');
      }
      log(ret.msg, 'error');
    }

    return;

  }


  // 更改/添加相册根目录
  var album_base_dir = req.query['album_base_dir'],
    mode = req.query['mode'];

  if (album_base_dir) {
    if (fs.existsSync(album_base_dir) && fs.statSync(album_base_dir).isDirectory()) {
      switch (mode) {
        case 'add-path':
          if (conf.album_base_dirs.indexOf(album_base_dir) == -1) {
            conf.album_base_dirs.push(album_base_dir);
          }
          break;
        default :
          conf.album_base_dirs = [album_base_dir];
          break;
      }
      log('相册根目录已改变：' + conf.album_base_dirs, 'update');
      res.send({status: 'OK'});
    } else {
      log(error_msg[2] + ': ' + album_base_dir, 'fail');
      res.send({status: "ERROR", msg: error_msg[2] + ': ' + album_base_dir});
    }
    return;
  }
};


// For Windows path
function toLinuxPath(p) {
  return p.replace(/\\/g, '/').replace(/\/$/, '');
}

