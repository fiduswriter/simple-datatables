### `ajax`
#### Type: `string`
#### Default: `undefined`

Load remote data set via AJAX requst.

Just pass the url to the remote data and the instance will process and insert the data.

```javascript
var dataTable = new DataTable(myTable, {
    ajax: "some/url/data.json
});
```