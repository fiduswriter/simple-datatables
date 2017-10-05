Example plugin:

```javascript
DataTable.extend("myPlugin", function(options) {

    /**
     * Main lib
     */
    var myPlugin = function() {
        //
    };

    /**
     * Init instance (required)
     */
    myPlugin.prototype.init = function() {
        //
    };

    return new myPlugin();
}
```

Then simply enable the plugin:

```javascript
var datatable = new DataTable("table", {
    plugins: {
        myPlugin: {
            // Required
            enabled: true, // or false

            // Custom options
            option1: value1,
            option2: value2,
            option3: value3,
            ...
        }
    }
});
```

Or you can enable the plugin yourself at any time: 

```javascript
var datatable = new DataTable("table", {
    plugins: {
        myPlugin: {
            // Prevent plugin from being initialised
            enabled: false
        }
    }
});

// Enable the plugin with it's init() method
datatable.myPlugin.init();
```