### Install

```
npm install simple-datatables --save
```

---

### Initialise

The JS file should be included before any scripts that call the plugin.

Then just initialise the plugin by either passing a reference to the table or a CSS3 selector string as the first parameter:

```javascript
let myTable = document.querySelector("#myTable");
let dataTable = new DataTable(myTable);

// or

let dataTable = new DataTable("#myTable");

```

You can also pass the options object as the second paramater:

```javascript
let dataTable = new DataTable("#myTable", {
    searchable: false,
    fixedHeight: true,
    ...
});
```