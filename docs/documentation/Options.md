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
### Data
* [data](data)
* [type](columns#type)
* [format](columns#format)
### Appearance
* [caption](caption)
* [classes](classes)
* [columns](columns)
* [fixedColumns](fixedColumns)
* [fixedHeight](fixedHeight)
* [footer](footer)
* [header](header)
* [hiddenHeader](hiddenHeader)
* [labels](labels)
* [template](template)
* [scrollY](scrollY)
### Rendering
* [pagerRender](pagerRender)
* [rowRender](rowRender)
* [tableRender](tableRender)
* [diffDomOptions](diffDomOptions)
### Pagination
* [paging](paging)
* [perPage](perPage)
* [perPageSelect](perPageSelect)
* [firstLast](firstLast)
* [nextPrev](nextPrev)
* [firstText](firstText)
* [lastText](lastText)
* [prevText](prevText)
* [nextText](nextText)
* [ellipsisText](ellipsisText)
* [truncatePager](truncatePager)
* [pagerDelta](pagerDelta)
### Searching
* [searchable](searchable)
* [sensitivity](columns#sensitivity)
* [searchQuerySeparator](searchQuerySeparator)
* [searchMethod](searchMethod)
### Sorting
* [sortable](sortable)
* [locale](columns#locale)
* [numeric](columns#numeric)
* [caseFirst](columns#caseFirst)
* [ignorePunctuation](columns#ignorePunctuation)
### Navigation
* [rowNavigation](rowNavigation)
* [tabIndex](tabIndex)
### Other
* [destroyable](destroyable)
