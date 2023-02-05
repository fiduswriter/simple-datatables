### `template`
#### Type: `function`

### Default

```javascript
(options) => `<div class='${options.classes.top}'>
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
            <input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='text' aria-label='${options.labels.searchAriaLabel || options.labels.placeholder}'>
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
