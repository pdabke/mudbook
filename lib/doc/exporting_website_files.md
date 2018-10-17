# Exporting Website Files
We recommend viewing your documentation site using `MUDBook` server before you export it. Once you are ready you can export the pages to the desired directory via `mudbook export` command.
```console
> mudbook export --overwrite --docRoot C:\MyProject\raw_doc_dir --outputDir C:\MyProject\doc
```
> Use -w or --overwrite flag to overwrite flag if you want to overwrite existing export directory.

Running this command will create all files necessary to view your documentation as a stand-alone Web site. In addition to your documentation files and folders, you will have the following additional files in the output directory:
* `index.html` file at the root of output directory that is the same as the first viewable document
* All non-HTML, non-Markdown files will be copied to appropriate folders. This will preserve your relative references to images and other
resources in your documentation.
* Unless you are using your own document template, it will also copy the following files: mb_bootstrap.css, mb_logo_light.png, mb_page_not_found.html, mb.js, mb.css, favicon.ico