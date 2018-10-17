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
const lunr = require('lunr');
const parse5 = require('parse5');
const Util = require('./util');

const SearchIndexer = {
  createSearchIndex(index, inputDir, outputDir) {
    var documents = [];
    var data = {docs: documents};
    Util.walkDocIndex(index, inputDir, '', [], indexItem, data);
  
    var idx = lunr(function () {
      this.ref('path')
      this.field('title')
      this.field('body')
      documents.forEach(function (doc) {
        this.add(doc)
      }, this)
    });
    fs.writeFileSync(path.join(outputDir, 'mb_search_index.js'), 'var MBSearchIndex = ' + JSON.stringify(idx), 'utf8');    
  }
  
}


function indexItem(filePath, docPath, titlePath, title, dir, data, type) {
  if (type == 'folder') {
    return;
  }
  
  var ancestorPath = '';
  for (var i=0; i<titlePath.length; i++) ancestorPath = ancestorPath + titlePath[i] + ' > ';

  if (!docPath) docPath = Util.stripExtension(dir) + '.html';
  else {
    if (docPath.startsWith('/')) docPath = docPath.substring(1);
    docPath = docPath + '/' + Util.stripExtension(dir) + '.html';
  }
  filePath = path.join(filePath, dir);

  var content = fs.readFileSync(filePath, 'utf8');
  if (filePath.toLowerCase().endsWith('.md')) {
    content = markdownit.render(content);
  }
  var df = parse5.parseFragment(content);
  var textInfo = {text: '', title: '', sections: []};
  extractTextAndSections(df.childNodes, textInfo, 'h2', 'h1');
  var searchObj = [];
  if (textInfo.title) textInfo.title = textInfo.title.trim();
  if (textInfo.text) searchObj.push({title: title, path: docPath, longTitle: ancestorPath + ' ' + title, body: textInfo.text});

  ancestorPath = ancestorPath + title + ' > ';
  for (var i=0; i<textInfo.sections.length; i++) {
    let sectionInfo = {text: '', title: '', sections: []};
    extractTextAndSections(textInfo.sections[i], sectionInfo, 'h3', 'h2');
    let shortTitle = sectionInfo.title.trim();
    sectionInfo.title = ancestorPath + shortTitle;
    let subSectionPrefix = sectionInfo.title + ' > ';
    if (sectionInfo.text) searchObj.push({title: shortTitle, path: docPath + computeAnchor(textInfo.sections[i][0]), longTitle: sectionInfo.title, body: sectionInfo.text});
    for (var j=0; j<sectionInfo.sections.length; j++) {
      let s = sectionInfo.sections[j];
      let txti = {text: ''};
      if (s.length <= 1) continue;
      extractText([s[0]], txti);
      let ttl = txti.text;
      if (ttl) ttl = ttl.trim();
      txti.text = '';
      extractText(s.slice(1), txti);
      if (txti.text) searchObj.push({title: ttl, path: docPath + computeAnchor(s[0]), longTitle: subSectionPrefix + ttl, body: txti.text});
    }
  }

  for (var i=0; i<searchObj.length; i++) {
    searchObj[i].path = searchObj[i].path + '\n' + searchObj[i].longTitle;
    if (!searchObj[i].title) searchObj[i].title = '';
    if (!searchObj[i].body) searchObj[i].body = '';
    searchObj[i].title = searchObj[i].title.replace(/[_|-|\.]/g, ' ')
    searchObj[i].body = searchObj[i].body.replace(/[_|-|\.]/g, ' ')
    data.docs.push(searchObj[i]);
  }
}

function computeAnchor(node) {
  var textInfo = {text: ''};
  extractText([node], textInfo);
  return '#' + Util.titleToUnderscore(textInfo.text.trim());
}
function extractTextAndSections(nodes, textInfo, childTag, parentTag) {
  if (!nodes) return;
  let len = nodes.length;
  let insideTag = false;
  let section = [];
  for (var i=0; i<len; i++) {
    let n = nodes[i];
    if (n.nodeName === '#comment') continue;
    if (insideTag) {
      if (n.nodeName === childTag) {
        textInfo.sections.push(section);
        section = [];
        section.push(n);      
      } else {
        section.push(n);
      }
    } else if (n.nodeName === '#text') {
      textInfo.text = textInfo.text + ' ' + n.value;
    } else if (n.nodeName === childTag) {
      insideTag = true;
      section.push(n);
    } else if (n.nodeName === parentTag) {
      let pinfo = {text: ''};
      extractText(n.childNodes, pinfo);
      textInfo.title = pinfo.text;
    } else  extractText(n.childNodes, textInfo);
  }
  if (section.length > 0) textInfo.sections.push(section);
}

function extractText(nodes, textInfo) {
  if (!nodes) return;
  let len = nodes.length;
  for (var i=0; i<len; i++) {
    let n = nodes[i];
    if (n.nodeName === '#comment') continue;
    else if (n.nodeName === '#text') textInfo.text = textInfo.text + ' ' + n.value;
    else extractText(n.childNodes, textInfo);
  }
}
module.exports = SearchIndexer;

