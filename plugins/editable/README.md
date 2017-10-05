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

```javascript
// Grab the second cell of the third row
var cell = datatable.activeRows[2].cells[1];

// Edit it
datatable.editable.editCell(cell);
```

#### `editRow(row)`
Edit a row. Just pass a reference to the row you want to edit.

```javascript
// Grab the first row
var row = datatable.activeRows[0];

// Edit it
datatable.editable.editRow(row);
```

---

Don't forget to check the [wiki](https://github.com/Mobius1/Vanilla-DataTables/wiki) out for further help.

---


Copyright © 2017 Karl Saunders | MIT license