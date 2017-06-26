Vanilla DataTables comes with a bunch of public methods for you to utilise. Just call the method after instantiating the plugin, like so:

```javascript
var datatable = new DataTable("#myTable");

datatable.methodnName();
```

---

### refresh()

Refreshes the table. This will recount the rows, reset any search and remove any set message, but will not reset any sorting.

---

### page(`num [int]`)

Load a chosen page.

---

### addRows(`data [object]`)
Add new rows to the table. Must be an object with the `rows` propery set and the number of values for each row must match the column count of the table.

```javascript
var dataTable = new DataTable("#myTable");

// New data to add
var newData = {
	rows: [
		[
            "Cedric Kelly",
            "Senior Javascript Developer",
            "Edinburgh",
            "6224",
            "2012/03/29",
            "$433,060"
        ],
        [
            "Airi Satou",
            "Accountant",
            "Tokyo",
            "5407",
            "2008/11/28",
            "$162,700"
        ]
      ]
};

// add the rows
dataTable.addRows(newData);
```

---

### sortColumn(`column [int]`, `direction [string]`)
Sort the data by column and direction. The column numbers are zero-indexed so the first column is `0`, second is `1`, etc.


```javascript
// sort the 4th column in descending order
dataTable.sortColumn(3, 'desc');
```

---

### setMessage(`message [string]`)
Display a message in the table.

```javascript
dataTable.setMessage("Hello, world!");
```

---

### init()
Re-initialise the instance after calling the `destroy()` method.

---

### destroy()
Destroy the instance.

---

### export(`options [object]`)
Export the table data to various formats.

The `options` argument must be an object of which the only required property is the `type` property which accepts either `csv`, `txt`, `json` or `sql` as it's value. The rest are optional:

```javascript
{
    download: true, // trigger download of file or return the string
    skipColumn: [], // array of column indexes to skip

    // csv
    lineDelimiter:  "\n", // line delimiter for csv type
    columnDelimiter:  ",", // column delimiter for csv type

    // sql
    tableName: "myTable", // SQL table name for sql type

    // json
    replacer: null, // JSON.stringify's replacer parameter for json type
    space: 4 // JSON.stringify's space parameter for json type
};
```

#### Examples

```javascript
// Export the current page as a .csv file
dataTable.export({
    type: "csv",
    filename: "my-csv-file"
    selection: dataTable.currentPage
});
```

```javascript
// Export pages 1-5 as an .sql file

dataTable.export({
    type: "sql",
    tableName: "sql_users",
    selection: [1,2,3,4,5]
});
```

```javascript
// Export to json string
dataTable.export({
    type: "json",
    download: false
});
```

```javascript
// Export to .json file, omitting the 1st, 3rd and 5th columns
dataTable.export({
    type: "json",
    skipColumn: [0,2,4],
});
```
