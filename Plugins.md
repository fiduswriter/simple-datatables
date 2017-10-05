To create a plugin just use the `extend()` method which takes 2 arguments: the name of the plugin and the callback.

Your plugin should return an instance with the required `init()` method in order for Vanilla-DataTables to use it. A `destroy()` method is preferred as well so the end-user and kill the plugin as necessary.

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

    /**
     * Destroy instance
     */
    myPlugin.prototype.destroy = function() {
        //
    };

    return new myPlugin();
}
```

Then simply enable the plugin with the `plugins` option:

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

// and if you've supplied a destroy() method
datatable.myPlugin.destroy();
```