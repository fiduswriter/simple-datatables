# Vanilla-DataTables
[![Build Status](https://travis-ci.org/Mobius1/Vanilla-DataTables.svg?branch=master)](https://travis-ci.org/Mobius1/Vanilla-DataTables) [![npm version](https://badge.fury.io/js/vanilla-datatables.svg)](https://badge.fury.io/js/vanilla-datatables) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Mobius1/Vanilla-DataTables/blob/master/LICENSE) [![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/mobius1/vanilla-datatables.svg)](http://isitmaintained.com/project/mobius1/vanilla-datatables "Average time to resolve an issue") [![Percentage of issues still open](http://isitmaintained.com/badge/open/mobius1/vanilla-datatables.svg)](http://isitmaintained.com/project/mobius1/vanilla-datatables "Percentage of issues still open") ![](http://img.badgesize.io/Mobius1/Vanilla-DataTables/master/dist/vanilla-dataTables.min.js) ![](http://img.badgesize.io/Mobius1/Vanilla-DataTables/master/dist/vanilla-dataTables.min.js?compression=gzip&label=gzipped)

---

### Version 2.0 is currently in alpha and requires bug testing. Check the repo out [here](https://github.com/Mobius1/Vanilla-DataTables/tree/2.0) and the play with the [demo](https://s.codepen.io/Mobius1/debug/VMQEzw).

---

A lightweight, extendable, dependency-free javascript HTML table plugin. Similar to jQuery DataTables, but without the dependencies.

### Features

* Sortable columns
* Pagination
* Searchable
* Customisable layout
* Customisable labels
* Customise column rendering
* Load data via AJAX requests
* Export to common formats like `csv`, `txt` `json`, and `sql`
* Import `csv` and `json` data
* Control column visibility
* Reorder or swap columns
* moment.js integration for sorting columns with datetime strings
* Extentable with custom plugins [See the wiki](https://github.com/Mobius1/Vanilla-DataTables/wiki/Plugins) (v1.6.0 and above)


[Documentation](https://github.com/Mobius1/Vanilla-DataTables/wiki) | [Latest Version](https://github.com/Mobius1/Vanilla-DataTables/releases/tag/1.6.14)

---

### Demos

* [Default Setup](https://codepen.io/Mobius1/pen/VadmKb)
* [Remote Data](https://codepen.io/Mobius1/pen/XaRepW?editors=0010)
* [Datetime Strings](https://codepen.io/Mobius1/pen/jwXPKN?editors=0010)
* [Column Manipulation](https://codepen.io/Mobius1/pen/WEmGwJ?editors=0010)
* [Editor Plugin](https://s.codepen.io/Mobius1/debug/rGpMMY)
* [Stress Test](https://s.codepen.io/Mobius1/pen/qjLaKd)
* [Programmatic Access](https://s.codepen.io/Mobius1/pen/rwGyJa)

---

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

Grab the files from one of the CDNs and include them in your page:

```html
<link href="https://unpkg.com/vanilla-datatables@latest/dist/vanilla-dataTables.min.css" rel="stylesheet" type="text/css">
<script src="https://unpkg.com/vanilla-datatables@latest/dist/vanilla-dataTables.min.js" type="text/javascript"></script>

//or

<link href="https://cdn.jsdelivr.net/npm/vanilla-datatables@latest/dist/vanilla-dataTables.min.css" rel="stylesheet" type="text/css">
<script src="https://cdn.jsdelivr.net/npm/vanilla-datatables@latest/dist/vanilla-dataTables.min.js" type="text/javascript"></script>
```

You can replace `latest` with the required release number.

CDNs courtesy of [unpkg](https://unpkg.com/#/) and [jsDelivr](http://www.jsdelivr.com/)

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

---

If this project helps you then you can grab me a coffee or beer to say thanks.

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=9B9KD4X57X8V8)

---

Copyright © 2017 Karl Saunders | MIT license
