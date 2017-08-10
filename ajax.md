### `ajax`
#### Type: `{String|Object}`
#### Default: `undefined`

Load remote data set via AJAX requst.

The easiest method is to just pass the url to the remote data and the instance will process and insert the data.

```javascript
var dataTable = new DataTable(myTable, {
    ajax: "some/url/data.json"
});
```

You can also pass an `Object` with the `url` and `load` properties:

```javascript
var dataTable = new DataTable(myTable, {
    ajax: {
        url: "some/url/data.json",
        load: function(xhr) {
            // process and/or the response data
        }
    }
});
```

The load property should return the formatted response data that the instance can recognise (`Object` or `JSON`). It takes a single argument which is an instance of the `XMLHttpRequest` object.

### Example
```javascript

var highlightNumbers = function(xhr) {
    var data = JSON.parse(xhr.responseText);

    for ( var i = 0; i < data.length; i++ ) {
        for (var p in data[i]) {
            if ( !isNaN(data[i][p]) ) {
                data[i][p] = "<u style='color:red;'>" + data[i][p] + "</u>"
            }
        } 
    }		
			
    return JSON.stringify(data);
}

var dataTable = new DataTable(myTable, {
    ajax: {
        url: "some/url/data.json",
        load: highlightNumbers
    }
});
```