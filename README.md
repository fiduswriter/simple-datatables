# Simple-DataTables

A lightweight, extendable, dependency-free javascript HTML table plugin. Similar to jQuery DataTables, but without the jQuery dependency.

Based on [Vanilla-DataTables](https://github.com/Mobius1/Vanilla-DataTables), but written in ES2018.

# CDN

To use the CDN version of Simple-DataTables use either [https://cdn.jsdelivr.net/npm/simple-datatables@latest](https://cdn.jsdelivr.net/npm/simple-datatables@latest) or [https://unpkg.com/simple-datatables](https://unpkg.com/simple-datatables). You also need to add the CSS styling, so the elements you'll add to html head element can for example be these:

```html
<link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" type="text/css">
<script src="https://cdn.jsdelivr.net/npm/simple-datatables@latest" type="text/javascript"></script>
```



### License

LGPL

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
* dayjs integration for sorting columns with datetime strings
* Extentable with custom plugins [See the Simple-DataTables wiki](https://github.com/fiduswriter/Simple-DataTables/wiki/Plugins)


[Simple-DataTables Documentation](https://github.com/fiduswriter/Simple-DataTables/wiki)


---

### Install

## npm
```
npm install simple-datatables --save
```

---

### Quick Start

Then just initialise the plugin by import DataTable and either passing a reference to the table or a CSS3 selector string as the first parameter:

```javascript
import {DataTable} from "simple-datatables"

const myTable = document.querySelector("#myTable");
const dataTable = new DataTable(myTable);

// or

const dataTable = new DataTable("#myTable");

```

You can also pass the options object as the second paramater:

```javascript
import {DataTable} from "simple-datatables"

const dataTable = new DataTable("#myTable", {
	searchable: false,
	fixedHeight: true,
	...
})
```
