### Upgrading

## From 5.0.x to 6.0:

Version 6.0 is the biggest update to simple-datatables since version 1.0. I do not expect similar changes in the the next few years.

* Rendering of cells and rows works differently now. Previously you would modify a row by using the `render`-method of a column. That no longer works, but there is now instead a `rowRender` configuration option that can be used to modify how rows are rendered. The options available to the `render` method have also changed.


Instead of:

```js
DataTable("#table", {
  data,
  perPage: 25,
  columns: [
    {
      select: 1,
      render: (data, cell, row) => data + "<button data-row='" + row.dataIndex + "'>Buy Now</button>"
    }
  ]
}
```

Do now:

```js
DataTable("#table", {
  data,
  perPage: 25,
  columns: [
    {
      select: 1,
      render: (data, td, rowIndex, cellIndex) => data + "<button data-row='" + dataIndex + "'>Buy Now</button>"
    }
  ]
}
```

And instead of:

```js
new DataTable("table", {
    data: {
        headings: ["Checked"].concat(Object.keys(data[0])),
        data: data.map(item => [false].concat(Object.values(item)))
    },
    columns: [
        {
            select: 0,
            render: value => `<input type="checkbox" ${value=== "true" ? "checked": ""}>`
        },
        {
            select: 1,
            render: (value, td, tr) => {
                tr.dataset.name = value
                return value
            }
        }
    ]
})
```

Do now:

```js
new DataTable("table", {
    data: {
        headings: ["Checked"].concat(Object.keys(data[0])),
        data: data.map(item => [false].concat(Object.values(item)))
    },
    rowRender: (rowValue, tr, _index) => {
        if (!tr.attributes) {
            tr.attributes = {}
        }
        tr.attributes["data-name"] = rowValue[1].data
        return tr
    },
    columns: [
        {
            select: 0,
            render: (value, _td, _rowIndex, _cellIndex) => `<input type="checkbox" ${value=== "true" ? "checked": ""}>`
        }
    ]
})
```

* CSS selectors are all lowercase now.

Instead of:

```js
document.querySelector('.dataTable-wrapper')
```

do now:

```js
document.querySelector('.datatable-wrapper')
```

**Note:** [Class names are now configurable.](https://github.com/fiduswriter/simple-datatables/wiki/classes) So if you rely on the old class names for some reason, you can configurable simple-datatables to use the old class names: 


* Data is no longer converted to strings by default. Up to version 5, the data internal data storage was in the form of HTML elements.
A side-effect thereof was that any datatyope that was not a string was automatically converted to be a string. This is no longer the case.
In the internal data storage, numbers, boolean values, etc. are kept in their original format and will only be converted to strings when
shown in the DOM.

* Table data is now stored internally arrays of arrays/objects of strings and/or numbers instead fo DOM nodes.
To access the data, look at `dataTable.data.data` (row data) and `dataTable.data.headings` (heading data). DOM nodes are created
only when needed.


* The `dataIndex` property on `<tr>`s is now called `data-index` and is always a string.

Instead of:

```js
const tr = document.querySelector('tr')
const index = tr.dataIndex
const row = dataTable.data[index]
```

do now:

```js
const tr = document.querySelector('tr')
const index = parseInt(tr.dataset.index)
const row = dataTable.data.data[index]
```

* Filtering a column will emit a `datatable.filter(column, filterState)` event instead of a `datatable.sort(column, dir, )`

* The sortColumn() method has been removed.

Instead of:

```js
dataTable.sortColumn(...)
```

do now:

```js
dataTable.column.sort(...)
```


* Filtering is now specified the same way all other column based settings are specified.

Instead of:

```js
new DataTable(t, {
    data,
    filters: {"Job": ["Assistant", "Manager"]},
    columns: [
        {
            select: 4,
            type: "date",
            format: "MM/DD/YYYY"
        }
    ]
})
```

do now:

```js
new DataTable(t, {
    data,
    columns: [
        {
            select: 1,
            filter: ["Assistant", "Manager"]
        },
        {
            select: 4,
            type: "date",
            format: "MM/DD/YYYY"
        }
    ]
})
```

## From 4.0.x to 5.0:

* To get to the dom of the body table, look at `dataTable.dom` rather than `dataTable.table`.

Instead of:

```js
import {
  DataTable
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
dataTable.table.focus()
```

do now:

```js
import {
  DataTable
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
dataTable.dom.focus()
```


* The functions related to exporting have been moved and are now separate from the main `DataTable`.

Instead of:

```js
import {
  DataTable
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
dataTable.export({type: 'csv', download: true, columnDelimiter: ';'})
```

do now:

```js
import {
  DataTable,
  exportCSV // or exportJSON, exportSQL
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
exportCSV(dataTable, {download: true, columnDelimiter: ';'})
```

* The functions related to importing have been moved and are now separate from the main `DataTable`.

Instead of:

```js
import {
  DataTable
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
dataTable.import({type: 'csv', columnDelimiter: ';', data: '...'})
```

do now:

```js
import {
  DataTable,
  convertCSV // or convertJSON
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
const convertedData = convertCSV({columnDelimiter: ';', data: '...'})
dataTable.insert(convertedData)
```

* The handling of the `datatable.selectrow` event has changed in some cases. If you were doing this:

```js
import {
  DataTable
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
dataTable.on("datatable.selectrow", function({row, event}) {
    event.preventDefault()
    row.classList.add('selected')
})
```

Do now:

```js
import {
  DataTable
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
dataTable.on("datatable.selectrow", function(row, event) {
    event.preventDefault()
    row.classList.add('selected')
})
```


## From 3.x to 4.0:

* Note that `rows` and `columns` are just properties on the datatable instance in 4.x rather than methods as they were in 3.x. Exchange any instance of `datatable.rows()` with `datatable.rows` and `datatable.columns()` with `datatable.columns`.
