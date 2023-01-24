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
* [locale](columns#locale)
* [numeric](columns#numeric)
* [caseFirst](columns#caseFirst)
* [sensitivity](columns#sensitivity)
* [ignorePunctuation](columns#ignorePunctuation)
* [header](header)
* [footer](footer)
* [rowNavigation](rowNavigation)
* [tabIndex](tabIndex)
* [pagerRender](pagerRender)
* [rowRender](rowRender)
* [tableRender](tableRender)
* [template](template)
* [dataConvert](dataConvert)
* [destroyable](destroyable)
