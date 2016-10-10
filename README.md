# Vanilla-DataTables
A lightweight (just 3.3kb minified and gzipped), dependency-free javascript HTML table plugin.

Inspired by the awesome jQuery DataTables plugin: https://datatables.net/

[Demo with all features enabled](http://codepen.io/Mobius1/full/VadmKb/)

## Install

### Bower
```
bower install vanilla-datatables
```

### npm
```
npm install vanilla-datatables
```

## Quick Start

1. Add the css file in your document's head:

```html
<link rel="stylesheet" type="text/css" href="path/to/vanilla-dataTables.min.css">
```

2. Add the js file at the bottom of your document's body

```html
<script type="text/javascript" src="path/to/vanilla-dataTables.min.js"></script>
```

3. Initialise the plugin

```javascript
var myTable = document.getElementById('myTable');
var dataTable = new DataTable(myTable, options);
```

## Options

```javascript
var options = {
	/**
	 * Set the number of items (rows) per page
	 * @type {int}
	 */
	perPage: 10,

	/**
	 * Set the per page options in the dropdown.
	 * @type {array}
	 */
	perPageSelect: [5,10,15,20,25],

	/**
	 * Set the position of the pagination buttons (top, bottom, both)
	 * @type {string}
	 */
	navPosition: 'both',

	/**
	 * Enable / disable the next and previous pagination buttons
	 * @type {bool}
	 */
	nextPrev: true,

	/**
	 * Set the text / html for the next and previous pagination buttons
	 * @type {string}
	 */
	prevText: '&lsaquo;',
	nextText: '&rsaquo;',
	
	/**
	 * Enable / disable the sortable feature
	 * @type {bool}
	 */
	sortable: false,
	
	/**
	 * Enable / disable the option to search the data set.
	 * @type {bool}
	 */
	searchable: false,

	/**
	 * Enable / disable the fixed height feature. Enabling this will keep the bottom container fixed in place
	 * @type {bool}
	 */
	fixedHeight: true,

	/**
	 * Enable / disable the info text (Showing x to y of z items)
	 * @type {bool}
	 */
	info: true,

	/**
	 * Choose hide the next and previous pagination buttons when not needed. Leaving this disabled will just disable the buttons.
	 * @type {bool}
	 */
	hideUnusedNavs: false,
	
	/**
	 * Enable plugins.
	 * @type {array}
	 */
	plugins: ['plugin_name_1', 'plugin_name_2', ...],	
};
```

## Plugins
The plugin files must be added after the main file like so:

``` javascript
<script type="text/javascript" src="path/to/vanilla-dataTables.min.js"></script>
<script type="text/javascript" src="path/to/my/DataTable-Plugin-1.js"></script>
<script type="text/javascript" src="path/to/my/DataTable-Plugin-2.js"></script>
```

The plugin can then be enabled within the options:

```javascript
var dataTable = new DataTable(myTable, {
    plugins: ['DataTable-Plugin-1', 'DataTable-Plugin-2']
});
```

Creating your own plugin is easy. Just extend the DataTable object and make sure to include the mandatory `init()` method otherwise your plugin won't be called. This method accepts the DataTable plugin instance as the first parameter.

```javascript
/**
 * [MY_PLUGIN_NAME description]
 * @type {Object}
 */
DataTable.prototype.MY_PLUGIN_NAME = {
	/**
	 * initialise the plugin
	 * @param  {object} datatable | DataTable plugin instance
	 */
	init: function(datatable) {
		//
	}
}
```

## Events

* ```datatable.init``` fires when the table is ready
* ```datatable.change``` fires on page change
* ```datatable.sort``` fires when when the table is sorted
* ```datatable.perpage``` fires when the perPage option is changed with the dropdown
* ```datatable.search``` fires on keyup during a search

```javascript
myTable.on('datatable.XXXX', function(dataTable /* plugin instance */) {
	// Do something when datatable.XXXX fires
});
```
Copyright © 2016 Karl Saunders | BSD & MIT license
