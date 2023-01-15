# simple-datatables

A lightweight, extendable, JavaScript HTML table library. Similar to jQuery DataTables **for use in modern browsers**, but without the jQuery dependency. Note: If you want a version that works in very old browsers (IE, etc.), then head over to https://github.com/fiduswriter/simple-datatables-classic .

Originally a fork of [Vanilla-DataTables](https://github.com/Mobius1/Vanilla-DataTables), but written in TypeScript and transpilled to Vanilla JavaScript.

See the demos [here](https://fiduswriter.github.io/simple-datatables/demos/).



### Upgrading

For upgrading from one major version to another, check the upgrade guide:
https://fiduswriter.github.io/simple-datatables/documentation/Upgrading

**Note**: The upgrade from version 5 version 6 is the most complicated upgrade so far. Please read through the instructions before filing complaints. If you run simple-datatables from a CDN, make sure that you have fixed it to a specific major or minor version so that you do not accidentally upload to a new version that requires you to do lots of manual adjustments.


# CDN

To use the CDN version of simple-datatables use either [https://cdn.jsdelivr.net/npm/simple-datatables@latest](https://cdn.jsdelivr.net/npm/simple-datatables@latest) or [https://unpkg.com/simple-datatables](https://unpkg.com/simple-datatables). You also need to add the CSS styling, so the elements you'll add to html head element can for example be these:

**Note:** For production websites, specify a specific major version. For example [https://cdn.jsdelivr.net/npm/simple-datatables@6](https://cdn.jsdelivr.net/npm/simple-datatables@6) for the latest version in the 6.x.x series or [https://cdn.jsdelivr.net/npm/simple-datatables@6.0](https://cdn.jsdelivr.net/npm/simple-datatables@6.0) for the latest version in the 6.0.x series.

```html
<link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" type="text/css">
<script src="https://cdn.jsdelivr.net/npm/simple-datatables@latest" type="text/javascript"></script>
```

### License

LGPL

### Features

* Sortable/filterable columns
* Pagination
* Searchable
* Customisable layout
* Customisable labels
* Customise column rendering
* Export to common formats like `csv`, `txt` `json`, and `sql`
* Import `csv` and `json` data
* Control column visibility
* Reorder or swap columns
* dayjs integration for sorting columns with datetime strings
* Using [diffDOM](https://github.com/fiduswriter/diffDOM) for updating the DOM


[simple-datatables Documentation](https://fiduswriter.github.io/simple-datatables/documentation)


---

### Install

## npm
```
npm install simple-datatables --save
```
## Yarn
```
yarn add simple-datatables
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

You can also pass the options object as the second parameter:

```javascript
import {DataTable} from "simple-datatables"

const dataTable = new DataTable("#myTable", {
	searchable: false,
	fixedHeight: true,
	...
})
```

If using the CDN:

```javascript
const dataTable = new simpleDatatables.DataTable("#myTable", {
	searchable: false,
	fixedHeight: true,
	...
})
```
