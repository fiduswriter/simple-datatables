### `classes`
#### Type: `object`

### Default
```javascript
{
        active: "datatable-active",
        bottom: "datatable-bottom",
        container: "datatable-container",
        cursor: "datatable-cursor",
        dropdown: "datatable-dropdown",
        ellipsis: "datatable-ellipsis",
        empty: "datatable-empty",
        headercontainer: "datatable-headercontainer",
        info: "datatable-info",
        input: "datatable-input",
        loading: "datatable-loading",
        pagination: "datatable-pagination",
        paginationList: "datatable-pagination-list",
        search: "datatable-search",
        selector: "datatable-selector",
        sorter: "datatable-sorter",
        table: "datatable-table",
        top: "datatable-top",
        wrapper: "datatable-wrapper"
},
```

Allows for customizing the classnames used by simple-datatables.

Please note that class names cannot be empty and cannot be reused between different attributes. This is required for simple-datatables to work correctly.

Multiple classes can be provided per attribute. Please make sure that classes are be separated by spaces.
For example, `dt.options.classes.table = "first second"` will apply classes `first` and `second` to the generated table.