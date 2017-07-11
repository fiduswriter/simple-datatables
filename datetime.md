Vanilla DataTables can utilise the [MomentJS](https://momentjs.com/) library for parsing datatime strings for easier column sorting.

Make sure `moment.js` is included in your project then select one of the two ways to sort columns based on datatime strings.

## Method 1

Define a `data-type` attribute on the headings and set the value to `date`. If the datatime string is in a format that can not be sorted easily by standard methods, you must set the `data-format` attribute and set it's value to the format that is expected.

```html
<table>
    <thead>
        <th data-type="date" data-format="DD/MM/YYYY"></th>
        <th data-type="date" data-format="MM/DD/YY"></th>
        ...
    </thead>
</table>
```

## Method 2

The `date` and `format` strings can also be defined in the options using the `columns` property:

```javascript
// Select the first column and apply the `date` type and `format` to it
var datatable = new DataTable("#myTable", {
   columns: [
      {
         select: 0,
         type: "date",
         format: "DD/MM/YYYY"
      }
   ]
});

// Apply formatting to the third and fourth columns as well
var datatable = new DataTable("#myTable", {
   columns: [
      {
         select: 0,
         type: "date",
         format: "DD/MM/YYYY"
      },
      {
         select: [2,3],
         type: "date",
         format: "MM/DD/YY"
      }
   ]
});
```

As well as custom format strings, there are some pre-defined formats that you can utilise:

* `ISO_8601`
* `RFC_2822`
* `MYSQL`

```javascript
// Format the third column as MySQL datetime strings
var datatable = new DataTable("#myTable", {
   columns: [
      {
         select: 2,
         type: "date",
         format: "MYSQL"
      }
   ]
});
```
