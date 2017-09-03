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