New data of many formats can be added at any time with the `insert()` and `import()` methods as well as the `rows()` and `columns()` API.

---

You can quickly add a new row with an array of cell data:

```javascript
var newRow = ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...];

datatable.rows().add(newRow);
```

If you have multiple rows to add, you can either iterate over them and add them with the `rows()` API, or bulk add them with the `insert()` method:

```javascript
var newRows = [
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ...
];

newRows.forEach(function() {
    datatable.rows().add(row);
});

// or

datatable.insert({
    data: newRows
});
```

---

Nested `JSON` strings can easily be imported:

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