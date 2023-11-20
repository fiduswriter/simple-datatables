### `pagerRender`
#### Type: `boolean` \ `function(data, ul)`
#### Default: `false`


If specified, declares a callback to customise the rendering of all pagers. The function can take 2 parameters:

* **data**: an array of data relevant to render the pager: `[onFirstPage: boolean, onLastPage: boolean, currentPage: number, totalPages: number]`.

* **ul**: the ul in the format used by (diffDOM)[https://github.com/fiduswriter/diffDOM].

You can either modify the ul in place, or you can return a new ul object in the same format.
