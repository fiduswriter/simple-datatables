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

`JSON` string returned by `xhr.responseText`:
```javascript
[
    {
        "Name": "Unity Pugh",
        "Ext.": "9958",
        "City": "Curicó",
        "Start Date": "2005/02/11",
        "Completion": "37%"
    },
    {
        "Name": "Theodore Duran",
        "Ext.": "8971",
        "City": "Dhanbad",
        "Start Date": "1999/04/07",
        "Completion": "97%"
    },
    ...
]
```

```javascript
var highlightNumbers = function(xhr) {
    // Parse the JSON string
    var data = JSON.parse(xhr.responseText);

    // Loop over the data and style any columns with numbers
    for ( var i = 0; i < data.length; i++ ) {
        for (var p in data[i]) {
            if ( !isNaN(data[i][p]) ) {
                data[i][p] = "<u style='color:red;'>" + data[i][p] + "</u>"
            }
        } 
    }		
		
    // Return the formatted data	
    return JSON.stringify(data);
}

var dataTable = new DataTable(myTable, {
    ajax: {
        url: "some/url/data.json",
        load: highlightNumbers
    }
});
```