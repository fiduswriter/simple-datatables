#### type `Function`

Filter the table based on a single query.

#### Usage

```javascript
/**
 * @param  {str} term Search term
 * @param  {int[]} columns Columns to be searched (optional)
 * @param  {str} source Source of the search. (optional, used to invalidate search rows later on)
 * @return {void}
 */
datatable.search(term, columns);
```
