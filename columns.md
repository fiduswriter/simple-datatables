#### Type: `array`
#### Default: `undefined`

Controls various aspects of individual or groups of columns. Should be an array of objects with the following properties:

#### `select`

An integer or array of integers representing the columns to be manipulated.

#### `sort`

Automatically sort the selected column. Can't be applied if multple columns are selected.

#### `sortable`

When set to `false` the column(s) cannot be sorted.

#### `hidden`

When set to `true` the column(s) will not be visible and will be exlcuded from search results.

#### `type`

A `string` reperesenting the type of data in the column(s) cells. Choose from the following options:

* `string` - lexical ordering
* `number` - any `string` with currency symbols, `.` or `,` thousand seperators, `%`, etc
* `date` - a valid `datetime` string

#### `format`

A string representing the `datetime` format for the `date` type.

---

#### Examples
```javascript
var datatable = new DataTable("#myTable", {
    columns: [
        // Sort the second column in ascending order
        { select: 1, sort: "asc" ),

        // set the third column as datetime string matching the format "DD/MM/YYY"
        { select: 2, type: "date", format: "DD/MM/YYYY" },

        // disable sorting on the fourth and fifth columns
        { select: [3,4], sortable: false },

        // hide the sixth column
        { select: 5, hidden: true },
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