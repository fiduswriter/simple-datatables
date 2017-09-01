New data of many formats can be added at any time with the `insert()` and `import()` methods as well as the `rows()` and `columns()` API.

---

You can quickly add a new row with an array of cell data:

```javascript
var newRow = ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...];

datatable.rows().add(newRow);
```

The `add()` method also accepts a nested array for adding multiple rows:
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