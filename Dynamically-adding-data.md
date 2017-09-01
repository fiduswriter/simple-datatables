New data of many formats can be added at any time with the `insert()` and `import()` methods as well as the `rows()` and `columns()` API.

---

You can quickly add a new row with an `array` of cell data:

```javascript
var newRow = ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...];

datatable.rows().add(newRow);
```

The `add()` method also accepts a nested `array` for adding multiple rows:
```javascript
var newRows = [
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ...
];

datatable.rows().add(newRows);
```
---

The `insert()` method can accept both an `object` or and array of `key-value objects` depending on your setup:

```javascript

var newData = {
    headings: ["Heading 1", "Heading 2", "Heading 3", "Heading 4", ...],
    data: [
        ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
        ["Cell 5", "Cell 6", "Cell 7", "Cell 8", ...],
        ["Cell 9", "Cell 10", "Cell 11", "Cell 12", ...],
        ...
    ]
};

// or 

var newData = [
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

// Insert the data
datatable.insert(newData);

```

---

`JSON` strings can easily be imported also:

```json
"[{
    'Heading 1': 'Value 1',
    'Heading 2': 'Value 2',
    'Heading 3': 'Value 3',
    ...
},
{
    'Heading 1': 'Value 4',
    'Heading 2': 'Value 5',
    'Heading 3': 'Value 6',
    ...
}]"
```

```javascript
datatable.import({
    type: "json",
    data: // the above JSON string
});
```