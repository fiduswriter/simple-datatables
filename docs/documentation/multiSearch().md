#### type `Function`

Filter the table based on multiple queries.

#### Usage

```javascript
/**
 * @param  { { terms: String[], columns=: Number[] }[] } queries Queries including search term and columns (optional)
 * @param  {str} source Source of the search. (optional, used to invalidate search rows later on)
 * @return {void}
 */
datatable.multiSearch(queries);
```
