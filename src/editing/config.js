/**
* Default config
* @type {Object}
*/
export const defaultConfig = {
    classes: {
        row: "dataTable-editor-row",
        form: "dataTable-editor-form",
        item: "dataTable-editor-item",
        menu: "dataTable-editor-menu",
        save: "dataTable-editor-save",
        block: "dataTable-editor-block",
        close: "dataTable-editor-close",
        inner: "dataTable-editor-inner",
        input: "dataTable-editor-input",
        label: "dataTable-editor-label",
        modal: "dataTable-editor-modal",
        action: "dataTable-editor-action",
        header: "dataTable-editor-header",
        wrapper: "dataTable-editor-wrapper",
        editable: "dataTable-editor-editable",
        container: "dataTable-editor-container",
        separator: "dataTable-editor-separator"
    },

    labels: {
        editCell: "Edit Cell",
        editRow: "Edit Row",
        removeRow: "Remove Row",
        reallyRemove: "Are you sure?"
    },

    // include hidden columns in the editor
    hiddenColumns: false,

    // enable the context menu
    contextMenu: true,

    // event to start editing
    clickEvent: "dblclick",

    // indexes of columns not to be edited
    excludeColumns: [],

    // set the context menu items
    menuItems: [
        {
            text: editor => editor.options.labels.editCell,
            action: (editor, _event) => {
                const cell = editor.event.target.closest("td")
                return editor.editCell(cell)
            }
        },
        {
            text: editor => editor.options.labels.editRow,
            action: (editor, _event) => {
                const row = editor.event.target.closest("tr")
                return editor.editRow(row)
            }
        },
        {
            separator: true
        },
        {
            text: editor => editor.options.labels.removeRow,
            action: (editor, _event) => {
                if (confirm(editor.options.labels.reallyRemove)) {
                    const row = editor.event.target.closest("tr")
                    editor.removeRow(row)
                }
            }
        }
    ]
}
