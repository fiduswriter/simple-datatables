### `labels`
#### Type: `object`

Customise the displayed labels. (v1.0.6 and above)

#### Defaults
```javascript
labels: {
    placeholder: "Search...",
    searchTitle: "Search within table",
    pageTitle: "Page {page}",
    perPage: "entries per page",
    noRows: "No entries found",
    info: "Showing {start} to {end} of {rows} entries",
    noResults: "No results match your search query",
}
```

The strings wrapped in curly braces represent variables that are inserted.

<table data-table="label">
  <thead>
      <tr>
          <th>Property</th>
          <th>Effect</th>
          <th>Variables</th>
      </tr>
  </thead>
  <tbody>
  	<tr>
          <td><code>placeholder</code></td>
          <td>Sets the placeholder of the search input</td>
          <td>None</td>
    </tr>
  	<tr>
          <td><code>searchTitle</code></td>
          <td>Sets the title of the search input</td>
          <td>None</td>
    </tr>
    <tr>
          <td><code>pageTitle</code></td>
          <td>Sets the title of the page (as used in the page navigator)</td>
          <td>
            <code>{page}</code> - The current page number<br />
          </td>
    </tr>
  	<tr>
          <td><code>perPage</code></td>
          <td>Sets the per-page dropdown's label</td>
          <td>None</td>
    </tr>
  	<tr>
          <td><code>noRows</code></td>
          <td>The message displayed when there are no search results</td>
          <td>None</td>
    </tr>
  	<tr>
          <td><code>info</code></td>
          <td>Displays current range, page number, etc</td>
          <td>
          	<code>{start}</code> - The first row number of the current page<br />
            <code>{end}</code> - The last row number of the current page<br />
            <code>{page}</code> - The current page number<br />
            <code>{pages}</code> - Total pages<br />
            <code>{rows}</code> - Total rows<br />
          </td>
    </tr>
  </tbody>
</table>

#### Example:

```javascript
labels: {
    placeholder: "Search employees...",
    searchTitle: "Search within employees",
    perPage: "employees per page",
    noRows: "No employees to display",
    info: "Showing {start} to {end} of {rows} employees (Page {page} of {pages} pages)",
},
```
