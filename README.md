# MUDBook
`MUDBook` takes a collection of Markup (HTML) and Markdown pages and turns them into a Web site that nicely displays your documentation similar to GitBook. You can use `MUDBook` either as a tool to create a static Website from your documentation or as a Web server to serve the pages. Key features include:
* Support for .md and .html files
* Search using lunr.js
* Search and Syntax highlighting using highlights.js
* Responsive, looks great on desktops as well as mobile
* Fully customizable using your own document template

![MUDBook Screenshot](https://raw.githubusercontent.com/pdabke/mudbook/master/lib/doc/mb_screenshot.png)

## Install
Install mudbook globally using npm -g option.
``` bash
npm install mudbook -g
```

## Quick Start
Simplest way of seeing `MUDBook` in action is to run the `mudbook` command. This will start `MUDBook` server on port 3000. You can open a Web browser and type http://localhost:3000 in the address bar to view `MUDBook` documentation.

## Usage

``` bash
> mudbook -h
usage: mudbook [[-h | --help | start | export] [options]]

Calling mudbook without any option will start the server and show MUDBook documentation.

-h | --help - Show this help message
init - Copy files to your doc directory to enable customization
start - Start mudbook server and serve site content
export - Generate static HTML content for your site

init options:
  -d --docRoot <doc-root-dir>    Path to documentation root directory
  -w --overwrite                 Replace existing files in output directory

start options:
  -p --port   <port-number>      Port to use [3000]
  -s --httpsPort                 HTTPS port
  -c --cert <cert-file-path>     Path to ssl cert file (default: cert.pem)
  -k --key <key-file-path>       Path to ssl key file (default: key.pem)

  -d --docRoot <doc-root-dir>    Path to documentation root directory

export options:
  -d --docRoot <doc-root-dir>    Path to documentation root directory
  -o --outputDir <output-dir>    Output directory for generated Web site files
  -w --overwrite                 Replace existing files in output directory
  ```
