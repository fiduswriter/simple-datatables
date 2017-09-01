Adding a column from a remote source (AJAX) is simple with the `columns()` API.

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
var addNewColumn = function() {
	
    var columnData = "remote/data/url";

        var xhr = new XMLHttpRequest();	
	
        xhr.addEventListener("load", function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // Parse the JSON string
                    var data = JSON.parse(xhr.responseText);

                    // Insert the new column
                    datatable.columns().add(data);
                }
            }
        });

        xhr.open('GET', columnData);
        xhr.send();
};
```