simple-datatables can be initialised with custom options passed as the second parameter of the constructor.

```javascript
let options = {
    searchable: true,
    perPage: 10,
   ...
};
let dataTable = new DataTable(myTable, options);
```

---

* [perPage](perPage)
* [perPageSelect](perPageSelect)
* [nextPrev](nextPrev)
* [prevText](prevText)
* [nextText](nextText)
* [firstLast](firstLast)
* [firstText](firstText)
* [lastText](lastText)
* [searchable](searchable)
* [sortable](sortable)
* [truncatePager](truncatePager)
* [fixedColumns](fixedColumns)
* [fixedHeight](fixedHeight)
* [columns](columns)
* [data](data)
* [ajax](ajax)
* [labels](labels)
* [layout](layout)
* [header](header)
* [footer](footer)
* [rowNavigation](rowNavigation)
* [tabIndex](tabIndex)
* [rowRender](rowRender)
* **dataConvert** (boolean, default: true): Whether to attempt to convert incoming data instead of assuming it already is in the format used natively.
* **destroyable** (boolean, default: true): Whether to keep the original HTML in memory in order to be able to destroy the table again,
