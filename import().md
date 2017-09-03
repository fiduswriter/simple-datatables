#### type `Function`

Import data into the table from `json` or `csv` strings.

#### Usage

```javascript
/**
 * @param  {Object} options User options
 * @return {Boolean}
 */
datatable.import(options);
```

The `options` argument must be an object of which the only required properties are `data` and `type`. The `data` property should be the `csv` or `json` string and the `type` property should indicate the type of data being imported - `csv` or `json`.

```javascript
{
    type: "csv" // or "json"
    data: // the csv or json string

    // csv only
    headings: false, // specifies whether the first line contains the headings
    lineDelimiter:  "\n", // line delimiter for csv type
    columnDelimiter:  ",", // column delimiter for csv type
};
```

Note that if the table already has headings, the first line will be treated as tbody cell data regardless of whether the `headings` property is set to `true` or not.

#### Examples

```javascript
    // Import a csv string
    datatable.import({
        type: "csv",
        data: "Heading 1,Heading 2,Heading 3|Value 1,Value 2,Value 3|Value 4,Value 5,Value 6".
        headings: true,
        lineDelimiter:  "|",
        columnDelimiter:  ","
    });
```

Note that whilst checks are performed for valid `json` strings, none are present for `csv` checking so it's up to you to make sure the formatting is correct.
