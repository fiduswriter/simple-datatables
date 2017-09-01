Adding a column from a remote source (AJAX) is simple with the `columns()` API.

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
var getData = function() {
	
    var columnData = "remote/data/url";

        var xhr = new XMLHttpRequest();	
	
        xhr.addEventListener("load", function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    table.columns().add(JSON.parse(xhr.responseText));
                }
            }
        });

        xhr.open('GET', columnData);
        xhr.send();
}
```