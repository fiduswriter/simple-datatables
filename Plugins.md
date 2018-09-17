Plugins are a way of extending the functionality of the library whilst keep it's size to a minimum.

## Usage

To create a plugin just use the `extend()` method which takes 2 arguments: the name of the plugin and the callback.

Your plugin should return an instance with the required `init()` method in order for Vanilla-DataTables to use it.

A `destroy()` method is preferred as well so the end-user can kill the plugin as necessary. Make sure the method removes any event listeners or nodes that can affect the current Vanilla-DataTables instance.

Example plugin:

```javascript
DataTable.extend("myPlugin", function(options) {

    /**
     * Main lib
     */
    let myPlugin = function() {
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
let datatable = new DataTable("table", {
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
let datatable = new DataTable("table", {
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

---

## Events

You can access Vanilla-DataTable's event emitter to fire your own custom events for the end-user to listen for:

```javascript
DataTable.extend("myPlugin", function(options) {

    let instance = this;

    let myPlugin = function() {};

    myPlugin.prototype.init = function() {
        // Fire the custom "myPlugin.init" event
        instance.emit("myPlugin.init");
    };

    return new myPlugin();
}
```

then...

```javascript
let datatable = new DataTable("table", {
    plugins: {
        myPlugin: { enabled: true }
    }
});

// Listen for the custom "myPlugin.init" event
datatable.on("myPlugin.init", function(e) {
    // do something when "myPlugin.init" fires
})
```

---


## Issues

If you have an issue with an approved plugin then open an issue as usual but add the name of the plugin to the title, e.g. `[pluginName] It's not working properly`.