### `columns`
#### Type: `array`
#### Default: `undefined`

Controls various aspects of individual or groups of columns. Should be an array of objects with the following properties:

#### `caseFirst`

Default: `"false"` Options: `["false", "upper", "lower"]`. Influences how string sorting is done and whether upper or lower case letters are sorted first. If `"false"` is selected, will use the chosen `locale`'s default sorting order. Specifying `caseFirst`
as part of the table's configuration will define a default for all columns.

#### `cellClass`

Allows to specify the CSS classes to apply to the body cell.

#### `filter`

Instead of ordering the row, clicking on the header will filter it. Specify an array of items to filter for. The array can also contain functions that will be executed on the data item of the cell to determine whether to include it in the filtered content.

#### `format`

A string representing the `datetime` format when using the `date` type. Specifying `format`
as part of the table's configuration will define a default for all columns.

#### `headerClass`

Allows to specify the CSS classes to apply to the header cell.

#### `hidden`

When set to `true` the column(s) will not be visible and will be excluded from search results.

#### `ignorePunctuation`

Default: `true` (boolean). Influences how sorting and searching is done. Specifying `ignorePunctuation` as part of the table's configuration will define a default for all columns.

#### `locale`

Default: `"en-US"` (string). Set a locale such as `en-UK` or `de` for the column. Influences how string sorting is done. Allows even for specification of specific subvariants such as `de-DE-u-co-phonebk`. Specifying `locale` as part of the table's configuration will define a default for all columns.

#### `numeric`

Default: `true` (boolean). Influences how string sorting is done. If `true` multiple numbers will be seen as just one so that "file 1.jpg" will come before "file 100.jpg". Specifying `numeric`
as part of the table's configuration will define a default for all columns.

#### `searchable`

When set to `false` the column(s) cannot be searched.

#### `searchItemSeparator`

Default: `""`. Influences searching in that cell content will be split with this value by default when searching for content. Specifying `searchItemSeparator` as part of the table's configuration will define a default for all search boxes.

#### `searchMethod`

A custom search method to be used for the column(s). The function should take 5 arguments:
`terms` (an array of strings representing the search terms),
`cell` (the cell that is to be checked for the search terms),
`row` (the data row that the cell is part of),
`column` (the id of the column of the cell),
`source` (a unique string given to a particular search interface so that multiple search itnerfaces can be used simultaneously).

It should return `true` if the search string is found in the data, `false` otherwise.

The default is that it simply checks for the presence of a particular search term in the cell content.

Defining a `searchMethod` as part of the table's configuration will define a default for all columns.

#### `select`

An integer or array of integers representing the column(s) to be manipulated.

#### `sensitivity`

Default: `"base"`. Options: `["base", "accent", "case", "variant"]`. Influences how searching is done. `"base"` and `"accent"` will ignore case differences. `"base"` and `"case"` will ignore differences in accent symbols. Specifying `sensitivity` as part of the table's configuration will define a default for all columns.

#### `sort`

Automatically sort the selected column. Can only be applied if a single column is selected.

#### `sortSequence`

An array of "asc" and "desc" describing the order sort will be executed as the user clicks on the column header. Note that each can only be mentioned up to one time. So effectively you have these options:

```js
["asc", "desc"] // default
["desc", "asc"]
["asc"]
["desc"]
```

#### `sortable`

When set to `false` the column(s) cannot be sorted.

#### `type`

A `string` representing the type of data in the column(s) cells. Choose from the following options:

* `html` (default)
* `string`
* `date` - a valid `datetime` string
* `number`
* `boolean`
* `other`

Specifying `type` as part of the table's configuration will define a default for all columns.

#### `render`

A callback to customise the rendering of the column(s) cell content. The function takes 4 parameters.
You can either return a string representing the cells content, you can modify the provided td in the format used by [diffDOM](https://github.com/fiduswriter/diffDOM) or you can return a new td in that same format.

```javascript
 =>
render: function(value, td, rowIndex, cellIndex) {

}

```

---

#### Examples
```javascript
let datatable = new DataTable("#myTable", {
    columns: [
        // Sort the second column in ascending order
        { select: 1, sort: "asc" },

        // Set the third column as datetime string matching the format "DD/MM/YYY"
        { select: 2, type: "date", format: "DD/MM/YYYY" },

        // Disable sorting on the fourth and fifth columns
        { select: [3,4], sortable: false },

        // Hide the sixth column
        { select: 5, hidden: true },

        // Append a button to the seventh column
        {
            select: 6,
            type: 'string',
            render: function(data, td, rowIndex, cellIndex) {
                return `${data}<button type='button' data-row='${rowIndex}'>Select</button>`;
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
