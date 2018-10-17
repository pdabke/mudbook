# Preparing Your Documentation

## Document Structure
MUDBook supports Markdown files as well as HTML files. HTML-formatted files should not be full HTML documents but should contain what usually goes into the `body` of an HTML document. 

MUDBook coverts Markdown files to HTML using `markdown-it`. HTML files are read as is. It then looks for h1, h2, h3 tags in your documents to create TOC for each page and create a search index. First h1 tag is used as the page title (unless you override it in index.json as explained later). It generates a table of content for each page from the h2/h3 tags. The TOC for a page is shown on the right hand side for larger displays and is hidden on smaller widths.

## Documentation Directory Structure
You can organize your documentation in a hierarchical directory structure that reflects your table of contents. `MUDBook` can work with either HTML or Markdown files. Make sure to use .html or .md extension for the HTML and Markdown files respectively. See an example directory structure shown below that has two top level files and two sections with additional documentation files within corresponding directories. 

``` bash
<docRoot>
├── index.json
├── README.md
├── getting_started.md
├── developing_web_services
│   ├── anatomy_of_a_web_service.md
│   ├── error_handling.md
│   └── access_control.md
|
├── writing_portal_components
    ├── overview.md
    ├── loading_js_files.md
```

You can place a file named `index.json` that describes the organization of your documentation. `MUDBook` will generate the file if it does not exist. The file is expected to contain a JSON object that specifies the list of files and directories to be included in the documentation, the order in which they should be listed, and optionally a title for a section/directory or a document.

> If you have an existing documentation folder, let `MUDBook` create index.json for you the first time. You can edit the file later to ensure correct order and titles.

## index.json Format
`index.json` file must contain a JSON array. Each entry in this array specifies a document or a section within your documentation. The object shown below corresponds to the directory structure listed in the last section.

``` json
[
  "README.md",
  "getting_started.md",
  [
    "developing_web_services",
    "anatomy_of_a_web_service.md",
    "error_handling.md",
    "access_control.md"
  ],
  [
    "writing_portal_components",
    {"file": "loading_js_files.md", "title": "Loading External Javascript Files"}
  ]
]
```
An entry corresponding to a document can be a string that specifies the file name or a JSON object with two attributes `file` and `title` providing the file name and the document title respectively. If the file name is a string, the title is derived by stripping the file extension and converting the rest of the string to table case.

An entry corresponding to a documentation section must be an array. The first element of this array must be a string that provides the name of the directory corresponding to the documentation section. The title of the section is derived from converting the directory name to table case. The rest of the elements in the array follow the same structure as the top level array.

In the example shown above, all document and section titles will be derived from the file names except `loading_js_files.md`.

## Viewing Your Documentation Site
You can point `MUDBook` to your own documentation directory via --docRoot or -d option as shown below.
``` console
> mudbook --docRoot C:\MyProject\docs
```