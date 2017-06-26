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
Export the table to various formats. The `options` argument must be an object of options. The only required property is the `type` property which accepts either `csv`, `txt`, `json` or `sql` as it's value. The rest are optional:

```javascript
{
    download: true,
    skipColumn: [],

    // csv
    lineDelimiter:  "\n",
    columnDelimiter:  ",",

    // sql
    tableName: "myTable",

    // json
    replacer: null,
    space: 4
};
```

#### Properties

`download` - test


#### Examples

```javascript
// Export the current page as a csv file
dataTable.export({
    type: "csv",
    filename: "my-csv-file"
    selection: dataTable.currentPage
});
```

```javascript
// Export page 24
var currentPage = dataTable.currentPage;
dataTable.export("csv", "my_csv_file", null, null, 24);
```

```javascript
// Export pages 1-5
var currentPage = dataTable.currentPage;
dataTable.export("csv", "my_csv_file", null, null, [1,2,3,4,5]);
```
