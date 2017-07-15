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

### `columns`
#### Type: `array`
#### Default: `undefined`

Controls various aspects of individual or groups of columns. Should be an array of objects with the following properties:

* `select` - and integer or array of integers representing the the column index(es)
* `sortable` - when set to `false` the column(s) cannot be sorted
* `hidden` - when set to `true` the column(s) will not be visible and will be exlcuded from search results
* `type` - a string reperesenting the type of data in the column(s) cells. Choose from the following options:
    * `number` - any `string` with currency symbols, `.` or `,` thousand seperators, `%`, etc
    * `date` - a valid `datetime` string
* `format` - a string represnting the `datetime` format for the `date` type.

#### Example
```javascript
var datatable = new DataTable("#myTable", {
    columns: [
        // set the third column as datetime string matching the format "DD/MM/YYY"
        { select: 2, type: "date", format: "DD/MM/YYYY" },

        // disable sorting on the fourth and fifth columns
        { select: [3,4], sortable: false },

        // hide the sixth column
        { select: 5, hidden: true },
    ]
});
```

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

### Using key-value pairs

If your data is in the form of key-value pairs, you can quickly convert it to a format that the API can use:

```javascript

var data = [
    {
        "prop1": "value1",
        "prop2": "value2",
        "prop3": "value3"
    },
    {
        "prop1": "value4",
        "prop2": "value5",
        "prop3": "value6"
    }
];

var obj = {
    // Quickly get the headings
    headings: Object.keys(data[0]),

    // rows array
    rows: []
};

// Loop over the objects to get the values
for ( var i = 0; i < data.length; i++ ) {
	
    obj.rows[i] = [];
	
    for (var p in data[i]) {
        if( data[i].hasOwnProperty(p) ) {
            obj.rows[i].push(data[i][p]);
        } 
    } 
}

```

which will produce:

```javascript
{
   headings : [
      "prop1",
      "prop2",
      "prop3"
   ],
   rows : [
      [
         "value1",
         "value2",
         "value3"
      ],
      [
         "value4",
         "value5",
         "value6"
      ]
   ]
}
```

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

---

### `layout`
#### Type: `object`

### Default
```javascript
layout: {
    top: "{select}{search}",
    bottom: "{info}{pager}"
},
```

Allows for custom arranging of the DOM elements in the top and bottom containers. There are for 4 variables you can utilize:

* `{select}` - The per-page dropdown
* `{search}` - The search input
* `{info}` - The info label (Showing X of Y entries)
* `{pager}` - The pager

> A maximum of 2 variables per container (`top` or `bottom`) is recommended. If you need to use more than 2 then you'll have to sort the CSS out to make them fit.

> Note, also, that while the `{select}`, `{search}` and `{info}` variables are single-use only, the `{pager}` variable can be used multiple times to produce multiple pagers.

> Use of the `{select}` variable depends on the option `perPageSelect` being enabled and use of the `{search}` variable depends on the option `searchable` being enabled. Trying to use these variables while their corresponding options are disabled will result in nothing being inserted.

---

### Example 1

Let's say you wanted the following layout:

```
---------------------------------
|	info	|	pager	|
---------------------------------
|				|
|		table		|
|				|
---------------------------------
|  search	|  select 	|
---------------------------------
```

The markup for the top container would be:

```javascript
layout: {
    top: "{info}{pager}",
},
```

and the markup for the bottom container would be:


```javascript
layout: {
    bottom: "{search}{select}",
},
```

Combined:
 
```javascript
layout: {
    top: "{info}{pager}",
    bottom: "{search}{select}"
},
```
---

### `header`
#### Default: `true`
#### Type: `boolean`

Enable or disable the table header.

---

### `footer`
#### Default: `false`
#### Type: `boolean`

Enable or disable the table footer.

---