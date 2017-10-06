/*! Editable 0.0.7
 * © 2016-2017 Karl Saunders
 */
/**
 * @summary     Editable
 * @description Allow editing of cells and rows
 * @version     0.0.7
 * @file        datatable.editable.js
 * @author      Karl Saunders
 * @contact     mobius1@gmx.com
 * @copyright   Copyright 2016-2017 Karl Saunders
 *
 * Double-click a cell to edit and hit enter to submit.
 * Right click to show context menu of editor options (Edit Cell, Edit Row, Remove Row).
 *
 * This source file is free software, available under the following license:
 *   MIT license - https://github.com/Mobius1/Vanilla-DataTables/blob/master/LICENSE
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: https://github.com/Mobius1/Vanilla-DataTables
 */
if (window.DataTable && typeof window.DataTable === "function") {
    DataTable.extend("editable", function(options, utils) {
        // VDT Reference
        var instance = this;
        /**
         * Default config
         * @type {Object}
         */
        var defaults = {
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
                container: "datatable-editor-container",
                separator: "datatable-editor-separator"
            },

            // enable th context menu
            contextMenu: true,

            // set the context menu items
            menuItems: [{
                    text: "<span class='mdi mdi-lead-pencil'></span> Edit Cell",
                    action: function(e) {
                        this.editCell();
                    }
                },
                {
                    text: "<span class='mdi mdi-lead-pencil'></span> Edit Row",
                    action: function(e) {
                        this.editRow();
                    }
                },
                {
                    separator: true
                },
                {
                    text: "<span class='mdi mdi-delete'></span> Remove Row",
                    action: function(e) {
                        if (confirm("Are you sure?")) {
                            this.removeRow();
                        }
                    }
                }
            ]
        };

        /**
         * Add event listener to target
         * @param  {Object} el
         * @param  {String} e
         * @param  {Function} fn
         */
        var on = function(el, e, fn) {
            el.addEventListener(e, fn, false);
        };

        /**
         * Remove event listener from target
         * @param  {Object} el
         * @param  {String} e
         * @param  {Function} fn
         */
        var off = function(el, e, fn) {
            el.removeEventListener(e, fn);
        };

        /**
         * Get the closest matching ancestor
         * @param  {Object}   el         The starting node.
         * @param  {Function} fn         Callback to find matching ancestor.
         * @return {Object|Boolean}      Returns the matching ancestor or false in not found.
         */
        var closest = function(el, fn) {
            return el && el !== document.body && (fn(el) ? el : closest(el.parentNode, fn));
        };

        /**
         * Returns a function, that, as long as it continues to be invoked, will not be triggered.
         * @param  {Function} fn
         * @param  {Number} wait
         * @param  {Boolean} now
         * @return {Function}
         */
        var debounce = function(n, t, u) {
            var e;
            return function() {
                var i = this,
                    o = arguments,
                    a = u && !e;
                clearTimeout(e),
                    (e = setTimeout(function() {
                        (e = null), u || n.apply(i, o);
                    }, t)),
                    a && n.apply(i, o);
            };
        };

        /**
         * Main lib
         * @param {Object} target Target table
         * @param {Object} config User config
         */
        var Editor = function(target, config) {
            this.target = target;
            this.config = utils.extend(defaults, config);
        }

        /**
         * Init instance
         * @return {Void}
         */
        Editor.prototype.init = function() {
            var that = this,
                o = that.config;

            utils.classList.add(instance.wrapper, "datatable-editable");

            if (o.contextMenu) {

                that.container = utils.createElement("div", {
                    id: o.classes.container
                });

                that.wrapper = utils.createElement("div", {
                    class: o.classes.wrapper
                });

                that.menu = utils.createElement("ul", {
                    class: o.classes.menu
                });

                if (o.menuItems && o.menuItems.length) {
                    o.menuItems.forEach(function(item) {
                        var li = utils.createElement("li", {
                            class: item.separator ? o.classes.separator : o.classes.item
                        });

                        if (!item.separator) {
                            var a = utils.createElement("a", {
                                class: o.classes.action,
                                href: item.url || "#",
                                html: item.text
                            });

                            li.appendChild(a);

                            if (item.action && typeof item.action === "function") {
                                on(a, "click", function(e) {
                                    e.preventDefault();
                                    item.action.call(that, e);
                                });
                            }
                        }

                        that.menu.appendChild(li);
                    });
                }

                that.wrapper.appendChild(that.menu);
                that.container.appendChild(that.wrapper);

                that.update();
            }

            that.data = {};
            that.closed = true;
            that.editing = false;
            that.editingRow = false;
            that.editingCell = false;

            that.bindEvents();

            setTimeout(function() {
                instance.emit("datatable.editable.init");
            }, 10);
        };

        /**
         * Bind events to DOM
         * @return {Void}
         */
        Editor.prototype.bindEvents = function() {
            var that = this;

            this.events = {
                context: this.context.bind(this),
                update: this.update.bind(this),
                dismiss: this.dismiss.bind(this),
                keydown: this.keydown.bind(this),
                double: this.double.bind(this)
            };

            // listen for double-click
            on(this.target, "dblclick", this.events.double);

            // listen for click anywhere but the menu
            on(document, "click", this.events.dismiss);

            // listen for right-click
            on(document, "keydown", this.events.keydown);

            if (this.config.contextMenu) {
                // listen for right-click
                on(this.target, "contextmenu", this.events.context);

                // reset
                this.events.reset = debounce(this.events.update, 50);
                on(window, "resize", this.events.reset);
                on(window, "scroll", this.events.reset);
            }
        };

        /**
         * contextmenu listener
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.context = function(e) {
            this.event = e;

            var valid = this.target.contains(e.target);

            if (!this.disabled && valid) {
                e.preventDefault();

                // get the mouse position
                var x = e.pageX;
                var y = e.pageY;

                // check if we're near the right edge of window
                if (x > this.limits.x) {
                    x -= this.rect.width;
                }

                // check if we're near the bottom edge of window
                if (y > this.limits.y) {
                    y -= this.rect.height;
                }

                this.wrapper.style.top = y + "px";
                this.wrapper.style.left = x + "px";

                this.openMenu();
                this.update();
            }
        };

        /**
         * dblclick listener
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.double = function(e) {
            if (!this.editing) {
                var cell = closest(e.target, function(el) {
                    return el.nodeName === "TD";
                });
                if (cell) {
                    this.editCell(cell);
                    e.preventDefault();
                }
            }
        };

        /**
         * keydown listener
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.keydown = function(e) {
            if (this.editing && this.data) {
                if (e.keyCode === 13) {
                    // Enter key saves
                    this.saveCell();
                } else if (e.keyCode === 27) {
                    // Escape key reverts
                    this.saveCell(this.data.cell, this.data.content);
                }
            }
        };

        /**
         * Edit cell
         * @param  {Object} cell    The HTMLTableCellElement
         * @return {Void}
         */
        Editor.prototype.editCell = function(cell) {
            cell = cell || closest(this.event.target, function(el) {
                return el.nodeName === "TD";
            });

            if (cell.nodeName !== "TD" || this.editing) return;

            var that = this;

            that.data = {
                cell: cell,
                content: cell.innerHTML,
                input: utils.createElement("input", {
                    type: "text",
                    class: that.config.classes.input,
                    value: cell.innerHTML
                })
            };

            cell.innerHTML = "";
            cell.appendChild(that.data.input);

            setTimeout(function() {
                that.data.input.focus();
                that.data.input.selectionStart = that.data.input.selectionEnd = that.data.input.value.length;
                that.editing = true;
                that.editingCell = true;

                that.closeMenu();
            }, 10);
        };

        /**
         * Edit row
         * @param  {Object} cell    The HTMLTableRowElement
         * @return {Void}
         */
        Editor.prototype.editRow = function(row) {
            row = row || closest(this.event.target, function(el) {
                return el.nodeName === "TR";
            });

            if (row.nodeName !== "TR" || this.editing) return;

            var that = this,
                o = that.config;

            row = o.hiddenColumns ? instance.data[row.dataIndex] : instance.activeRows[row.dataIndex];

            var template = [
                "<div class='" + o.classes.inner + "'>",
                    "<div class='" + o.classes.header + "'>",
                        "<h4>Editing row</h4>",
                        "<button class='" + o.classes.close + "' type='button' data-editor-close>×</button>",
                    " </div>",
                    "<div class='" + o.classes.block + "'>",
                        "<form class='" + o.classes.form + "'>",
                            "<div class='" + o.classes.row + "'>",
                                "<button class='" + o.classes.save + "' type='button' data-editor-save>Save</button>",
                            "</div>",
                        "</form>",
                    "</div>",
                "</div>",
            ].join("");

            var modal = utils.createElement("div", {
                class: o.classes.modal,
                html: template
            });

            var inner = modal.firstElementChild;
            var form = inner.lastElementChild.firstElementChild;

            // Add the inputs for each cell
            [].slice.call(row.cells).forEach(function(cell, i) {
                form.insertBefore(utils.createElement("div", {
                    class: o.classes.row,
                    html: [
                        "<div class='datatable-editor-row'>",
                            "<label class='" + o.classes.label + "'>" + instance.labels[o.hiddenColumns ? i : instance.activeHeadings[i].originalCellIndex] + "</label>",
                            "<input class='" + o.classes.input + "' value='" + cell.innerHTML + "' type='text'>",
                        "</div>"
                    ].join("")
                }), form.lastElementChild);
            });

            this.modal = modal;

            this.openModal();

            this.editing = true;
            this.editingRow = true;

            // Close / save
            modal.addEventListener("click", function(e) {
                var node = e.target;
                if (node.hasAttribute("data-editor-close")) {  // close button
                    that.closeModal();
                } else if (node.hasAttribute("data-editor-save")) { // save button
                    var data = [].slice.call(form.elements).map(function(input) {
                        return input.value.trim();
                    });

                    that.saveRow(row, data);
                }
            });

            that.closeMenu();
        };

        /**
         * Save edited row
         * @param  {Object} row    The HTMLTableRowElement
         * @param  {Array} data   Cell data
         * @return {Void}
         */
        Editor.prototype.saveRow = function(row, data) {
            var that = this,
                o = that.config;

            [].slice.call(row.cells).forEach(function(cell, i) {
                cell = instance.data[row.dataIndex].cells[o.hiddenColumns ? i : instance.activeHeadings[i].originalCellIndex];
                cell.innerHTML = cell.data = data[i];
            });

            instance.columns().rebuild();

            this.closeModal();
        };

        /**
         * Save edited cell
         * @param  {Object} row    The HTMLTableCellElement
         * @param  {String} value   Cell content
         * @return {Void}
         */
        Editor.prototype.saveCell = function(cell, value) {
            cell = cell || this.data.cell;
            value = value || this.data.input.value;

            // Set the cell content
            cell.innerHTML = value.trim();

            this.data = {};
            this.editing = this.editingCell = false;
        };

        /**
         * Open the row editor modal
         * @return {Void}
         */
        Editor.prototype.openModal = function() {
            if (!this.editing && this.modal) {
                document.body.appendChild(this.modal);
            }
        };

        /**
         * Close the row editor modal
         * @return {Void}
         */
        Editor.prototype.closeModal = function() {
            if (this.editing && this.modal) {
                document.body.removeChild(this.modal);
                this.modal = this.editing = this.editingRow = false;
            }
        };

        /**
         * Remove a row
         * @param  {Number|Object} row The HTMLTableRowElement or dataIndex property
         * @return {Void}
         */
        Editor.prototype.removeRow = function(row) {
            if (!row) {
                var row = closest(this.event.target, function(node) {
                    return node.nodeName === "TR";
                });

                if (row && row.dataIndex !== undefined) {
                    instance.rows().remove(row.dataIndex);
                    this.closeMenu();
                }
            } else {
                // User passed a HTMLTableRowElement
                if (row instanceof Element && row.nodeName === "TR" && row.dataIndex !== undefined) {
                    row = row.dataIndex;
                }

                instance.rows().remove(row);

                this.closeMenu();
            }
        };

        /**
         * Update context menu position
         * @return {Void}
         */
        Editor.prototype.update = function() {
            var scrollX = window.scrollX || window.pageXOffset;
            var scrollY = window.scrollY || window.pageYOffset;

            this.rect = this.wrapper.getBoundingClientRect();

            this.limits = {
                x: window.innerWidth + scrollX - this.rect.width,
                y: window.innerHeight + scrollY - this.rect.height
            };
        };

        /**
         * Dismiss the context menu
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.dismiss = function(e) {

            var valid = true,
                editing = this.editing && this.editingCell;

            if ( this.config.contextMenu ) {
                valid = !this.wrapper.contains(e.target) && (editing && e.target !== this.data.input);
            }

            if (valid) {
                if (editing) {
                    // Revert
                    this.saveCell(this.data.cell, this.data.content);
                }
                this.closeMenu();
            }
        };

        /**
         * Open the context menu
         * @return {Void}
         */
        Editor.prototype.openMenu = function() {
            if (this.config.contextMenu) {
                document.body.appendChild(this.container);
                this.closed = false;
            }
        };

        /**
         * Close the context menu
         * @return {Void}
         */
        Editor.prototype.closeMenu = function() {
            if (this.config.contextMenu && !this.closed) {
                this.closed = true;
                document.body.removeChild(this.container);
            }
        };

        /**
         * Destroy the instance
         * @return {Void}
         */
        Editor.prototype.destroy = function() {
            off(this.target, "dblclick", this.events.double);
            off(this.target, "contextmenu", this.events.context);

            off(document, "click", this.events.dismiss);
            off(document, "keydown", this.events.keydown);

            off(window, "resize", this.events.reset);
            off(window, "scroll", this.events.reset);

            document.body.removeChild(this.container);
        };

        return new Editor(this.body, options);
    });
}