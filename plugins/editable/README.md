# Editable

A plugin that makes your Vanilla-DataTables instance editable.


[Demo](https://codepen.io/Mobius1/pen/rGpMMY/).

---


### Browser

Grab the files from one of the CDNs and include them in your page:

```html
<link href="https://cdn.jsdelivr.net/npm/vanilla-datatables@latest/plugins/editable/datatable.editable.css" rel="stylesheet" type="text/css">
<script src="https://cdn.jsdelivr.net/npm/vanilla-datatables@latest/plugins/editable/datatable.editable.js" type="text/javascript"></script>
```

---

### Quick Start

Then just initialise the plugin by either passing a reference to the table or a CSS3 selector string as the first parameter:

```javascript
var datatable = new DataTable(myTable, {
	plugins: {
		editable: {
			enabled: true
		}
	}
});

```

---

Don't forget to check the [wiki](https://github.com/Mobius1/Vanilla-DataTables/wiki) out for further help.

---


Copyright © 2017 Karl Saunders | MIT license