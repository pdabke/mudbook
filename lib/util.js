/*
 Distributed under MIT License

Copyright 2018 Nabh Inc. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, 
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is 
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or 
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
'use strict'
const fs = require('fs');
const path = require('path');
const Util = {
  stripLastSlash(url) {
    if (!url) return url;
    if (url.endsWith('/')) return url.substring(0,url.length-1);
    return url;
  },

  underscoreToCamel(str) {
    return str.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
  },

  titleToUnderscore(str) {
    if (!str) return null;
    str = str.toLowerCase();
    return str.replace(/\s/g, "_");
  },


  getFileNameFromPath(filePath) {
    var index = filePath.lastIndexOf('/');
    if (index == -1) {
      index = filePath.lastIndexOf('\\');
    }
    return filePath.substring(index + 1);
  },

  getDirectoryFromPath(filePath) {
    var index = filePath.lastIndexOf('/');
    if (index == -1) {
      index = filePath.lastIndexOf('\\');
    }
    return filePath.substring(0,index);
  },

  getExtension(filePath) {
    var index = filePath.lastIndexOf('.');
    if (index == -1) {
      return '';
    }
    return filePath.substring(index + 1);
  },

  stripExtension(filePath) {
    var index = filePath.lastIndexOf('.');
    if (index == -1) {
      return filePath;
    }
    return filePath.substring(0, index);
  },


  isDir(path) {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory()
  },
  
  isFile(path, ext) {
    if (!fs.existsSync(path) || fs.lstatSync(path).isDirectory()) return false;
    if (!ext) return true;
    return path.endsWith(ext);
  },
  
  isDirEmpty(path) {
    let list = fs.readdirSync(path);
    return (!list || list.length === 0);
  },

  deleteDir(path, keepDir) {
    if (!fs.existsSync(path)) return;
    let files = fs.readdirSync(path);
    files.forEach(function(file, index){
      var curPath = path + "/" + file;
      let isDir = fs.lstatSync(curPath).isDirectory();
      if (isDir) { // recurse
        Util.deleteDir(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    if (!keepDir) fs.rmdirSync(path);
    
  },

  writeToFile(content, filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
  },

  toTitleCase(str) {
    str = str.replace(/(_|-|\s+)\w/g, function (g) { return ' ' + g[g.length - 1].toUpperCase(); });
    str = str[0].toUpperCase() + str.substring(1);
    return str;
  },

  getDocIndex(docFolder) {
    var index = fs.readFileSync(docFolder + '/index.json', 'utf8');
    index = JSON.parse(index);
    return index;
  },

  walkDocIndex(index, filePath, docPath, titlePath, cb, data) {
    for (var i=0; i<index.length; i++) {
      let entry = index[i];
      if (Array.isArray(entry)) {
        let folder = entry[0];
        let title = null;
        let dir = null;
        if (typeof folder === 'string') {
          title = Util.toTitleCase(folder);
          dir = folder;
        } else {
          title = folder.title;
          dir = folder.file;
        }
        var newTitlePath = [];
        for (var j=0; j<titlePath.length; j++) newTitlePath.push(titlePath[j]);
        newTitlePath.push(title);
        cb(filePath, docPath, titlePath, title, dir, data, 'folder');
        Util.walkDocIndex(entry.slice(1), path.join(filePath, dir), docPath + '/' + dir, newTitlePath, cb, data);
      } else {
        Util.processFileEntry(entry, filePath, docPath, titlePath, cb, data)
      }
    }
  
  },

  processFileEntry(entry, filePath, docPath, titlePath, cb, data) {
    var file = null;
    var title = null;
    if (typeof entry === "string" ) {
      title = Util.toTitleCase(Util.stripExtension(entry));
      file = entry;
    } else {
      file = entry.file;
      title = entry.title;
    }
    cb(filePath, docPath, titlePath, title, file, data, 'file')
  },

  countMatches(str, re) {
    return ((str || '').match(re) || []).length
  },

  getTagContent(content, tag) {
    var re = `<\s*${tag}\s*>(.*)<\s*\/${tag}\s*>`;
    re = new RegExp(re);
    var match = re.exec(content);
    if (match) return match[1];
    return null;

  }

}
module.exports = Util;