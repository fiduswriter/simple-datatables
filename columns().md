As of `v1.2.0`, the `columns` API is implemented and allows access to the table columns for quick manipulation.

To use the `columns` API just call the `columns()` method on the current instance:

```javascript
var columns = datatable.columns();
```

You can then chain the following methods.

---

### `add(data [object])`

Add a new column to the current instance. The `data` parameter should be an object with the required `heading` and `data` properties set. The `heading` property should be a `string` representing the new column's heading. The `data` property should be an array of `strings` representing the cell content of the new column.

```javascript
var columns = datatable.columns();

var newData = {
    heading: "Column Heading",
    data: [
        "Value 1",
        "Value 2",
        "Value 3",
        ...
    ]
};

// Add the new column
columns.add(newData);
```

You can also pass the `sortable`, `type` and `format` properties to further customise the new column.

The `sortable` property defaults to `true`, unless sorting is disabled globally.

```javascript
var newData = {
    type: "date",
    format: "YYYY/MM/DD"
    heading: "Start Data",
    data: [
        "1999/10/25",
        "2000/05/12",
        "2003/08/01",
        ...
    ]
};
```

---

### `remove(select [integer|array])`

Remove a column or columns from the current instance. The `select` parameter should be either an `integer` or an array of `integers` representing the column indexes to be removed.

```javascript
var columns = datatable.columns();

// Remove the 4th column
columns.remove(3);

// Remove the 1st and 2nd column
columns.remove([0,1]);

// Remove the last column
columns.remove(datatable.headings.length - 1);

```

---

### `hide(select [integer|array])`

Hides the selected column(s). The columns will not be visible and will be omitted from search results and exported data.

```javascript
// Hide the first and second columns

var columns = datatable.columns();
columns.hide([0,1]);

// or just

datatable.columns().hide([0,1]);
```

---

### `show(select [integer|array])`

Shows the selected column(s) (if hidden). The columns will be visible and will be included in search results and exported data.


```javascript
// Show the first and second columns
var columns = datatable.columns();
columns.show([0,1]);

// or just
datatable.columns().show([0,1]);
```

---

### `visible(select [integer|array])`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

```javascript
// Select the fourth column
var columns = datatable.columns();

// Hide it
columns.hide(3);

// Check visiblilty
columns.visible(3) // returns false

or 

datatable.columns().visible() // returns  [true, true, true, false, true]

```

---

### `hidden(select [integer|array])`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

---

### `order(indexes [array])`

Order the columns based on the given order. Just pass an array of column indexes in the order you require. Note that as this method is for setting the order on all columns, you don't need to pass the selected columns to the `columns()` constructor and any that are, will be ignored.

### Original order
![Original order](http://i.imgur.com/OK5DoGs.png)


```javascript
// Reorder the columns
datatable.columns().order([1,3,4,2,0]);
```


### Result
![Original order](http://i.imgur.com/kNGEgpT.png)