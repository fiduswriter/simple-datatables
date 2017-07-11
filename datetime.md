Vanilla DataTables can utilise the MomentJS library for parsing datatime strings for easier column sorting.

There are two ways to sort columns based on datatime strings.

## Method 1

Define a `data-type` attribute on the headings and set the value to `date`. If the datatime string is in a format that can not be sort easily by standard methods, you must set the `data-format` attribute and set it's value to the format that is expected.

```html
<table>
    <th data-type="data" data=format="DD/MM/YYYY"></th>
    <th data-type="data" data=format="MM/DD/YY"></th>
    ...
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

// Select the first,  third and fourth columns and apply the `date` type and `format` to them
var datatable = new DataTable("#myTable", {
   columns: [
      {
         select: [0,2,3],
         type: "date",
         format: "MM/DD/YY"
      }
   ]
});
```