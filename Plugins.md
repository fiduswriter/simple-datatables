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