>Please note that the API is not finalised and may change so check back once in while.

### table
#### type `Object`

Returns a reference to the [`HTMLTableElement`](https://developer.mozilla.org/en/docs/Web/API/HTMLTableElement).

---

### head
#### type `Object`

Returns a reference to the [`HTML <thead> element`](https://developer.mozilla.org/en/docs/Web/HTML/Element/thead).

---

### body
#### type `Object`

Returns a reference to the [`HTML <tbody> element`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody).

---

### foot
#### type `Object`

Returns a reference to the [`HTML <tfoot> element`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot).

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

### headings
#### type `HTMLCollection`

Returns a live `HTMLCollection` of the the table headings.

---

### options
#### type `Object`

Returns the current configuration options.

---


### initialized
#### type `Boolean`

Returns true if the library is fully loaded and all HTML is rendered.

---

### isIE
#### type `Boolean`

Returns `true` if the current browser is a version of `MS Internet Exporer` or `MS Edge`.

---

### data
#### type `Array`

Returns a collection of all [`HTMLTableRowElement`s](https://developer.mozilla.org/en/docs/Web/API/HTMLTableRowElement) in the table.

---

### dataIndex
#### type `Integer`

All rows in the `data` array have a custom propery named `dataIndex`. This represents the position in the `data` array. It can be useful for getting the correct position of a row as the native `rowIndex` property may be either `-1` if the row isn't rendered or incorrect if you're on any other page than page 1.

Also, in some browsers, the first row of a `tbody` element will have a `rowIndex` of `1` instead of `0` as they take the `thead` row as the first row.

For example if you want to remove the first row on page 5 while showing 5 rows per page (21st row):

```javascript
// grab the first row on page 5
var firstRow = document.querySelector("tr");

// INCORRECT: Because it's the first rendered row the native firstRow.rowIndex
// will be 1 which will remove the second row in the data array
datatable.rows().remove(firstRow.rowIndex);

// CORRECT: firstRow.dataIndex will return 20 which is the
// correct position (21st row) in the data array
datatable.rows().remove(firstRow.dataIndex);

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

Returns then number of pages.

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

Returns a collection of `HTMLTableRowElement`s containing matching results.

---