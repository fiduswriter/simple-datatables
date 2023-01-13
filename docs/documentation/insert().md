#### type `Function`

Insert new data in to the table. 
#### Usage
```javascript
/**
 * @param {object} data New data to insert
 * @return {void}
 */
datatable.insert(data);
```

---

#### Examples

##### Pass an `array` of `key-value` pairs (objects):
```javascript
let newData = [
    {
        "Heading 1": "Cell 1",
        "Heading 2": "Cell 2",
        "Heading 3": "Cell 3",
        "Heading 4": "Cell 4",
    },
    {
        "Heading 1": "Cell 5",
        "Heading 2": "Cell 6",
        "Heading 3": "Cell 7",
        "Heading 4": "Cell 8",
    }
];

datatable.insert(newData);
```

##### Pass an `object` with the `headings` and/or `data` property:

```javascript
let newData = {
        headings: [
            "Name",
            "Position",
            "Town",
            "Ext.",
            "Start Date",
            "Salary"
        ],
	data: [
		[
            "Cedric Kelly",
            "Senior Javascript Developer",
            "Edinburgh",
            "6224",
            "2012/03/29",
            "$433,060"
        ],
        [
            "Airi Satou",
            "Accountant",
            "Tokyo",
            "5407",
            "2008/11/28",
            "$162,700"
        ],
        ...
      ]
};

// add the rows
dataTable.insert(newData);
```

If you attempt to pass new headings to a table that has headings, they'll be ignored.