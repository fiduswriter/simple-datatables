/**
* Default config
* @type {Object}
*/
import {Editor} from "./editor"

export const defaultConfig = {
    classes: {
        row: "datatable-editor-row",
        form: "datatable-editor-form",
        item: "datatable-editor-item",
        menu: "datatable-editor-menu",
        save: "datatable-editor-save",
        block: "datatable-editor-block",
        cancel: "datatable-editor-cancel",
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
        closeX: "x",
        editCell: "Edit Cell",
        editRow: "Edit Row",
        removeRow: "Remove Row",
        reallyRemove: "Are you sure?",
        reallyCancel: "Do you really want to cancel?",
        save: "Save",
        cancel: "Cancel"
    },

    cancelModal: editor => confirm(editor.options.labels.reallyCancel),

    // edit inline instead of using a modal lay-over for editing content
    inline: true,

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
            text: (editor: Editor) => editor.options.labels.editCell,
            action: (editor: Editor, _event: Event) => {
                if (!(editor.event.target instanceof Element)) {
                    return
                }
                const cell = editor.event.target.closest("td")
                return editor.editCell(cell)
            }
        },
        {
            text: (editor: Editor) => editor.options.labels.editRow,
            action: (editor: Editor, _event: Event) => {
                if (!(editor.event.target instanceof Element)) {
                    return
                }
                const row = editor.event.target.closest("tr")
                return editor.editRow(row)
            }
        },
        {
            separator: true
        },
        {
            text: (editor: Editor) => editor.options.labels.removeRow,
            action: (editor: Editor, _event: Event) => {
                if (!(editor.event.target instanceof Element)) {
                    return
                }
                if (confirm(editor.options.labels.reallyRemove)) {
                    const row = editor.event.target.closest("tr")
                    editor.removeRow(row)
                }
            }
        }
    ]
}
