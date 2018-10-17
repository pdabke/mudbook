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
const Server = require('./server');
const SearchIndexer = require('./search_indexer');
const Util = require('./util');

var Exporter = {
  start(options) {
    var docRoot = options.docRoot;
    var outputDir = options.outputDir;
    var overwrite = options.overwrite;

    if (!docRoot) {
      docRoot = path.join(__dirname, 'doc');
    }

    if (!outputDir) {
      console.error('Missing required option: outputDir');
      process.exit();
    }

    if (!Util.isDir(docRoot)) {
      console.error('Invalid documentation root path: ' + docRoot);
      process.exit();
    }

    outputDir = Util.stripLastSlash(outputDir);
    if (!Util.isDir(outputDir)) {
      fs.mkdirSync(outputDir);
    } else if (!Util.isDirEmpty(outputDir)) {
      if (overwrite) {
          Util.deleteDir(outputDir, true);
      } else {
        console.error('Output directory not empty. Use -w or --overwrite flag to overwrite.');
        process.exit();
      }
    }

    // Copy all non-HTML, non-MD files
    copyResources(docRoot, outputDir);

    Server.init(options);
    var data = { indent: '', firstFile: null};
    var filesToBeCopied = ['mb.js'];
    if (!Server.isTemplateExternal()) {
      filesToBeCopied = ['mb_bootstrap.css', 'mb_logo_light.png', 'mb_page_not_found.html', 'mb.js', 'mb.css', 'favicon.ico'];
    }
    let basePath = path.join(__dirname, 'doc')
    for (var i=0; i<filesToBeCopied.length; i++) {
      fs.copySync(path.join(basePath, filesToBeCopied[i]), path.join(outputDir, filesToBeCopied[i]));
    }
    
    Util.walkDocIndex(Util.getDocIndex(docRoot), outputDir, '', [], exportItem, data);
    fs.writeFileSync(path.join(outputDir, 'index.html'), data.firstFile, "utf8");

    // Create search index in the output directory
    SearchIndexer.createSearchIndex(Util.getDocIndex(docRoot), docRoot, outputDir);
    process.exit();
  }
}

function exportItem(filePath, docPath, titlePath, title, fileOrDir, data, type) {
  let indent = data.indent;

  if (type == 'folder') {
    data.indent = indent + '  ';
  }
  let sign = type === 'folder' ? '+' : '-';
  fileOrDir = Util.stripExtension(fileOrDir);
  docPath = docPath + '/' + fileOrDir;
  filePath = path.join(filePath, fileOrDir);

  if (type == 'folder') {
    fs.ensureDirSync(filePath);
    console.log(`${indent}${sign} ${filePath}`);
  } else {
    let content = Server.getDoc(docPath + '.html');
    if (data.firstFile === null) data.firstFile = content;
    fs.writeFileSync(filePath + '.html', content, "utf8");
    console.log(`${indent}${sign} ${filePath}.html`);
  }
}

function copyResources(inputDir, outputDir) {
  
  fs.copySync(inputDir, outputDir, { filter: excludeDocuments })
}

function excludeDocuments(src, dest) {
  return !(src.toLowerCase().endsWith('.html') || src.toLowerCase().endsWith('.md'));
}

module.exports = Exporter;