### Install

```
npm install simple-datatables --save
```

---

### Initialise

The JS file should be included before any scripts that call the plugin.

Then just initialise the plugin by either passing a reference to the table or a CSS3 selector string as the first parameter:

```javascript
let myTable = document.querySelector("#myTable");
let dataTable = new DataTable(myTable);

// or

let dataTable = new DataTable("#myTable");

```

You can also pass the options object as the second parameter:

```javascript
let dataTable = new DataTable("#myTable", {
    searchable: false,
    fixedHeight: true,
    ...
});
```

### Initial data

You can either supply initial data through the options object or by starting with a table that already has data filled in.

If you start out with a table that already contains header cells, you can add these attributes to individual header cells
to influence how the corresponding column is treated:

* `data-type`: Can be used to set the type of the column. It works the same as using `type` in the [columns](columns) option.

* `data-hidden`: If set to `"true"` will hide the column. It works the same as using `hidden` in the [columns](columns) option.

* `data-searchable`: If set to `"false"` will prevent searching of the column. It works the same as using `searchable` in the [columns](columns) option.

* `data-sortable`: If set to `"false"` will prevent sorting of the column. It works the same as using `sortable` in the [columns](columns) option.

If you start out with a table that already contains data, you can add these attributes to individual cells to influence how
the cell is being processed:

* `data-content`: If this attribute is present on a cell, the value of this attribute rather than the contents of the cell
will be processed.

* `data-order`: If this attribute is present on a cell, the value of this attribute will be used for ordering the row in case
of sorting. Any other sort order will be overridden. IF the field only contains numeric characters, the field will first
be converted to a number.
