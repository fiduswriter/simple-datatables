### Updating

## From 3.x to 4.0:

Note that `rows` and `columns` are just properties on the datatable instance in 4.x rather than methods as they were in 3.x. Exchange any instance of `datatable.rows()` with `datatable.rows` and `datatable.columns()` with `datatable.columns`.