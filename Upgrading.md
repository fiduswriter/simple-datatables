### Upgrading

## From 4.0.x to 5.0:

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