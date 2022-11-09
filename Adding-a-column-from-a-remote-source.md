Adding a column from a remote source (AJAX) is simple with the `columns` API.

Let's say you've selected a column from your MySQL table and you want to include it in your `datatable` instance. You can encode the column data as a `JSON string` and fetch it:
```javascript
{
    heading: "Progress"
    data: [
        "37%",
        "97%",
        "63%",
        "30%",
        ...
    ]
}
```


```javascript
let addNewColumn = function() {
    let columnData = "remote/data/url"

    fetch(columnData)
    .then(response => response.json())
    .then(data => datatable.columns.add(data))
}
```