As of `v1.2.0`, the `columns` API is implemented and allows access to the table columns for quick manipulation.

As of `v4.0.0`, `columns` is a property and not a method on the current instance.

To use the `columns` API just access under the `columns` property of the current instance:

```javascript
let columns = datatable.columns;
```

You can then chain the following methods.

---

### `get(column [integer])`

Fetch read-only data about the column at index `column`. The `column` parameter should be an integer representing the column.

---

### `size()`

Fetch the number of columns.

---

### `sort(column [integer], direction [string])`

Sort the selected column. The `column` parameter should be an integer representing the column, starting with zero for the first column. The `direction` parameter is optional.

---

### `add(data [object])`

Add a new column to the current instance. The `data` parameter should be an object with the required `heading` and `data` properties set. The `heading` property should be a `string` representing the new column's heading. The `data` property should be an array of `strings` representing the cell content of the new column.

```javascript
let columns = datatable.columns;

let newData = {
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
let newData = {
    type: "date",
    format: "YYYY/MM/DD"
    heading: "Start Date",
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
let columns = datatable.columns;

// Remove the 4th column
columns.remove(3);

// Remove the 1st and 2nd column
columns.remove([0, 1]);

// Remove the last column
columns.remove(datatable.headings.length - 1);
```

---

### `hide(select [integer|array])`

Hides the selected column(s). The columns will not be visible and will be omitted from search results and exported data.

```javascript
// Hide the first and second columns
columns.hide([0, 1]);
```

---

### `show(select [integer|array])`

Shows the selected column(s) (if hidden). The columns will be visible and will be included in search results and exported data.

```javascript
// Show the first and second columns
columns.show([0, 1]);
```

---

### `visible(select [integer|array])`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

If you omit the `select` parameter, an `array` of `booleans` will be returned representing all available columns.

```javascript
let columns = datatable.columns;

// Hide the 4th of 5 columns
columns.hide(3);

// Check visiblilty
columns.visible(3); // returns false
```

or

```javascript
columns.visible([0, 1, 2, 3]); // returns  [true, true, true, false]
```

or

```javascript
columns.visible(); // returns  [true, true, true, false, true]
```

---

### `hidden(select [integer|array])`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

Usage is the same as the `visible` method.

**As of `1.4.18` the `hidden()` method has been deprecated and will be removed in the next minor version.**

---

### `swap(indexes [array])`

Swap th position of two columns. Just pass an array of 2 integers representing the column indexes you require swapping.

```javascript
let columns = datatable.columns;

// Swap the 1st and 6th columns
columns.swap([0, 5]);
```

---

### `order(indexes [array])`

Order the columns based on the given order. Just pass an array of column indexes in the order you require:

### Original order

![Original order](http://i.imgur.com/OK5DoGs.png)

```javascript
// Reorder the columns
datatable.columns.order([1, 3, 4, 2, 0]);
```

### Result

![Original order](http://i.imgur.com/kNGEgpT.png)
