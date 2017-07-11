# Vanilla-DataTables
[![Build Status](https://travis-ci.org/Mobius1/Vanilla-DataTables.svg?branch=master)](https://travis-ci.org/Mobius1/Vanilla-DataTables) [![npm version](https://badge.fury.io/js/vanilla-datatables.svg)](https://badge.fury.io/js/vanilla-datatables) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Mobius1/Vanilla-DataTables/blob/master/LICENSE) [![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/mobius1/vanilla-datatables.svg)](http://isitmaintained.com/project/mobius1/vanilla-datatables "Average time to resolve an issue") [![Percentage of issues still open](http://isitmaintained.com/badge/open/mobius1/vanilla-datatables.svg)](http://isitmaintained.com/project/mobius1/vanilla-datatables "Percentage of issues still open") ![](http://img.badgesize.io/Mobius1/Vanilla-DataTables/master/dist/vanilla-dataTables.min.js) ![](http://img.badgesize.io/Mobius1/Vanilla-DataTables/master/dist/vanilla-dataTables.min.js?compression=gzip&label=gzipped)

A lightweight, dependency-free javascript HTML table plugin. Similar to jQuery DataTables, but without the dependencies.

### Features

* Sortable columns
* Pagination
* Searchable
* Customisable layout
* Customisable labels
* Export to common formats like `csv`, `txt` `json`, and `sql`
* Import `csv` and `json` data
* Control column visibility
* Reorder or swap columns
* moment.js integration for sorting columns with datetime strings (experimental, v1.2.3 and above)


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
<link href="https://cdn.jsdelivr.net/gh/mobius1/vanilla-Datatables@1.2.3/dist/vanilla-dataTables.min.css" rel="stylesheet" type="text/css">

<script src="https://cdn.jsdelivr.net/gh/mobius1/vanilla-Datatables@1.2.3/dist/vanilla-dataTables.min.js" type="text/javascript"></script>
```

or grab the latest stable version:

```html
<link href="https://cdn.jsdelivr.net/gh/mobius1/vanilla-Datatables@1.2.2/dist/vanilla-dataTables.min.css" rel="stylesheet" type="text/css">

<script src="https://cdn.jsdelivr.net/gh/mobius1/vanilla-Datatables@1.2.2/dist/vanilla-dataTables.min.js" type="text/javascript"></script>
```

The JS file should be included before any scripts that call the library.

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