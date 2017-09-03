#### type `Function`

Export the table data to various formats.

#### Usage
```javascript
/**
 * @param  {Object} options User options
 * @return {Boolean}
 */
datatable.export();
```

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
// Export to .json file
dataTable.export({
    type: "json",
});
```

```javascript
// Export to json string, omitting the 1st, 3rd and 5th columns
dataTable.export({
    type: "json",
    skipColumn: [0,2,4],
    download: false // return formatted string instead of file
});
```