/**
* Default config
* @type {Object}
*/
export const defaultConfig = {
    classes: {
        row: "datatable-editor-row",
        form: "datatable-editor-form",
        item: "datatable-editor-item",
        menu: "datatable-editor-menu",
        save: "datatable-editor-save",
        block: "datatable-editor-block",
        close: "datatable-editor-close",
        inner: "datatable-editor-inner",
        input: "datatable-editor-input",
        label: "datatable-editor-label",
        modal: "datatable-editor-modal",
        action: "datatable-editor-action",
        header: "datatable-editor-header",
        wrapper: "datatable-editor-wrapper",
        editable: "datatable-editor-editable",
        container: "datatable-editor-container",
        separator: "datatable-editor-separator"
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
            text: (editor: any) => editor.options.labels.editCell,
            action: (editor: any, _event: any) => {
                const cell = editor.event.target.closest("td")
                return editor.editCell(cell)
            }
        },
        {
            text: (editor: any) => editor.options.labels.editRow,
            action: (editor: any, _event: any) => {
                const row = editor.event.target.closest("tr")
                return editor.editRow(row)
            }
        },
        {
            separator: true
        },
        {
            text: (editor: any) => editor.options.labels.removeRow,
            action: (editor: any, _event: any) => {
                if (confirm(editor.options.labels.reallyRemove)) {
                    const row = editor.event.target.closest("tr")
                    editor.removeRow(row)
                }
            }
        }
    ]
}
