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

## Options

```javascript
var datatable = new DataTable(myTable, {
    plugins: {
        editable: {
            enabled: true,

            // options go here
        }
    }
});
```

### `contextMenu`
#### type: `Boolean`
#### default: `true`

By default right-clicking the table body will open a custom context menu with a list of editor options. Set to `false` to disable.


### `menuItems`
#### type: `Array`

Set the menu items of th context menu. Should be an `Array` of `Objects` with the `text` and `action` properties set.

The `text` property can be any string (including HTML) that represents the content of the menu item. The `action` property is the callback used when clicking the item.

You can use the `separator` property to add a separator.

The `contextMenu` option should be set to `true`.

### Example
```javascript
var datatable = new DataTable(myTable, {
    plugins: {
        editable: {
            enabled: true,

            // Menu items with custom icons
            menuItems: [{
                    text: "<span class='mdi mdi-lead-pencil'></span> Edit Cell",
                    action: function(e) {
                        this.editCell();
                    }
                },
                {
                    text: "<span class='mdi mdi-lead-pencil'></span> Edit Row",
                    action: function(e) {
                        this.editRow();
                    }
                },
                {
                    separator: true
                },
                {
                    text: "<span class='mdi mdi-delete'></span> Remove Row",
                    action: function(e) {
                        if (confirm("Are you sure?")) {
                            this.removeRow();
                        }
                    }
                }
            ]
        }
    }
});
```

### `hiddenColumns`
#### type: `Boolean`
#### default: `false`

By default any hidden columns will be ommited from the editor.

---

## Public Methods

### `init()`
 Initialise the plugin.

```javascript
datatable.editable.init();
```

### `destroy()`
Destroy the plugin instance.

```javascript
datatable.editable.destroy();
```

### `editCell(cell)`
Edit a cell. Just pass a reference to the cell you want to edit.

This method sets the cell in edit mode and shows the input for manually entering the content of the cell.

```javascript
// Grab the second cell of the third row
var cell = datatable.activeRows[2].cells[1];

// Edit it
datatable.editable.editCell(cell);
```

### `editRow(row)`
Edit a row. Just pass a reference to the row you want to edit.

This method sets the row in edit mode and shows the modal with inputs for manually entering the content for each cell.

```javascript
// Grab the first row
var row = datatable.activeRows[0];

// Edit it
datatable.editable.editRow(row);
```

### `saveCell(cell, value)`
Set the new content of a cell. Just pass a reference to the cell as the first argument and the new content of the cell as the second.

This can be used to either close and save a cell that is currently in edit mode (as above) or for quickly setting the content of the cell.

```javascript
// Grab the second cell of the third row
var cell = datatable.activeRows[2].cells[1];

// Save it
datatable.editable.saveCell(cell, "Foobar");
```

### `saveRow(row, data)`
Set the new content of a row. Just pass a reference to the row as the first argument and the new content of the cells as the second.

This can be used to either close and save a row that is currently in edit mode (as above) or for quickly setting the content of the row.

```javascript
// Grab the third row
var row = datatable.activeRows[2];

// Save it
datatable.editable.saveRow(row, ["foo", "bar", "baz", "qux"])
```

---

## Changelog

`v0.0.7`

* Fixed context menu not closing

`v0.0.6`

* `saveRow()` method added
* `saveCell()` method added
* Allow disabling of contxt menu

`v0.0.5`

* Fixed editing rows with hidden columns

`v0.0.4`

* Fixed edit mode exiting when clicking input

---

Copyright © 2017 Karl Saunders | MIT license