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

---

### `nextText`
#### Type: `string`
#### defaut: `'&rsaquo;'`

Set the content on the next button.

---

### `firstLast`
#### Type: `boolean`
#### Default: `false`

Toggle the skip to first page and skip to last page buttons.

---

### `firstText`
#### Type: `string`
#### defaut: `'&laquo;'`

Set the content of the skip to first page button.

---

### `lastText`
#### Type: `string`
#### defaut: `'&raquo;'`

Set the content of the skip to last page button.

---

### `searchable`
#### Type: `boolean`
#### Default: `true`

Toggle the ability to search the dataset

---

### `sortable`
#### Type: `boolean`
#### Default: `true`

Toggle the ability to sort the columns.

> This option will be forced to `false` if the table has no headings.

---

### `truncatePager`
#### Type: `boolean`
#### Default: `true`

Truncate the page links to prevent overflow with large datasets.

---

### `fixedColumns`
#### Type: `boolean`
#### Default: `true`

Fix the width of the columns. This stops the columns changing width when loading a new page.

---

### 'fixedHeight`
#### Type: `boolean`
#### Default: `false`

Fix the height of the table. This is useful if your last page contains less rows than set in the perPage options and simply stops the table from changing size and affecting the layout of the page.

---

### `data`
#### Type: `object`
#### Default: `undefined`

Pass an object of data to populate the table.

You can set both the headings and rows with `headings` and `rows` properties, respectively. The headings property is optional.

```javascript
var myData = {
	"headings": [
		"Name",
		"Company",
		"Ext.",
		"Start Date",
		"Email",
		"Phone No."
	],
	"rows": [
		[
			"Hedwig F. Nguyen",
			"Arcu Vel Foundation",
			"9875",
			"03/27/2017",
			"nunc.ullamcorper@metusvitae.com",
			"070 8206 9605"
		],
		[
			"Genevieve U. Watts",
			"Eget Incorporated",
			"9557",
			"07/18/2017",
			"Nullam.vitae@egestas.edu",
			"0800 106980"
		],
        ...
	};

var dataTable = new DataTable(myTable, {
	data: myData
});
```

> NOTE: If the headings count and rows count do not match, the library will throw an exception.

---

### `labels`
#### Type: `object`

Customise the displayed labels. (v1.0.6 and above)

#### Defaults
```javascript
labels: {
    placeholder: "Search...",
    perPage: "{select} entries per page",
    noRows: "No entries to found",
    info: "Showing {start} to {end} of {rows} entries",
}
```

#### Type: `[object]`
Customise the displayed labels. (v1.0.6 and above)

#### Defaults
```javascript
labels: {
    placeholder: "Search...",
    perPage: "{select} entries per page",
    noRows: "No entries to found",
    info: "Showing {start} to {end} of {rows} entries",
}
```

The strings wrapped in curly braces represent variables that are inserted.

<table data-table="label">
  <thead>
      <tr>
          <th>Property</th>
          <th>Effect</th>
          <th>Variables</th>
      </tr>
  </thead>
  <tbody>
  	<tr>
          <td><code>placeholder</code></td>
          <td>Sets the placeholder of the search input</td>
          <td>None</td>
    </tr>
  	<tr>
          <td><code>perPage</code></td>
          <td>Sets the per-page dropdown's label</td>
          <td><code>{select}</code> - the per-page dropdown (<code class="danger">required</code>)</td>
    </tr>
  	<tr>
          <td><code>noRows</code></td>
          <td>The message displayed when there are no search results</td>
          <td>None</td>
    </tr>
  	<tr>
          <td><code>info</code></td>
          <td>Displays current range, page number, etc</td>
          <td>
          	<code>{start}</code> - The first row number of the current page<br />
            <code>{end}</code> - The last row number of the current page<br />
            <code>{page}</code> - The current page number<br />
            <code>{pages}</code> - Total pages<br />
            <code>{rows}</code> - Total rows<br />
          </td>
    </tr>    
  </tbody>
</table>

#### Example:

```javascript
labels: {
    placeholder: "Search employees...",
    perPage: "Show {select} employees per page",
    noRows: "No employees to display",
    info: "Showing {start} to {end} of {rows} employees (Page {page} of {pages} pages)",
},
```