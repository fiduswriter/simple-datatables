### `rowspan`

Rowspan support allows table cells to span multiple rows, both in headings and data rows. This feature works whether you're initializing a DataTable from an existing HTML table or loading data from JSON/JavaScript.

## Using Rowspan with HTML Tables

When initializing from an existing HTML table, rowspan attributes are automatically detected and preserved:

```html
<table id="myTable">
    <thead>
        <tr>
            <th>Department</th>
            <th>Employee</th>
            <th>Position</th>
            <th>Email</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="2">Engineering</td>
            <td>John Doe</td>
            <td>Senior Developer</td>
            <td>john@example.com</td>
        </tr>
        <tr>
            <td>Jane Smith</td>
            <td>Developer</td>
            <td>jane@example.com</td>
        </tr>
        <tr>
            <td>Marketing</td>
            <td>Bob Johnson</td>
            <td>Marketing Manager</td>
            <td>bob@example.com</td>
        </tr>
    </tbody>
</table>

<script>
    const dataTable = new DataTable("#myTable");
</script>
```

## Using Rowspan with JSON/JavaScript Data

When loading data programmatically, you can specify rowspan by including an `attributes` object in your cell data with a `rowspan` property:

```javascript
const data = {
    headings: ["Department", "Employee", "Position", "Email"],
    data: [
        // Row 1: Department cell spans 2 rows
        {
            cells: [
                {
                    data: "Engineering",
                    attributes: {
                        rowspan: "2"  // This cell spans 2 rows
                    }
                },
                "John Doe",
                "Senior Developer",
                "john@example.com"
            ]
        },
        // Row 2: Department cell is automatically filled by rowspan from row 1
        [
            "Jane Smith",
            "Developer",
            "jane@example.com"
        ],
        // Row 3: Normal row without rowspan
        [
            "Marketing",
            "Bob Johnson",
            "Marketing Manager",
            "bob@example.com"
        ]
    ]
};

const dataTable = new DataTable("#myTable", {
    data: data
});
```

## Important Notes

1. **Row Structure with Rowspan**: When a cell in one row has rowspan, subsequent rows affected by that rowspan should have fewer cells in the input data. The library automatically creates placeholder cells internally.

2. **Cell Count**: For a cell with `rowspan="3"` in column 2:
   - The row containing the cell has the normal number of cells
   - The next 2 rows should have one fewer cell in the input data (the rowspan column is automatically filled)

3. **Cell Data Format**: To use rowspan with JSON data, you must use the object format for cells:
   ```javascript
   {
       data: "Cell content",
       attributes: {
           rowspan: "2"
       }
   }
   ```

4. **Mixed Row Formats**: You can mix simple arrays and objects with attributes in the same dataset:
   ```javascript
   data: [
       {
           cells: [
               {
                   data: "Spans multiple rows",
                   attributes: { rowspan: "3" }
               },
               "Normal cell"
           ]
       },
       ["Only one cell - first column filled by rowspan"],  // Simple array
       ["Only one cell - first column filled by rowspan"]
   ]
   ```

## Combining Rowspan and Colspan

You can use rowspan and colspan together on the same cell:

```javascript
const data = {
    headings: ["Week", "Project", "Task", "Status", "Hours"],
    data: [
        {
            cells: [
                {
                    data: "Week 1",
                    attributes: {
                        rowspan: "2"  // Spans 2 rows
                    }
                },
                "Project Alpha",
                "Planning",
                "Complete",
                "8"
            ]
        },
        [
            "Project Alpha",
            "Development",
            "In Progress",
            "16"
        ],
        [
            "Week 2",
            {
                data: "Project Beta - All Tasks",
                attributes: {
                    colspan: "2",  // Spans 2 columns
                    rowspan: "2"   // AND spans 2 rows
                }
            },
            "Active",
            "40"
        ],
        [
            "Week 2 continued",
            "Active",
            "40"
        ]
    ]
};

const dataTable = new DataTable("#complexTable", {
    data: data
});
```

## Advanced Example: Employee Directory

Here's a complete example showing various rowspan scenarios:

```javascript
const employeeData = {
    headings: ["Department", "Team", "Employee", "Role", "Email"],
    data: [
        // Engineering department with 2 teams
        {
            cells: [
                {
                    data: "Engineering",
                    attributes: { rowspan: "4" }  // Spans all 4 engineering rows
                },
                {
                    data: "Frontend",
                    attributes: { rowspan: "2" }  // First team, 2 employees
                },
                "Alice Johnson",
                "Lead Developer",
                "alice@company.com"
            ]
        },
        [
            "Bob Smith",
            "Developer",
            "bob@company.com"
        ],
        {
            cells: [
                {
                    data: "Backend",
                    attributes: { rowspan: "2" }  // Second team, 2 employees
                },
                "Carol Williams",
                "Senior Developer",
                "carol@company.com"
            ]
        },
        [
            "David Brown",
            "Developer",
            "david@company.com"
        ],
        // Marketing department
        {
            cells: [
                {
                    data: "Marketing",
                    attributes: { rowspan: "2" }
                },
                "Social Media",
                "Eve Davis",
                "Social Media Manager",
                "eve@company.com"
            ]
        },
        [
            "Content",
            "Frank Miller",
            "Content Writer",
            "frank@company.com"
        ]
    ]
};

const dataTable = new DataTable("#employeeTable", {
    data: employeeData,
    searchable: true,
    sortable: true,
    perPage: 10
});
```

## Searching and Sorting with Rowspan

Tables with rowspan cells work normally with search and sort functionality:

- **Searching**: The content of cells with rowspan is searchable. The cell content appears in all rows it spans.
- **Sorting**: When sorting by a column with rowspan, the cells maintain their rowspan relationships. The entire group of rows sharing a rowspan cell will move together.
- **Filtering**: Rowspan cells are properly handled during filtering operations.

## CSV Export with Rowspan

When exporting tables with rowspan to CSV format, the cell content is automatically duplicated in all affected rows:

```javascript
// Table with rowspan
const data = {
    headings: ["Dept", "Employee"],
    data: [
        {
            cells: [
                { data: "Engineering", attributes: { rowspan: "2" } },
                "John"
            ]
        },
        ["Jane"]
    ]
};

// CSV export will produce:
// Dept,Employee
// Engineering,John
// Engineering,Jane
```

## Additional Cell Attributes

The `attributes` property can contain any valid HTML attributes, not just rowspan:

```javascript
{
    cells: [
        {
            data: "Important Data",
            attributes: {
                rowspan: "2",
                class: "highlight",
                style: "background-color: yellow; font-weight: bold;"
            }
        }
    ]
}
```

All attributes will be preserved and rendered in the final table output.

## Browser Compatibility

Rowspan support works in all modern browsers and is fully compatible with all DataTable features including:
- Pagination
- Sorting
- Searching
- Column filtering
- Row rendering
- CSV/JSON export