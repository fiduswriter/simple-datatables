Vanilla-DataTables can be initialised with custom options passed as the second parameter of the constructor.

```javascript
var options = {
    searchable: true,
    perPage: 10,
   ...
};
var dataTable = new DataTable(myTable, options);
```

---

### `perPage`
#### Default: `10`
#### Type: `integer`

Sets the maximum number of rows to display on each page.

---

### `perPageSelect`
#### Default: `[5, 10, 15, 20, 25]`
#### Type: `array`

Sets the per page options in the dropdown. Must be an array of integers.

Setting this to `false` will hide the dropdown.

---

### `nextPrev`
#### Default: `true`
#### Type: `integer`

Toggle the next and previous pagination buttons

---

### `prevText`
#### Type: `string`
#### defaut: `'&lsaquo;'`

Set the content on the previous button.


```javascript
new DataTable("#myTable", {
	prevText: "Previous"
});
```