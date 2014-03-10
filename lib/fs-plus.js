var fs = require('fs');
var path = require('path');
var util = require('util')

// For Windows path
exports.toLinuxPath = function toLinuxPath(p) {
  return p.replace(/\\/g, '/').replace(/\/$/, '');
};


// callback(dirPath, dirs, files)
walkSync = function (start, callback) {
  var stat = fs.statSync(start);

  if (stat.isDirectory()) {
    var files = fs.readdirSync(start);

    var coll = files.reduce(function (acc, name) {
      var absPath = path.join(start, name);

      if (fs.statSync(absPath).isDirectory()) {
        acc.dirs.push(name);
      } else {
        acc.names.push(name);
      }

      return acc;
    }, {"names": [], "dirs": []});

    callback(start, coll.dirs, coll.names);

    coll.dirs.forEach(function (d) {
      var absPath = path.join(start, d);
      walkSync(absPath, callback);
    });

  } else {
    throw new Error("path: " + start + " is not a directory");
  }
};

exports.walkSync = walkSync;

// If dest is a directory, it must be not existed
exports.moveSync = function moveSync(src, dest, options) {

  var opt = {
    f: false
  };
  util._extend(opt, options);
  
  // move a file
  if (!fs.existsSync(src)) {
    throw new Error('"' + src + '" not exists');
  }
  
  var statSrc = fs.statSync(src);
  
  if (statSrc.isFile()) {
    var destPath;
    
    if (fs.existsSync(dest)) {
      statDest = fs.statSync(dest);
      if (statDest.isFile()) {
        if (opt.f) {
          destPath = dest;
        } else {
          throw new Error('Failed to move "' + src + '" to "' + dest + '": "' + dest
            + '" file exists' );
        }
      } else if (statDest.isDirectory()) {
        destPath = path.join(dest, path.basename(src));
      }
    } else if (fs.existsSync(path.dirname(dest))) {  // rename
      destPath = dest;
    } else {
      throw new Error('Failed to move "' + src + '" to "' + dest + '": "' + dest 
        + '" path not valid' );
    }
    
    var data = fs.readFileSync(src);
    fs.writeFileSync(destPath, data, {encoding: null});
    fs.unlinkSync(src);
    
  }

  // move a directory recursively
  else if (statSrc.isDirectory()) {
    var destPath;
      
    if (fs.existsSync(dest)) {
      var statDest = fs.statSync(dest);
      if (statDest.isDirectory()) {
        destPath = path.join(dest, path.basename(src));
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath); 
        } 
        
        // if destPath exists, then create a new destPath with "~num" suffix, num implies the duplicates
        else if (fs.statSync(destPath).isDirectory()) {
          var mSuffix = destPath.match(/~(\d+)$/);
          var destBasePath = destPath;
          if (mSuffix) {
            destBasePath = destPath.replace(/\d+$/,'');
          }
          for (var i = 1; i <= 50; i++) {
            destPath = destBasePath + '~' + i;
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath);
              break;
            }
          }

        } else {
          throw new Error('Failed to move "' + src + '" to "' + dest + '": "' + destPath
            + '" exists but not a directory' );
        }
      } else {
        throw new Error('Failed to move "' + src + '" to "' + dest + '": "' + dest
          + '" exists but not a directory' );
      }
    } else if (fs.existsSync(path.dirname(dest))) {  // rename
      destPath = dest;
      fs.mkdirSync(destPath);
    } else {
      throw new Error('Failed to move "' + src + '" to "' + dest + '": "' + dest
        + '" path not valid' );
    }
    
    var srcFolders = [src];
    walkSync(src, function(dirPath, dirs, files) {
      var absDestPath = path.join(destPath, path.relative(src, dirPath));
      
      dirs.forEach(function (dir) {
        fs.mkdirSync(path.join(absDestPath, dir));
        srcFolders.push(path.join(dirPath, dir));
      });
      files.forEach(function (file) {
        var srcPath = path.join(dirPath, file);
        var fileContent = fs.readFileSync(srcPath);
        fs.writeFileSync(path.join(absDestPath, file), fileContent, {encoding: null});
        fs.unlinkSync(srcPath);
      });
    });
    
    // delete src folders
    for (var i = srcFolders.length; i--;) {
      fs.rmdirSync(srcFolders[i]);
    }
    
  }
};

exports.isWritableSync = function isWritableSync(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(filePath + ' not exists');
  }

  var stat = fs.statSync(filePath);

  if (stat.isFile()) {
    try {
      var fd = fs.openSync(filePath, 'a');
      fs.closeSync(fd);
    } catch (e) {
      return false;
    }
  } else if (stat.isDirectory()) {
    try {
      var fd = fs.openSync(path.join(filePath, 'foo'), 'a');
      fs.closeSync(fd);
      fs.unlinkSync(path.join(filePath, 'foo'));
    } catch (e) {
      return false;
    }
  } else {
    throw new Error("File type is not supported");
  }

  return true;
};

