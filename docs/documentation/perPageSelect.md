### `perPageSelect`
#### Type: `array`
#### Default: `[5, 10, 15, 20, 25]`

Sets the per page options in the dropdown. Must be an array of integers or arrays in the format [label (string), value (int)].

Values below 1 return all values.

For example, you could specify the values in words like this:

`[["Five", 5], ["Ten", 10], ["All", 0]]`

Setting this to `false` will hide the dropdown.