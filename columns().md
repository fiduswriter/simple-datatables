As of `v1.2.0`, the `columns` API is implemented and allows access to the table columns for quick manipulation.

The API allows for the selection of columns by passing either a single `integer` representing a column index or and `array` of `integer`s representing multiple column indexes tot eh `columns()` constructor:

```javascript
// Select the first, fourth and sixth columns
var columns = datatable.columns([0,3,5]);
```

You may select all columns by leaving omitting the selection:

```javascript
// Select all columns
var columns = datatable.columns();
```

You can then chain the following methods.

---

### `add(data [object])`

Add a new column to the current instance. The `data` parameter should be an object with the required `heading` and `data` properties set. The heading can be a `string`, `ELEMENT_NODE` or `TEXT_NODE`. The `data` property should be an array of `strings`, `ELEMENT_NODE`s or `TEXT_NODE`s

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

// or just

datatable.columns().add(newData);
```

---

### `hide()`

Hides the selected column(s). The columns will not be visible and will be omitted from search results and exported data.

```javascript
// Hide the first and second columns

var columns = datatable.columns([0,1]);
columns.hide();

// or just

datatable.columns([0,1]).hide();
```

---

### `show()`

Shows the selected column(s) (if hidden). The columns will be visible and will be included in search results and exported data.


```javascript
// Show the first and second columns
var columns = datatable.columns([0,1]);
columns.show();

// or just
datatable.columns([0,1]).show();
```

---

### `visible()`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

```javascript
// Select the fourth column
var columns = datatable.columns(3);

// Hide it
columns.hide();

// Check visiblilty
columns.visible() // returns false

or 

datatable.columns().visible() // returns  [true, true, true, false, true]

```

---

### `hidden()`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

---

### `order(indexes [array])` DEPRECATED

Order the columns based on the given order. Just pass an array of column indexes in the order you require. Note that as this method is for setting the order on all columns, you don't need to pass the selected columns to the `columns()` constructor and any that are, will be ignored.

### Original order
![Original order](http://i.imgur.com/OK5DoGs.png)


```javascript
// Reorder the columns
datatable.columns().order([1,3,4,2,0]);
```


### Result
![Original order](http://i.imgur.com/kNGEgpT.png)