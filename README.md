# Vanilla-DataTables
A lightweight (7.8kb minified), dependency-free javascript HTML table plugin

Inspired by the jQuery DataTables plugin: https://datatables.net/

[Demo with all features enabled](http://codepen.io/Mobius1/full/VadmKb/)

##Bower

bower install vanilla-datatables


##Quick Start

1 - Add the css file in your document's head:

```html
<link rel="stylesheet" type="text/css" href="path/to/vanilla-dataTables.min.css">
```

2 - Add the js file at the bottom of your document's body

```html
<script type="text/javascript" src="path/to/vanilla-dataTables.min.js">
```

3 - Initialise the plugin

```javascript
var myTable = document.getElementById('myTable');
var dataTable = new dataTable(myTable);
```
