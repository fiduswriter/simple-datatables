Vanilla DataTables can utilise the [MomentJS](https://momentjs.com/) library for parsing datatime strings for easier column sorting.

[Demonstration](https://s.codepen.io/Mobius1/debug/afe7874e0cacb8fada48cf8fda66306b)

> Note that the moment.js implementation is experimental and will be improved in upcoming releases.

Make sure `moment.js` is included in your project then select one of the two ways to sort columns based on datatime strings.

## Method 1

Define a `data-type` attribute on the headings and set the value to `date`. If the datatime string is in a format that can not be sorted easily by standard methods, you must define the `data-format` attribute and set it's value to the format that is expected.

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
// Allow sorting of the first column with "DD/MM/YYYY" format
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
// Allow sorting of the third column by MySQL datetime strings
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
