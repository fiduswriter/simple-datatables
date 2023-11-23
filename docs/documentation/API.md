>Please note that the API is not finalised and may change so check back once in while.

### dom
#### type `Object`

Returns a reference to the [`HTMLTableElement`](https://developer.mozilla.org/en/docs/Web/API/HTMLTableElement).

---

### wrapper
#### type `Object`

Returns a reference to the main `HTMLDivElement` that wraps the entire layout.

---

### container
#### type `Object`

Returns a reference to the main `HTMLDivElement` that contains the table.

---

### pagers
#### type `Array`

Returns a reference to the currently displayed pagers.

---

### options
#### type `Object`

Returns the current configuration options.  See [Options](Options)

---

### initialized
#### type `Boolean`

Returns true if the library is fully loaded and all HTML is rendered.

---

### data
#### type `Object`

The data of the table, containing two parts: `headings` and `data` (contents of the tables).

* `headings`: An array of **header cells**.

* `data`: An array of rows of data. Each row consists of an array of **row cells**.


**Header cells** are objects with these fields:

* `data` (any, required): The headers data in it's original format.

* `text` (string, optional): In case the browser's automatic conversion of the data field to a string to display in a browser is not working correctly, this field can be sued to control what is being rendered.

* `type` (string, optional): "html" in case of the data field is an array of DiffDOM nodes. "string" in case of a plaintext string.

**Row cells** are objects with these fields:

* `attributes` (any, optional): The row attributes. Use like `{ "class": "my-class", "style": "background-color: pink;" }`. 

* `cells` (any[], required): The list of cells in this row. See "Content cells" for more details.

**Content cells** are also objects with the same `data` and `text` fields that **header fields** has and additionally with this field:

* `order` (string or integer, optional): Used for sorting in case and is useful if the `data` field cannot be used for sorting.

---

### data-index
#### type `Integer`

All rows in the `data.data` array have a custom propery named `data-index`. This represents the position in the `data` array. It can be useful for getting the correct position of a row as the native `rowIndex` property may be either `-1` if the row isn't rendered or incorrect if you're on any other page than page 1.

Also, in some browsers, the first row of a `tbody` element will have a `rowIndex` of `1` instead of `0` as they take the `thead` row as the first row.

For example if you want to remove the first row on page 5 while showing 5 rows per page (21st row):

```javascript
// grab the first row on page 5
let firstRow = document.querySelector("tbody tr");

// INCORRECT: Because it's the first rendered row the native firstRow.rowIndex
// will be 1 which will remove the second row in the data array
datatable.rows.remove(firstRow.rowIndex);

// CORRECT: firstRow.dataset.index will return 20 which is the
// correct position (21st row) in the data array
datatable.rows.remove(parseInt(firstRow.dataset.index));

```

---

### pages
#### type `Array`

Returns a collection of pages each of which contain collections of `HTMLTableRowElement`s.

---

### hasRows
#### type `Boolean`

Returns `true` if the current table has rows.

---

### hasHeadings
#### type `Boolean`

Returns `true` if the current table has headings.

---

### currentPage
#### type `Integer`

Returns the current page number.

---

### totalPages
#### type `Integer`

Returns the number of pages.

---

### onFirstPage
#### type `Boolean`

Returns `true` if the current page is also the first page.

---

### onLastPage
#### type `Boolean`

Returns `true` if the current page is also the last page.

---

### searching
#### type `Boolean`

Returns `true` if a search is currently being done and search results are displayed.

---

### searchData
#### type `Array`

Returns an array of index numbers of current search result rows from `data.data`.

---
