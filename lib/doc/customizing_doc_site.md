# Customizing Your Site
By default, `MUDBook` uses built-in HTML template to generate Website content. You can provide your own template to customize the look and feel of your site. The best way to achieve this is to first use `init` option to copy the default template and other resources to your documentation folder. You can then modify the template and CSS files to produce the desired look an feel.

``` console
> mudbook init --docRoot C:\mydoc
Copied mb_template.html to C:\mydoc
Copied mb_bootstrap.css to C:\mydoc
Copied mb_logo_light.png to C:\mydoc
Copied mb_page_not_found.html to C:\mydoc
Copied mb.js to C:\mydoc
Copied mb.css to C:\mydoc
Copied favicon.ico to C:\mydoc
```
When you modify the default template, please make sure that your new template retains the following mustache-style variables:
* {{rootFolder}} - This corresponds to the root directory of generated documentation.
* {{sidebarContent}} - Sidebar listing of sections and documents
* {{tocContent}} - Table of contents for individual pages shown on the right hand side for the current page

You can use the `{{rootFolder}}` variable in the URLs that point to your static resources. The variable ensures the correct path to a resource irrespective of the sub-directory a document is located in.