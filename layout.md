### `layout`
#### Type: `object`

### Default
```javascript
layout: {
    top: "{select}{search}",
    bottom: "{info}{pager}"
},
```

Allows for custom arranging of the DOM elements in the top and bottom containers. There are for 4 variables you can utilize:

* `{select}` - The per-page dropdown
* `{search}` - The search input
* `{info}` - The info label (Showing X of Y entries)
* `{pager}` - The pager

> A maximum of 2 variables per container (`top` or `bottom`) is recommended. If you need to use more than 2 then you'll have to sort the CSS out to make them fit.

> Note, also, that while the `{select}`, `{search}` and `{info}` variables are single-use only, the `{pager}` variable can be used multiple times to produce multiple pagers.

> Use of the `{select}` variable depends on the option `perPageSelect` being enabled and use of the `{search}` variable depends on the option `searchable` being enabled. Trying to use these variables while their corresponding options are disabled will result in nothing being inserted.

---

### Example 1

Let's say you wanted the following layout:

```
---------------------------------
|	info	|	pager	|
---------------------------------
|				|
|		table		|
|				|
---------------------------------
|  search	|  select 	|
---------------------------------
```

The markup for the top container would be:

```javascript
layout: {
    top: "{info}{pager}",
},
```

and the markup for the bottom container would be:


```javascript
layout: {
    bottom: "{search}{select}",
},
```

Combined:

```javascript
layout: {
    top: "{info}{pager}",
    bottom: "{search}{select}"
},
```