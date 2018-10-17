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
const Util = require('./util');

var Initializer = {
  start(options) {
    var docRoot = options.docRoot;
    var overwrite = options.overwrite;

    if (!docRoot) {
      console.error('Please specify the documentation folder via --docRoot or -d option.');
      process.exit();
    }

    if (!Util.isDir(docRoot)) {
      console.error('Invalid documentation root path: ' + docRoot);
      process.exit();
    }

    // Check if docRoot is pointing to the system docs
    var sysDocRoot = path.normalize(path.join(__dirname, 'doc'));
    var userDocRoot = path.normalize(docRoot);
    if (sysDocRoot === userDocRoot) {
      console.error('docRoot cannot be the same as system doc directory.');
      process.exit();
    }

    var filesToBeCopied = ['mb_template.html', 'mb_bootstrap.css', 'mb_logo_light.png', 'mb_page_not_found.html', 'mb.js', 'mb.css', 'favicon.ico'];
    if (!overwrite) {
      // Check if the files already exist in docRoot
      for (var i = 0; i < filesToBeCopied.length; i++) {
        if (Util.isFile(path.join(docRoot, filesToBeCopied[i]))) {
          console.error('File ' + path.join(docRoot, filesToBeCopied[i]) + ' exists. Use -w or --overwrite option to overwrite.');
          process.exit();
        }
      }
  
    }
    let basePath = path.join(__dirname, 'doc')
    for (var i = 0; i < filesToBeCopied.length; i++) {
      fs.copySync(path.join(basePath, filesToBeCopied[i]), path.join(docRoot, filesToBeCopied[i]));
      console.log('Copied ' + filesToBeCopied[i] + ' to ' + docRoot);
    }

    process.exit();
  }
}

module.exports = Initializer;