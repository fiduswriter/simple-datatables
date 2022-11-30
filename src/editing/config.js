/**
* Default config
* @type {Object}
*/
export const defaultConfig = {
    classes: {
        row: "dt-editor-row",
        form: "dt-editor-form",
        item: "dt-editor-item",
        menu: "dt-editor-menu",
        save: "dt-editor-save",
        block: "dt-editor-block",
        close: "dt-editor-close",
        inner: "dt-editor-inner",
        input: "dt-editor-input",
        label: "dt-editor-label",
        modal: "dt-editor-modal",
        action: "dt-editor-action",
        header: "dt-editor-header",
        wrapper: "dt-editor-wrapper",
        editable: "dt-editor-editable",
        container: "dt-editor-container",
        separator: "dt-editor-separator"
    },

    labels: {
        editCell: "Edit Cell",
        editRow: "Edit Row",
        removeRow: "Remove Row",
        reallyRemove: "Are you sure?"
    },

    // include hidden columns in the editor
    hiddenColumns: false,

    // enable thw context menu
    contextMenu: true,

    // event to start editing
    clickEvent: "dblclick",

    // indexes of columns not to be edited
    excludeColumns: [],

    // set the context menu items
    menuItems: [
        {
            text: editor => editor.options.labels.editCell,
            action: (editor, _event) => editor.editCell()
        },
        {
            text: editor => editor.options.labels.editRow,
            action: (editor, _event) => editor.editRow()
        },
        {
            separator: true
        },
        {
            text: editor => editor.options.labels.removeRow,
            action: (editor, _event) => {
                if (confirm(editor.options.labels.reallyRemove)) {
                    editor.removeRow()
                }
            }
        }
    ]
}
