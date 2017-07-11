There are two ways to get Vanilla DataTables to sort columns based on datatime strings.

## Method 1

Define a `data-type` attribute on the headings and set the value to `date`. If the datatime string is in a format that can not be sort easily by standard methods, you must set the `data-format` attribute and set it's value to the format that is expected.