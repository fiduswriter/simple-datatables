### `data`
#### Type: `object`
#### Default: `undefined`

Pass an object of data to populate the table.

You can set both the headings and rows with `headings` and `data` properties, respectively. The headings property is optional.

```javascript
let myData = {
	"headings": [
		"Name",
		"Company",
		"Ext.",
		"Start Date",
		"Email",
		"Phone No."
	],
	"data": [
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

let dataTable = new DataTable(myTable, {
	data: myData
});
```

> NOTE: If the headings count and rows count do not match, the library will throw an exception.

### Using key-value pairs

If your data is in the form of key-value pairs, you can quickly convert it to a format that the API can use:

```javascript

let data = [
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

let obj = {
    // Quickly get the headings
    headings: Object.keys(data[0]),

    // data array
    data: []
};

// Loop over the objects to get the values
for ( let i = 0; i < data.length; i++ ) {

    obj.data[i] = [];

    for (let p in data[i]) {
        if( data[i].hasOwnProperty(p) ) {
            obj.data[i].push(data[i][p]);
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
   data : [
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

### Cells containing form elements

The table is always rendered from the data model, not from the current state of the DOM. This means that values which the user has typed into form elements (`<input>`, `<textarea>`, `<select>`) inside table cells are **not stored automatically**: whenever the table is re-rendered - for example through searching, sorting or changing the page - the cells are rebuilt from `dataTable.data`, which still holds the original cell content, so any unsaved user input is lost.

To keep the values, write them back into the data model when they change, and then the cell can be rebuilt with the stored value:

```javascript
let dataTable = new DataTable("#table");

dataTable.wrapperDOM.addEventListener("input", e => {
    if (!(e.target instanceof HTMLInputElement)) {
        return;
    }
    // Find the row and column indices of the changed input
    const tr = e.target.closest("tr");
    const td = e.target.closest("td");
    const rowIndex = parseInt(tr.dataset.index, 10);
    const cellIndex = Array.from(tr.cells).indexOf(td);

    // Update the cell in the data model
    const cell = dataTable.data.data[rowIndex].cells[cellIndex];
    cell.data.childNodes.forEach(node => {
        if (node.nodeName === "INPUT") {
            node.attributes.value = e.target.value;
        }
    });
});
```

The same principle applies to checkboxes and select fields; see the [checkbox column demo](../demos/17-checkbox-column/) for a worked example that stores the checked state in the data model. For complete form-style editing of cells, use the [`makeEditable`](../demos/15-editing/) helper.
