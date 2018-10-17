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
var MimeTypes = require('mime-types')

const Response = {

    notFound(response) {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.write("404 Not Found\n");
        response.end();
    },

    internalError(response) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.write("Sorry! Something went wrong, please try your request later.\n");
        response.end();
    },

    sendFile(response, fileContent, fileName) {
        response.writeHead(200, { "Content-Type": Response.getContentType(fileName) });
        response.write(fileContent);
        response.end();
    },

    getContentType(fileName) {
        if (!fileName) return 'application/octet-stream'
        if (fileName.endsWith('.vue')) return MimeTypes.lookup('txt')
        let mt = MimeTypes.lookup(fileName)
        if (mt) return mt;
        return 'application/octet-stream'
    }
}

module.exports = Response;
