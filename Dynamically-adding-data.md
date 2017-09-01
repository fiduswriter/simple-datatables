New data can be added at any time with the `insert()` and `import()` methods as well as the `rows()` and `columns()` API.

Let's say you have the following formatted `JSON` string to import:

```json
"[{
    'Heading 1': 'Value 1',
    'Heading 2': 'Value 2',
    'Heading 3': 'Value 3',
    ...
},
{
    'Heading 1': 'Value 4',
    'Heading 2': 'Value 5',
    'Heading 3': 'Value 6',
    ...
},
...
]"
```