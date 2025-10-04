### `colspan`

Colspan support allows table cells to span multiple columns, both in headings and data rows. This feature works whether you're initializing a DataTable from an existing HTML table or loading data from JSON/JavaScript.

## Using Colspan with HTML Tables

When initializing from an existing HTML table, colspan attributes are automatically detected and preserved:

```html
<table id="myTable">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td colspan="2">John Doe - john@example.com</td>
            <td>555-1234</td>
        </tr>
        <tr>
            <td>2</td>
            <td>Jane Smith</td>
            <td>jane@example.com</td>
            <td>555-5678</td>
        </tr>
    </tbody>
</table>

<script>
    const dataTable = new DataTable("#myTable");
</script>
```

## Using Colspan with JSON/JavaScript Data

When loading data programmatically, you can specify colspan by including an `attributes` object in your cell data with a `colspan` property:

```javascript
const data = {
    headings: ["ID", "First Name", "Last Name", "Email", "Phone"],
    data: [
        {
            cells: [
                "1",
                {
                    data: "John Doe",
                    attributes: {
                        colspan: "2"  // This cell spans 2 columns
                    }
                },
                "john@example.com",
                "555-1234"
            ]
        },
        {
            cells: [
                "2",
                "Jane",
                "Smith",
                {
                    data: "jane@example.com / 555-5678",
                    attributes: {
                        colspan: "2"  // This cell also spans 2 columns
                    }
                }
            ]
        }
    ]
};

const dataTable = new DataTable("#myTable", {
    data: data
});
```

## Colspan in Headings

You can also use colspan in table headings to create grouped column headers:

```javascript
const data = {
    headings: [
        "Product",
        {
            data: "Q1 Sales",
            attributes: {
                colspan: "3"  // Groups 3 months
            }
        },
        {
            data: "Q2 Sales",
            attributes: {
                colspan: "3"  // Groups 3 months
            }
        }
    ],
    data: [
        [
            "Widget A",
            "Jan: $1000",
            "Feb: $1200",
            "Mar: $1500",
            "Apr: $1300",
            "May: $1400",
            "Jun: $1600"
        ]
    ]
};

const dataTable = new DataTable("#myTable", {
    data: data
});
```

## Important Notes

1. **Column Count Consistency**: When using colspan, ensure that the total number of columns (accounting for the colspan values) matches the number of headings. For example:
   - If you have 5 headings
   - And a cell with `colspan="2"`, you need 4 cells total in that row (one cell spans 2 columns + 3 regular cells = 5 columns)

2. **Cell Data Format**: To use colspan with JSON data, you must use the object format for cells:
   ```javascript
   {
       data: "Cell content",
       attributes: {
           colspan: "2"
       }
   }
   ```

3. **Mixed Row Formats**: You can mix simple arrays and objects with attributes in the same dataset:
   ```javascript
   data: [
       ["1", "Normal", "Row", "Data"],  // Simple array
       {
           cells: [
               "2",
               {
                   data: "Cell with colspan",
                   attributes: { colspan: "2" }
               },
               "More data"
           ]
       }
   ]
   ```

4. **Column Settings**: When a cell has colspan, the column settings (sortable, searchable, hidden, etc.) are applied to the first column of the span. The additional columns covered by the colspan will have placeholder cells internally.

5. **Searching and Sorting**: Tables with colspan cells work normally with search and sort functionality. The content of cells with colspan is searchable and can be used for sorting.

## Advanced Example

Here's a complete example showing various colspan scenarios:

```javascript
const scheduleData = {
    headings: ["Week", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    data: [
        {
            cells: [
                "Week 1",
                "Meeting",
                {
                    data: "Conference",
                    attributes: { colspan: "2" }
                },
                "Development",
                "Code Review"
            ]
        },
        {
            cells: [
                "Week 2",
                {
                    data: "Team Building Event (All Week)",
                    attributes: { colspan: "5" }
                }
            ]
        },
        [
            "Week 3",
            "Sprint Planning",
            "Development",
            "Development",
            "Testing",
            "Deployment"
        ]
    ]
};

const dataTable = new DataTable("#scheduleTable", {
    data: scheduleData,
    searchable: true,
    sortable: true,
    perPage: 10
});
```

## Additional Cell Attributes

The `attributes` property can contain any valid HTML attributes, not just colspan:

```javascript
{
    cells: [
        {
            data: "Important Data",
            attributes: {
                colspan: "2",
                class: "highlight",
                style: "background-color: yellow;"
            }
        }
    ]
}
```

All attributes will be preserved and rendered in the final table output.