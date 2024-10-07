New data of many formats can be added at any time with the `insert()` method as well as the `rows` and `columns` API.

---

You can quickly add a new row with an `array` of cell data:

```javascript
let newRow = ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...];

datatable.rows.add(newRow);
```

The `add()` method also accepts a nested `array` for adding multiple rows:
```javascript
let newRows = [
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
    ...
];

datatable.insert({ data: newRows });
```
---

The `insert()` method can accept both an `object` or and array of `key-value objects` depending on your setup:

```javascript

let newData = {
    headings: ["Heading 1", "Heading 2", "Heading 3", "Heading 4", ...],
    data: [
        ["Cell 1", "Cell 2", "Cell 3", "Cell 4", ...],
        ["Cell 5", "Cell 6", "Cell 7", "Cell 8", ...],
        ["Cell 9", "Cell 10", "Cell 11", "Cell 12", ...],
        ...
    ]
};

// or

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

// Insert the data
datatable.insert(newData);

```

Note that while the `key-value` method doesn't require you to order the data correctly to match the table layout, the instance will still check that the given `key` (heading) is present and will skip the insertion if it isn't, so make sure the `keys` match the column labels.

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
import {
  DataTable,
  convertJSON
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
const convertedData = convertJSON({
  data: // the above JSON string
})
dataTable.insert(convertedData)
```

or `csv` strings:

```text
Name,Ext.,City,Start Date
Hammett Gordon,8101,Wah,1998/06/09
Kyra Moses,3796,Quenast,1998/07/07
Kelly Cameron,4836,Fontaine-Valmont,1999/02/07
Theodore Duran,8971,Dhanbad,1999/04/07
...
```

```javascript
import {
  DataTable,
  convertCSV
} from "simple-datatables"
const dataTable = new DataTable("#myTable")
const convertedData = convertJSON({
  data: // the above CSV string,
  headings: true,
  columnDelimiter: ",",
  lineDelimiter: "\n"
})
dataTable.insert(convertedData)
```
