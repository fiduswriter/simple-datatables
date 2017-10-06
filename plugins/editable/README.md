# Editable

A plugin that makes your Vanilla-DataTables instance editable.


[Demo](https://codepen.io/Mobius1/pen/rGpMMY/).

---


### Browser

Grab the files from one of the CDNs and include them in your page:

```html
<link href="https://cdn.jsdelivr.net/npm/vanilla-datatables@latest/plugins/editable/datatable.editable.css" rel="stylesheet" type="text/css">
<script src="https://cdn.jsdelivr.net/npm/vanilla-datatables@latest/plugins/editable/datatable.editable.js" type="text/javascript"></script>
```

---

### Enable Plugin:

```javascript
var datatable = new DataTable(myTable, {
    plugins: {
        editable: {
            enabled: true
        }
    }
});
```

Or you can delay initialisation:


```javascript
var datatable = new DataTable(myTable, {
    plugins: {
        editable: {
            enabled: false
        }
    }
});

datatable.editable.init();
```

---

### Public Methods

#### `init()`
 Initialise the plugin.

```javascript
datatable.editable.init();
```

#### `destroy()`
Destroy the plugin instance.

```javascript
datatable.editable.destroy();
```

#### `editCell(cell)`
Edit a cell. Just pass a reference to the cell you want to edit.

This method sets the cell in edit mode and shows the input for manually entering the content of the cell.

```javascript
// Grab the second cell of the third row
var cell = datatable.activeRows[2].cells[1];

// Edit it
datatable.editable.editCell(cell);
```

#### `editRow(row)`
Edit a row. Just pass a reference to the row you want to edit.

This method sets the row in edit mode and shows the modal with inputs for manually entering the content for each cell.

```javascript
// Grab the first row
var row = datatable.activeRows[0];

// Edit it
datatable.editable.editRow(row);
```

#### `saveCell(cell, value)`
Set the new content of a cell. Just pass a reference to the cell as the first argument and the new content of the cell as the second.

This can be used to either close and save a cell that is currently in edit mode (as above) or for quickly setting the content of the cell.

```javascript
// Grab the second cell of the third row
var cell = datatable.activeRows[2].cells[1];

// Save it
datatable.editable.saveCell(cell, "Foobar");
```

#### `saveRow(row, data)`
Set the new content of a row. Just pass a reference to the row as the first argument and the new content of the cells as the second.

This can be used to either close and save a row that is currently in edit mode (as above) or for quickly setting the content of the row.

```javascript
// Grab the third row
var row = datatable.activeRows[2];

// Save it
datatable.editable.saveRow(row, ["foo", "bar", "baz", "qux"])
```


---

Don't forget to check the [wiki](https://github.com/Mobius1/Vanilla-DataTables/wiki) out for further help.

---


Copyright © 2017 Karl Saunders | MIT license