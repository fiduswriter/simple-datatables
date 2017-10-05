/*! Editable 0.0.2
 * © 2016-2017 Karl Saunders
 */

/**
 * @summary     Editable
 * @description Allow editing of cells and rows
 * @version     0.0.2
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
if (window.DataTable && typeof window.DataTable === "function")
{
    DataTable.extend("editable", function(options, utils) {

        // VDT Reference
        var dt = this;

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
            // set the menu items
            menu: [{
                    text: "Edit Cell",
                    action: function() {
                        this.edit();
                    }
                },
                {
                    text: "Edit Row",
                    action: function() {
                        this.edit("row");
                    }
                },
                {
                    separator: true
                },
                {
                    text: "Remove",
                    action: function() {
                        this.remove();
                    }
                }
            ]
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
            var that = this;

            utils.classList.add(dt.wrapper, "datatable-editable");


            this.container = utils.createElement("div", {
                id: this.config.classes.container
            });

            this.wrapper = utils.createElement("div", {
                class: this.config.classes.wrapper
            });

            this.menu = utils.createElement("ul", {
                class: this.config.classes.menu
            });

            this.config.menu.forEach(function(item) {
                var li = utils.createElement("li", {
                    class: item.separator ? this.config.classes.separator : this.config.classes.item
                });

                if (!item.separator) {
                    var a = utils.createElement("a", {
                        class: this.config.classes.action,
                        href: item.url || "#",
                        html: item.text
                    });
                    li.appendChild(a);

                    if (item.action && typeof item.action === "function") {
                        a.addEventListener("click", function(e) {
                            e.preventDefault();
                            item.action.call(that);
                        });
                    }
                }

                this.menu.appendChild(li);
            }, this);

            this.wrapper.appendChild(this.menu);
            this.container.appendChild(this.wrapper);

            this.data = {};
            this.closed = true;
            this.editing = false;
            this.editingRow = false;
            this.editingCell = false;

            this.update();
            this.bindEvents();
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
            this.target.addEventListener("dblclick", this.events.double);

            // listen for right-click
            this.target.addEventListener("contextmenu", this.events.context);

            // listen for click anywhere but the menu
            document.addEventListener("click", this.events.dismiss);

            // listen for right-click
            document.addEventListener("keydown", this.events.keydown);

            // reset
            this.events.reset = debounce(this.events.update, 50);

            window.addEventListener("resize", this.events.reset);
            window.addEventListener("scroll", this.events.reset);
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
            if (e.keyCode === 13 && this.editing && this.data) {
                this.data.cell.innerHTML = this.data.input.value.trim();
                this.data = {};
                this.editing = this.editingCell = false;
            }
        };

        /**
         * Edit cell or row
         * @param  {String} type    cell or row
        * @return {Void}
         */
        Editor.prototype.edit = function(type) {

            type = type || "cell";

            var name = (type === "cell") ? "TD" : "TR";

            var that = this,
                node = closest(this.event.target, function(el) {
                    return el.nodeName === name;
                });


            if (node) {
                if (type === "cell") {
                    this.editCell(node);
                } else {
                    this.editRow(node);
                }
            }
        };

        /**
         * Edit cell
         * @param  {Object} cell    The HTMLTableCellElement
         * @return {Void}
         */
        Editor.prototype.editCell = function(cell) {

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

            if (row.nodeName !== "TR" || this.editing) return;

            row = dt.activeRows[row.dataIndex];

            var that = this,
                o = that.config;

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
            ];

            var modal = utils.createElement("div", {
                class: o.classes.modal,
                html: template.join("")
            });

            var inner = modal.firstElementChild;
            var form = inner.lastElementChild.firstElementChild;

            // Add the inputs for each cell
            [].slice.call(row.cells).forEach(function(cell, i) {
                form.insertBefore(utils.createElement("div", {
                    class: o.classes.row,
                    html: [
                        "<div class='datatable-editor-row'>",
                            "<label class='" + o.classes.label + "'>" + dt.labels[dt.activeHeadings[i].originalCellIndex] + "</label>",
                            "<input class='" + o.classes.input + "' value='" + cell.innerHTML + "' type='text'>",
                        "</div>"
                    ].join("")
                }), form.lastElementChild);
            });

            document.body.appendChild(modal);

            this.modal = modal;

            this.editing = true;
            this.editingRow = true;

            // Close / save
            modal.addEventListener("click", function(e) {
                var node = e.target;
                if (node.hasAttribute("data-editor-close")) {
                    that.closeModal();
                } else if (node.hasAttribute("data-editor-save")) {
                    that.saveRow(row, form);
                }
            });

            that.closeMenu();
        };

        /**
         * Save edited row
         * @param  {Object} row    The HTMLTableRowElement
         * @param  {Object} form    The form
         * @return {Void}
         */
        Editor.prototype.saveRow = function(row, form) {
            row = dt.activeRows[row.dataIndex];


            [].slice.call(row.cells).forEach(function(cell, i) {
                cell = dt.data[row.dataIndex].cells[dt.activeHeadings[i].originalCellIndex];
                cell.innerHTML = cell.data = form.elements[i].value;
            });

            dt.columns().rebuild();

            this.closeModal();
        };

        /**
         * Close the row editor modal
         * @return {Void}
         */
        Editor.prototype.closeModal = function() {
            document.body.removeChild(this.modal);
            this.editing = this.editingRow = false;
        };

        /**
         * Remove a row
         * @param  {Number} index The dataIndex property
         * @return {Void}
         */
        Editor.prototype.removeRow = function(index) {

            if (!index) {
                var row = closest(this.event.target, function(node) {
                    return node.nodeName === "TR";
                });

                if (row && row.dataIndex !== undefined) {
                    dt.rows().remove(row.dataIndex);
                    this.closeMenu();
                }
            } else {
                dt.rows().remove(index);
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
            var valid = !this.wrapper.contains(e.target);

            if (valid) {
                if (this.editing && this.editingCell) {
                    this.data.cell.innerHTML = this.data.content;
                    this.data = {};
                    this.editing = this.editingCell = false;
                }
                this.closeMenu();
            }
        };

        /**
         * Open the context menu
         * @return {Void}
         */
        Editor.prototype.openMenu = function() {
            document.body.appendChild(this.container);
            this.closed = false;
        };

        /**
         * Close the context menu
         * @return {Void}
         */
        Editor.prototype.closeMenu = function() {
            if (!this.closed) {
                this.closed = true;
                document.body.removeChild(this.container);
            }
        };

        /**
         * Destroy the instance
         * @return {Void}
         */
        Editor.prototype.destroy = function() {
            window.removeEventListener("resize", this.reset);
            window.removeEventListener("scroll", this.reset);
            this.target.removeEventListener("contextmenu", this.handleContext);
            this.container.removeChild(this.wrapper);

            if (!this.container.children.length) {
                document.body.removeChild(this.container);
            }
        };

        return new Editor(this.body, options);
    });
}