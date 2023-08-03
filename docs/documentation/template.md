### `template`
#### Type: `function`

### Default

```javascript
(options, dom) => `<div class='${options.classes.top}'>
    ${
    options.paging && options.perPageSelect ?
        `<div class='${options.classes.dropdown}'>
            <label>
                <select class='${options.classes.selector}'></select> ${options.labels.perPage}
            </label>
        </div>` :
        ""
}
    ${
    options.searchable ?
        `<div class='${options.classes.search}'>
            <input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='search' title='${options.labels.searchTitle}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
        </div>` :
        ""
}
</div>
<div class='${options.classes.container}'${options.scrollY.length ? ` style='height: ${options.scrollY}; overflow-Y: auto;'` : ""}></div>
<div class='${options.classes.bottom}'>
    ${
    options.paging ?
        `<div class='${options.classes.info}'></div>` :
        ""
}
    <nav class='${options.classes.pagination}'></nav>
</div>`
```

Allows for custom arranging of the DOM elements in the top and bottom containers. Be aware that several of the class names are used to position specific parts of the table, such as the pager (`options.classes.pagination`), the table itself (`options.classes.container`) and the pagination selector (`options.classes.selector`). There can be several pagers.

There can be multiple search fields and you can influence how they operate by adding `data-column`, `data-query-separator` and `data-and` attributes to them. `data-column` is to be a JSON array of column indices that the search is to operate on. The `data-query-separator` will be used to split the search value for individual search items. The `data-and` attribute will change the search from an OR-search to an AND-search. Default values can be specified as `searchQuerySeparator` and `searchAnd` options.

For example: `<input class='${options.classes.input}' placeholder='AND search for columns 1 and 4' type='search' data-and="true" data-columns="[1,4]" >`
