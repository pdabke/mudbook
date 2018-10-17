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
const fs = require('fs-extra');
const path = require('path');
const markdownit = require('markdown-it')();

const Util = require('./util');

const GenIndex = {
  create(dir) {
    var json = generateIndex(dir);
    fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(json, null, 2), 'utf8');
  }
}

function generateIndex(dir) {
  var index = [];
  var entries = fs.readdirSync(dir);

  // Write file entries first
  for (var i=0; i<entries.length; i++) {
    if (Util.isFile(path.join(dir, entries[i])))
      addFileToIndex(dir, entries[i], index);
  }

  for (var i=0; i<entries.length; i++) {
    if (Util.isDir(path.join(dir, entries[i]))) addDirToIndex(dir, entries[i], index);
  }

  // fs.writeJsonSync(path.join(dir, 'index.json'), index);
  return index;
}

function addDirToIndex(parent, dir, index) {
  if ("css" === dir || "icons" === dir || "img" === dir || "images" === dir) return;
  var subIndex = [];
  subIndex.push(dir);
  var dirPath = path.join(parent, dir);
  var entries = fs.readdirSync(dirPath);

  for (var i=0; i<entries.length; i++) {
    if (Util.isDir(path.join(dirPath, entries[i]))) addDirToIndex(dirPath, entries[i], subIndex);
    else addFileToIndex(dirPath, entries[i], subIndex);
  }
  index.push(subIndex);
}

function addFileToIndex(parent, file, index) {
  if ("mb_template.html" === file || "mb_page_not_found.html" === file) return;
  var content = null;
  if (file.toLowerCase().endsWith('.html')) {
    content = fs.readFileSync(path.join(parent, file), 'utf8');
  } else if (file.toLowerCase().endsWith('.md')) {
    content = fs.readFileSync(path.join(parent, file), 'utf8');
    content = markdownit.render(content);
  } else {
    return;
  }
  var header = Util.getTagContent(content, 'h1');
  if (header) {
    index.push({file: file, title: header});
  } else {
    index.push(file);
  }

}

module.exports = GenIndex;
