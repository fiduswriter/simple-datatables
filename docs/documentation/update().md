#### type `Function`

Updates the dom of the table. Needs to be called after you change the data of `datatable.data` manually or you changed things inside of `datatable.columns.settings`, etc. The argument `measureWidths` will determine whether the needed widths of the columns will be measured again. The columns need to measured again if any change that was made could have lead to differently sized columns.

#### Usage

```javascript
datatable.update(measureWidths=false);
```
