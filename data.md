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