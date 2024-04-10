## Upgrading

### From 8.0.x to 9.0.x

-   The type of [`datatable.data.data`](API#data) (the list of rows) has changed from `object[]` to `{ attributes: object, cells: object[] }[]`. To access the content cells it is now necessary to access the `cells` attribute present in each row. Instead of:

```js
const dt = new DataTable(myTable, {
    data: {
        headings: ["Name"],
        data: [["John Doe"]],
    },
});

const names = dt.data.data.map((row) => row[0].text);
```

Do:

```js
new DataTable(myTable, {
    data: {
        headings: ["Name"],
        data: [
            {
                cells: ["John Doe"],

                // It is now possible to add custom attributes to the row, with:
                // attributes: {
                //     class: "my-row",
                //     style: "background-color: pink"
                // },
            },
        ],
    },
});

const names = dt.data.data.map((row) => row.cells[0].text);
```

-   The first argument for [rowRender](rowRender) has changed from `object[]` to `{ attributes: object, cells: object[] }`. It is now possible to customize the row attributes, like class and style by updating the `attributes` key. The content cells are now behind the `cells` attribute.
    Please make the following changes in your code:

```js
rowRender: (row, tr, index) => {
    // old, in 8.0.x:
    const firstCell = row[0];

    // new, in 9.0.x:
    const firstCell = row.cells[0];
    row.attributes.class = "my-row";
};
```

### From 7.1.x to 8.0.x

-   `dataTable.multiSearch()` takes slightly different arguments. Before, search terms were being split up internally. Now you have to do it beforehand. So instead of `{term: string, columns: (none | number[])}` it now takes: `{terms: string[], columns: (none | number[])}`
-   The option `isSplitQueryWord` has been removed both columns and the dataTable. Instead, use a zero length `searchQuerySeparator` to signal that queries are not to be split.

-   The option `searchQuerySeparator` has been removed from columns as this feature was not used. You may want to use the new `searchItemSeparator` instead. Overriding `searchQuerySeparator` for individual search boxes can be done by adding a `data-query-separator` attribute to the search input.

-   And searches; Have not been working correctly since version 5. Specify the option `searchAnd` to the dataTable to make all searches require all search words to occur for a row to be shown.

-   The pagination links/buttons are no longer `<a>`-elements but instead `<button>`-elements. This could have styling implications for you.

### From 7.0.x to 7.1.x

-   The [search()](<search()>) methods allows to specify which columns are to be searched. And the [multiSearch()](<multiSearch()>) method allows specifying multiple simultaneous searches.

### From 6.0.x to 7.0.x

-   Attributes and class names of the main table are no longer removed.

-   The configuration options [pagerRender](pagerRender) and [tableRender](tableRender) allow you to specify functions to be called to influence the rendering of pagers and the table, similar to how [rowRender](rowRender) and [render](columns#render) already allow you to modify the way cells and rows are rendered.

-   The `layout` configuration options have been removed. Instead, there is now a `template` configuration option that allows you to freely decide where to put all the elements around the table. Take a look at the [default template](template), then copy and modify it.

-   The default values of some class names have changed:

    -   `active` is now `datatable-active`
    -   `asc` is now `datatable-ascending`
    -   `desc` is now `datatable-descending`
    -   `disabled` is now `datatable-disabled`
    -   `ellipsis` is now `datatable-ellipsis`

-   The `columns` option allows for the specification of a specific class for the header cell or body cell using `headerClass` and `cellClass`.

-   The `columns` option allows for the selection of several new values for `type`. You can now choose between:

    -   `html` (default)
    -   `string`
    -   `date`
    -   `number`
    -   `boolean`
    -   `other`

`html` has to be used for text that can contain HTML tags that should be rendered, whereas `string` will escape all tags. The `type` is used to determine how to order items in the column when sorting. Setting the `type` on the table's configuration will set a default value.

-   There are several new options to influence how search and sorting works that can be applied either to the entire table configuration or specific columns. For sorting: `locale`, `numeric` and `caseFirst` and for searching: `sensitivity`. `ignorePunctuation` is used for both.

-   The `dataConvert` configuration option has been dropped, as it's faster to manipulate the values in `datatable.data.data` and then run `datatable.update()` to render the table again.

### From 5.0.x to 6.0.x:

Version 6.0 is the biggest update to simple-datatables since version 1.0. I do not expect similar changes in the next few years.

-   The source of truth used to be the `<tr>`-elements that simple-datatables would collect from the initial table or new `<tr>`-elements that it would create later on based upon configuration. Exporting data or searching through the data would involve looking through these elements and their contents. In version 6, the source of truth is the data that can be found in [`datatable.data`](data). To access the data, look at `dataTable.data.data` (row data) and `dataTable.data.headings` (heading data).

-   If an initial table DOM is provided it is converted to the internal format first. If data is provided in some other way, it is directly stored in the internal data storage without going through the DOM first. The table DOM is then rendered and later on re-rendered based on that data using [diffDOM](https://github.com/fiduswriter/diffDOM).

-   Incoming data is no longer converted to strings by default. Up to version 5, a side effect of the data internal data storage being run in the form of HTML elements was that any datatype that was not a string was automatically converted to be a string. This is no longer the case.
    In the internal data storage, numbers, boolean values, etc. are kept in their original format and will only be converted to strings when
    shown in the DOM. For formats where it's unclear how it should be rendered as a string, a separate string (`text`) can be provided.

-   You can no longer manually add things to the table DOM and expect for it to stay in place. In version 5 and prior to that, you could add your own custom classes/attributes to `<table>`/`<tr>`/`<td>`-elements and expect for these to stay in place. That is no longer possible with 6. If you want to add specific class names, look at either [configuring the class names](classes) used by simple-datatables, or at adding extra classes using the [`rowRender`](rowRender) configuration option.

-   Rendering of cells and rows works differently now. Previously you would modify a row by using the `render`-method of a column. That no longer works, but there is now instead a [`rowRender`](rowRender) configuration option that can be used to modify how rows are rendered. The options available to the `render` method have also changed.

Instead of:

```js
DataTable("#table", {
    data,
    perPage: 25,
    columns: [
        {
            select: 1,
            render: (data, cell, row) =>
                data +
                "<button data-row='" +
                row.dataIndex +
                "'>Buy Now</button>",
        },
    ],
});
```

Do now:

```js
DataTable("#table", {
    data,
    perPage: 25,
    columns: [
        {
            select: 1,
            render: (data, td, dataIndex, cellIndex) =>
                data + "<button data-row='" + dataIndex + "'>Buy Now</button>",
        },
    ],
});
```

And instead of:

```js
new DataTable("table", {
    data: {
        headings: ["Checked"].concat(Object.keys(data[0])),
        data: data.map((item) => [false].concat(Object.values(item))),
    },
    columns: [
        {
            select: 0,
            render: (value) =>
                `<input type="checkbox" ${value === "true" ? "checked" : ""}>`,
        },
        {
            select: 1,
            render: (value, td, tr) => {
                tr.dataset.name = value;
                return value;
            },
        },
    ],
});
```

Do now:

```js
new DataTable("table", {
    data: {
        headings: ["Checked"].concat(Object.keys(data[0])),
        data: data.map((item) => [false].concat(Object.values(item))),
    },
    rowRender: (rowValue, tr, _index) => {
        if (!tr.attributes) {
            tr.attributes = {};
        }
        tr.attributes["data-name"] = rowValue[1].data;
        return tr;
    },
    columns: [
        {
            select: 0,
            render: (value, _td, _rowIndex, _cellIndex) =>
                `<input type="checkbox" ${value === "true" ? "checked" : ""}>`,
        },
    ],
});
```

-   CSS selectors are all lowercase now.

Instead of:

```js
document.querySelector(".dataTable-wrapper");
```

do now:

```js
document.querySelector(".datatable-wrapper");
```

**Note:** [Class names are now configurable.](classes) So if you rely on the old class names for some reason, you can configure simple-datatables to use the old class names.

-   The `dataIndex` property on `<tr>`s is now called `data-index` and is always a string.

Instead of:

```js
const tr = document.querySelector("tr");
const index = tr.dataIndex;
const row = dataTable.data[index];
```

do now:

```js
const tr = document.querySelector("tr");
const index = parseInt(tr.dataset.index);
const row = dataTable.data.data[index];
```

-   Filtering a column will emit a `datatable.filter(column, filterState)` event instead of a `datatable.sort(column, dir, )`

-   The sortColumn() method has been removed.

Instead of:

```js
dataTable.sortColumn(...)
```

do now:

```js
dataTable.column.sort(...)
```

-   Filtering is now specified the same way all other column based settings are specified.

Instead of:

```js
new DataTable(t, {
    data,
    filters: { Job: ["Assistant", "Manager"] },
    columns: [
        {
            select: 4,
            type: "date",
            format: "MM/DD/YYYY",
        },
    ],
});
```

do now:

```js
new DataTable(t, {
    data,
    columns: [
        {
            select: 1,
            filter: ["Assistant", "Manager"],
        },
        {
            select: 4,
            type: "date",
            format: "MM/DD/YYYY",
        },
    ],
});
```

-   `dataTable.rows.add()` can no longer be used to add multiple rows. Use `dataTable.insert()` instead.

Instead of:

```js
...
let newRows = [
    ["column1", "column2", "column3", "column4", ...],
    ["column1", "column2", "column3", "column4", ...],
    ["column1", "column2", "column3", "column4", ...],
    ["column1", "column2", "column3", "column4", ...],
    ...
];
dataTable.rows.add(newRows);
```

do now:

```js
...
let newRows = [
    ["column1", "column2", "column3", "column4", ...],
    ["column1", "column2", "column3", "column4", ...],
    ["column1", "column2", "column3", "column4", ...],
    ["column1", "column2", "column3", "column4", ...],
    ...
];
dataTable.insert({data: newRows});
```

-   The `init()` method can no longer be used to change the options of the datatable. Depending on whether you just want to change just the data or also other options, you can either reset just the data or destroy the table and create a new one instead.

Instead of:

```js
dataTable.init(newOptions);
```

do now:

```js
datatable.destroy();
datatable = new simpleDatatables.DataTable("#tablename", newOptions);
```

And instead of:

```js
dataTable.init({ data: newHeadingsAndData });
```

do now:

```js
// Reset table headings data
dataTable.data = {
    data: [],
    headings: [],
};
dataTable.hasHeadings = false;
dataTable.hasRows = false;
dataTable.insert(newHeadingsAndData);
```

### From 4.0.x to 5.0:

-   To get to the dom of the body table, look at `dataTable.dom` rather than `dataTable.table`.

Instead of:

```js
import { DataTable } from "simple-datatables";
const dataTable = new DataTable("#myTable");
dataTable.table.focus();
```

do now:

```js
import { DataTable } from "simple-datatables";
const dataTable = new DataTable("#myTable");
dataTable.dom.focus();
```

-   The functions related to exporting have been moved and are now separate from the main `DataTable`.

Instead of:

```js
import { DataTable } from "simple-datatables";
const dataTable = new DataTable("#myTable");
dataTable.export({ type: "csv", download: true, columnDelimiter: ";" });
```

do now:

```js
import {
    DataTable,
    exportCSV, // or exportJSON, exportSQL
} from "simple-datatables";
const dataTable = new DataTable("#myTable");
exportCSV(dataTable, { download: true, columnDelimiter: ";" });
```

-   The functions related to importing have been moved and are now separate from the main `DataTable`.

Instead of:

```js
import { DataTable } from "simple-datatables";
const dataTable = new DataTable("#myTable");
dataTable.import({ type: "csv", columnDelimiter: ";", data: "..." });
```

do now:

```js
import {
    DataTable,
    convertCSV, // or convertJSON
} from "simple-datatables";
const dataTable = new DataTable("#myTable");
const convertedData = convertCSV({ columnDelimiter: ";", data: "..." });
dataTable.insert(convertedData);
```

-   The handling of the `datatable.selectrow` event has changed in some cases. If you were doing this:

```js
import { DataTable } from "simple-datatables";
const dataTable = new DataTable("#myTable");
dataTable.on("datatable.selectrow", function ({ row, event }) {
    event.preventDefault();
    row.classList.add("selected");
});
```

Do now:

```js
import { DataTable } from "simple-datatables";
const dataTable = new DataTable("#myTable");
dataTable.on("datatable.selectrow", function (row, event) {
    event.preventDefault();
    row.classList.add("selected");
});
```

### From 3.x to 4.0:

-   Note that `rows` and `columns` are just properties on the datatable instance in 4.x rather than methods as they were in 3.x. Exchange any instance of `datatable.rows()` with `datatable.rows` and `datatable.columns()` with `datatable.columns`.
