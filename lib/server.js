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
const hljs = require('highlight.js'); 
const markdownit = require('markdown-it')({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
});
const http = require('http');
const https = require('https');
const Response = require('./response');
const Util = require('./util');
const GenIndex = require('./genindex');
const SearchIndexer = require('./search_indexer');

var _HTTP_PORT = 3000;
var _HTTPS_PORT = 3443;

var _MB_HOME = null;
var _DOC_ROOT = null;

var _DOC_INDEX_FILE = null;
var _NOT_FOUND_FILE = null;

var _DEFAULT_DOC_PAGE_PATH = null;
var _DOC_ROOT_FOLDER_PREFIX = '{{rootFolder}}';

var _EXT_TEMPLATE = false;

var _DOC_INDEX_OBJ = null;

const MUDBook = {
  init(options) {
    setLocalDirectories(options.docRoot);
    createDocIndex();
    createSearchIndex();
  },

  isTemplateExternal() {
    return _EXT_TEMPLATE;
  },
  
  start(options) {
    options = options ? options : {};
    MUDBook.init(options);
    if (options.port) _HTTP_PORT = options.port;
    if (options.httpsPort) _HTTPS_PORT = options.httpsPort;

    if (options.httpsPort || options.key || options.cert) {
      if (!options.key || !options.cert) {
        console.error('Missing one or more required HTTPS options: --key, --cert');
        return;
      }
      // HTTPS server will do the request processing
      let key = fs.readFileSync(options.key);
      let cert = fs.readFileSync(options.cert);
      let httpsServer = https.createServer({key: key, cert: cert}, router);

      // HTTP server will redirect all requests to https
      let httpServer = http.createServer(redirector);

      console.log('Starting http server on port ' + _HTTP_PORT);
      console.log('Starting https server on port ' + _HTTPS_PORT);

      httpServer.listen(_HTTP_PORT);
      httpsServer.listen(_HTTPS_PORT);
    } else {
      let httpServer = http.createServer(router);
      httpServer.listen(_HTTP_PORT);
      console.log('Starting http server on port ' + _HTTP_PORT);
    }
  },

  getDoc(docPath) {
    var rootPath = './';
    var slashCount = Util.countMatches(docPath, /\//g) - 1;    
    for (var i=0; i<slashCount; i++) rootPath = rootPath + '../';

    if (!docPath || docPath === '/') docPath = _DEFAULT_DOC_PAGE_PATH;
    let filePath = _DOC_ROOT + docPath;
    let content = null;
    if (Util.isFile(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
    } else {
      // check if .md file exists
      filePath = filePath.replace('.html', '.md');
      if (Util.isFile(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
        content = markdownit.render(content);
      } else {
        content = _NOT_FOUND_FILE
      } 
    }
    /* It's important to replace the rootFolder token before the actual content is included in the file
    * Otherwise that token if found in the documentation will get replaced.
    */
    var doc = _DOC_INDEX_FILE.replace(/{{rootFolder}}/g, rootPath);
    let pathToken = (Util.stripExtension(docPath)).replace(/\//g, '_');
    pathToken = '__' + pathToken + '___';

    doc = doc.replace(pathToken, 'active');
    doc = doc.replace(/___\w*___/g, '');
    var tocAndContent = createTOC(content);
    doc = doc.replace('{{tocContent}}', tocAndContent[0]);
    doc = doc.replace('{{mainContent}}', tocAndContent[1]);
    return doc;
  }
}

// Used to redirect http -> https when https is configured
function redirector(request, response) {
  response.on('error', (err) => {
    console.error(err);
  });
  let sHost = request.headers.host.includes(':') ? request.headers.host.substring(0, request.headers.host.indexOf(':')) :
    request.headers.host;
  response.writeHead(302, {
    'Location': 'https://' + sHost + ':' + _HTTPS_PORT + request.url
  });
  response.end();

}

function router(request, response) {
  const { headers, method, url } = request;

  // Log response errors to console. May want to consider the ability to provide error handler
  response.on('error', (err) => {
    console.error(err);
  });

  // Return a Bad Request response. 
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });

  // Route requests
  try {
    // console.debug('Processing ' + request.url);
    if (method === 'GET') {
      if (request.url.includes('..')) return Response.notFound(res);
      let url = request.url;
      if (!url) url = '';
      if (url.indexOf('?') != -1) url = url.substring(0, url.indexOf('?'));
      if (url.endsWith('.html') || !url || url === '/') {
        handleDocRequest(response, url);
      } else {
        handleFileRequest(response, url);
      }
    } else {
      Response.notFound(response);
    }
  } catch (e) {
    console.error(e)
    Response.internalError(response);
  }

}

function handleFileRequest(res, relPath) {
  let enc = Response.getContentType(relPath).startsWith('text') ? 'utf8' : null;
  if (Util.isFile(_DOC_ROOT + relPath)) {
    let fileContent = fs.readFileSync(_DOC_ROOT + relPath, enc);
    Response.sendFile(res, fileContent, relPath);
  } else if (Util.isFile(path.join(_MB_HOME, 'doc', relPath))) {
    let fileContent = fs.readFileSync(path.join(_MB_HOME, 'doc', relPath), enc);
    Response.sendFile(res, fileContent, relPath);
  } else {
    console.error('Request for missing file: ' + relPath);
    Response.notFound(res);
  }
}

function setLocalDirectories(docRoot) {
  if (docRoot) docRoot = Util.stripLastSlash(docRoot);
  _MB_HOME = path.resolve(__dirname);
  var mbDocDir = path.join(_MB_HOME, 'doc');
  _DOC_ROOT = docRoot ? path.resolve(docRoot) : mbDocDir;
  console.debug('MUDBook root directory: ' + _MB_HOME);
  console.debug('Documentation root directory: ' + _DOC_ROOT);

  _DOC_INDEX_FILE = path.join(mbDocDir, 'mb_template.html');
  _NOT_FOUND_FILE = path.join(mbDocDir, 'mb_page_not_found.html');

  if (docRoot) {
    var extTemplate = path.join(_DOC_ROOT, 'mb_template.html');
    var notFoundTemplate = path.join(_DOC_ROOT, 'mb_page_not_found.html');

    if (Util.isFile(extTemplate)) {
      _DOC_INDEX_FILE = extTemplate;
      _EXT_TEMPLATE = true;
      console.log('Using mb_template.html in the doc folder to render pages.');
    } else {
      console.log('Did not find mb_template.html in documentation folder. Using system template.');
    }
    if (Util.isFile(notFoundTemplate)) _NOT_FOUND_FILE = notFoundTemplate;
      
  } 
  _NOT_FOUND_FILE = fs.readFileSync(_NOT_FOUND_FILE, 'utf8');

}

function createDocIndex() {
  if (!Util.isFile(_DOC_ROOT + '/index.json')) GenIndex.create(_DOC_ROOT);
  var index = fs.readFileSync(_DOC_ROOT + '/index.json', 'utf8');
  index = JSON.parse(index);
  var indexHtml = {html: ''};
  createDocIndexHelper(index, indexHtml, _DOC_ROOT_FOLDER_PREFIX);
  _DOC_INDEX_FILE = fs.readFileSync(_DOC_INDEX_FILE, 'utf-8');
  _DOC_INDEX_FILE = _DOC_INDEX_FILE.replace('{{sidebarContent}}', indexHtml.html);
  _DOC_INDEX_OBJ = index;
}

function createDocIndexHelper(index, htmlObj, rootPath) {
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
      htmlObj.html = htmlObj.html + 
      `<div class="mb-folder"><div class="mb-folder-link">${title}</div><div class="mb-folder-content">`;
      createDocIndexHelper(entry.slice(1), htmlObj, rootPath + dir + '/');
      htmlObj.html = htmlObj.html + '</div></div>';
    } else {
      processFileEntry(entry, htmlObj, rootPath)
    }
  }
}

function processFileEntry(entry, htmlObj, rootPath) {
  var file = null;
  if (typeof entry === "string" ) {
    let title = Util.toTitleCase(Util.stripExtension(entry));
    file = Util.stripExtension(entry);
    let pathToken = `${rootPath}${file}`.replace(_DOC_ROOT_FOLDER_PREFIX, '').replace(/\//g, '_');
    htmlObj.html = htmlObj.html + 
      `<div class="mb-page-link ___${pathToken}___"><a href="${rootPath}${file}.html">${title}</a></div>`
  } else {
    file = Util.stripExtension(entry.file);
    let pathToken = `${rootPath}${file}`.replace(_DOC_ROOT_FOLDER_PREFIX, '').replace(/\//g, '_');
    htmlObj.html = htmlObj.html + 
      `<div class="mb-page-link ___${pathToken}___"><a href="${rootPath}${file}.html">${entry.title}</a></div>`
  }
  if (!_DEFAULT_DOC_PAGE_PATH) {
    _DEFAULT_DOC_PAGE_PATH = rootPath.replace(_DOC_ROOT_FOLDER_PREFIX, '/') + file + '.html';
  }
}

function handleDocRequest(res, docPath) {
  var content = MUDBook.getDoc(docPath);
  Response.sendFile(res, content, 'html');
}

function createTOC(content) {
  var re = /<\s*h(2|3)\s*>(.*)<\s*\/h(2|3)\s*>/g;
  var match = null;
  var toc = '';
  var isNested = false;
  while ((match = re.exec(content)) != null) {
    let level = match[1];
    let title = match[2];
    let anchor = title.replace(/\s/g, '_').toLocaleLowerCase();
    if (level === "2") {
      if (isNested) {
        toc = toc + '</div>';
        isNested = false;
      }
      toc = toc + 
      `<div class="mb-toc-link"><a href="#${anchor}">${title}</a></div>`

    } else {
      if (!isNested) {
        toc = toc + '<div class="mb-toc-indent">'
        isNested = true;
      }
      toc = toc + 
      `<div class="mb-toc-link"><a href="#${anchor}">${title}</a></div>`
    }
  }
  
  var re = /(<\s*h[2|3]\s*)(>)(.*)(<\s*\/h[2|3]\s*>)/g;
  //content = content.replace(re, function(match, g1, g2, g3, g4) { return g1 + ' id="' + anchorId(g3) + '">' + g3 + g4;});
  content = content.replace(re, function(match, g1, g2, g3, g4) { 
    return g1 + ">" + '<a class="mb-anchor" name="' + anchorId(g3) + '">' + g3 + '</a>' + g4});

  return [toc, content];
}

function anchorId(title) {
  return title.replace(/\s/g, '_').toLocaleLowerCase();
}

function createSearchIndex() {
  SearchIndexer.createSearchIndex(_DOC_INDEX_OBJ, _DOC_ROOT, _DOC_ROOT);

}

module.exports = MUDBook;
