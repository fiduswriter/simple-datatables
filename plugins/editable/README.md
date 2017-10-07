# Editable
[![Build Status](https://travis-ci.org/Mobius1/Editable.svg?branch=master)](https://travis-ci.org/Mobius1/Editable) [![npm version](https://badge.fury.io/js/vanilla-datatables-editable.svg)](https://badge.fury.io/js/vanilla-datatables-editable) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Mobius1/Editable/blob/master/LICENSE) ![](http://img.badgesize.io/Mobius1/Editable/master/datatable.editable.min.js) ![](http://img.badgesize.io/Mobius1/Editable/master/datatable.editable.min.js?compression=gzip&label=gzipped)

A plugin that makes your Vanilla-DataTables instance editable.


[Demo](https://codepen.io/Mobius1/pen/rGpMMY/) | [Main Repo](https://github.com/Mobius1/Editable).

---

### Install

## Bower
```
bower install vanilla-datatables-editable --save
```

## npm
```
npm install vanilla-datatables-editable --save
```

---

### Browser

Grab the files from one of the CDNs and include them in your page:

```html
<link href="https://unpkg.com/vanilla-datatables-editable@latest/datatable.editable.min.css" rel="stylesheet" type="text/css">
<script src="https://unpkg.com/vanilla-datatables-editable@latest/datatable.editable.min.js" type="text/javascript"></script>

//or

<link href="https://cdn.jsdelivr.net/npm/vanilla-datatables-editable@latest/datatable.editable.min.css" rel="stylesheet" type="text/css">
<script src="https://cdn.jsdelivr.net/npm/vanilla-datatables-editable@latest/datatable.editable.min.js" type="text/javascript"></script>
```

You can replace `latest` with the required release number.

NOTE: Make sure the above js file is included AFTER the main Vanilla-DataTables js file.

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

### `saveCell(value, cell)`
Set the new content of a cell. Just pass the new cell content as the first argument and a reference to the cell as the second.

This can be used to either close and save a cell that is currently in edit mode (as above) or for quickly setting the content of the cell.

```javascript
// Grab the second cell of the third row
var cell = datatable.activeRows[2].cells[1];

// Save it
datatable.editable.saveCell("Foobar", cell);
```

If you already have a cell in edit mode, then just call the `saveCell()` method omitting the the second argument:

```javascript
// Grab the second cell of the third row
var cell = datatable.activeRows[2].cells[1];

// Edit it
datatable.editable.editCell(cell);

// Save it
datatable.editable.saveCell("Foobar");
```


### `saveRow(data, row)`
Set the new content of a row. Just pass the new row data as the first argument and a reference to the row as the second

This can be used to either close and save a row that is currently in edit mode (as above) or for quickly setting the content of the row.

```javascript
// Grab the third row
var row = datatable.activeRows[2];

// Save it
datatable.editable.saveRow(["foo", "bar", "baz", "qux"], row)
```

If you already have a row in edit mode, then just call the `saveRow()` method omitting the second argument:

```javascript
// Grab the third row
var row = datatable.activeRows[2].rows[1];

// Edit it
datatable.editable.editRow(row);

// Save it
datatable.editable.saveRow(["foo", "bar", "baz", "qux"]);
```

---

## Changelog

`v0.0.10`

* Fixed `Enter` key not saving row.

`v0.0.9`

* Change event name:
  * `datatable.editable.init` -> `editable.init`

* Add events:
  * `editable.save.cell`
  * `editable.save.row`
  * `editable.context.open`
  * `editable.context.close`

`v0.0.8`

* Allow `saveCell()` and `saveRow()` methods to save the current cell/row

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