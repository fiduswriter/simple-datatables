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
            option1: value1,
            option2: value2,
            option3: value3,
            ...
        }
    }
});
```