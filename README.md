# Vanilla-DataTables [![Build Status](https://travis-ci.org/Mobius1/Vanilla-DataTables.svg?branch=master)](https://travis-ci.org/Mobius1/Vanilla-DataTables) [![npm version](https://badge.fury.io/js/vanilla-datatables.svg)](https://badge.fury.io/js/vanilla-datatables) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Mobius1/Vanilla-DataTables/blob/master/LICENSE)
A lightweight, dependency-free javascript HTML table plugin. Similar to jQuery DataTables, but without the dependencies.

### Features

* Sortable columns
* Pagination
* Searchable
* Customisable layout
* Customisable labels
* Export and import common formats like `csv`, `txt` `json`, and `sql`


[Documentation](https://github.com/Mobius1/Vanilla-DataTables/wiki)


### Install

## Bower
```
bower install vanilla-datatables --save
```

## npm
```
npm install vanilla-datatables --save
```

---

### Browser

Add the css and js files from the CDN:

```html
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/mobius1/vanilla-Datatables@latest/vanilla-dataTables.min.css">

<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/mobius1/vanilla-Datatables@latest/vanilla-dataTables.min.js"></script>
```

The JS file should be included before any scripts that call the plugin.

---

### Quick Start

Then just initialise the plugin by either passing a reference to the table or a CSS3 selector string as the first parameter:

```javascript
var myTable = document.querySelector("#myTable");
var dataTable = new DataTable(myTable);

// or

var dataTable = new DataTable("#myTable");

```

You can also pass the options object as the second paramater:

```javascript
var dataTable = new DataTable("#myTable", {
	searchable: false,
	fixedHeight: true,
	...
});
```

Don't forget to check the [wiki](https://github.com/Mobius1/Vanilla-DataTables/wiki) out for further help.

Copyright © 2017 Karl Saunders | MIT license