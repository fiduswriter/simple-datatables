#### Type: `array`
#### Default: `undefined`

Controls various aspects of individual or groups of columns. Should be an array of objects with the following properties:

#### `select`

An integer or array of integers representing the columns to be manipulated.

#### `sort`

Automatically sort the selected column. Can only be applied if a single column is selected.

#### `sortable`

When set to `false` the column(s) cannot be sorted.

#### `hidden`

When set to `true` the column(s) will not be visible and will be exlcuded from search results.

#### `type`

A `string` reperesenting the type of data in the column(s) cells. Choose from the following options:

* `string` - lexical ordering (default)
* `number` - any `string` with currency symbols, `.` or `,` thousand seperators, `%`, etc
* `date` - a valid `datetime` string

#### `format`

A string representing the `datetime` format when using the `date` type.


#### `render`

A callback to customise the rendering of the column(s) cell content. The function takes 3 parameters and should return the formatted cell content.

```javascript

/**
 * @param {String} data The cell's content (innerHTML)
 * @param {Object} cell The HTMLTableCellElement
 * @param {Object} row The cell's parent HTMLTableRowElement 
 */
render: function(data, cell, row) {

}		

```

---

#### Examples
```javascript
var datatable = new DataTable("#myTable", {
    columns: [
        // Sort the second column in ascending order
        { select: 1, sort: "asc" ),

        // Set the third column as datetime string matching the format "DD/MM/YYY"
        { select: 2, type: "date", format: "DD/MM/YYYY" },

        // Disable sorting on the fourth and fifth columns
        { select: [3,4], sortable: false },

        // Hide the sixth column
        { select: 5, hidden: true },

        // Append a button to the seventh column
        {
            select: 6,
            render: function(data, cell, row) {
                return data + "<button type='button' data-row='"  + row.dataIndex + "'>Select</button>";
            }
        }
    ]
});
```

You can use the same properties in your markup. Just add the property to the `th` element as a `data-{property}` attribute:

```html
<table>
    <thead>
        <th data-sortable="false">Heading 1</th>
        <th data-type="date" data-format="MMM DD, YYYY">Heading 2</th>
        <th data-hidden="true">Heading 3</th>
        ...
    </thead>
    ...
</table>
```