/**
 * Plugin to allow cells to be edited
 * @type {Object}
 */
DataTable.prototype.editCells = {
	init: function(datatable) {
		if ( !this instanceof DataTable ) return;

		this.datatable = datatable;
		this.datatable.table.addEventListener('dblclick', this.edit.bind(this), false);
	},

	edit: function(e)
	{
		if ( e.target.nodeName.toLowerCase() !== 'td' ) return;

		e.preventDefault();

		var _this = this;

		this.td = e.target;
		this.td = e.target;
		this.td.classList.add('dataTable-editing');

		this.scrollX = window.scrollX || window.pageXOffset;
		this.scrollY = window.scrollY || window.pageYOffset;

		var rect = this.td.getBoundingClientRect();

		this.editor = document.createElement('div');
		this.input = document.createElement('input');
		this.submit = document.createElement('button');
		this.cancel = document.createElement('button');

		this.submit.type = 'button';
		this.cancel.type = 'button';

		this.submit.className = 'btn-submit';
		this.cancel.className = 'btn-cancel';

		this.editor.classList.add('datatable-editor');

		this.input.classList.add('dataTable-input');
		this.input.type = 'text';
		this.input.value = this.td.textContent;

		this.editor.appendChild(this.input);
		this.editor.appendChild(this.submit);
		this.editor.appendChild(this.cancel);

		this.editor.style.position = 'absolute';
		this.editor.style.top = (((rect.top - rect.height) - 15) + this.scrollY) + 'px';
		this.editor.style.left = (rect.left + this.scrollX) + 'px';

		this.handleDismiss = this.dismiss.bind(this);

		document.body.addEventListener('click', this.handleDismiss, false);
		document.body.addEventListener('keyup', this.handleDismiss, false);

		document.body.appendChild(this.editor);

		setTimeout(function() {
			_this.input.focus();
			_this.input.selectionStart = _this.input.selectionEnd = 10000;
		}, 10)
	},

	dismiss: function(e)
	{
		var target = e.target,
			canDismiss = !this.editor.contains(target) || target === this.cancel || target === this.submit || (e.type === 'keyup' && e.keyCode === 13);

		if ( target === this.submit || e.keyCode === 13 ) {
			this.save();
		}

		if ( canDismiss ) {
			this.td.classList.remove('dataTable-editing');
			document.body.removeChild(this.editor);
			document.body.removeEventListener('click', this.handleDismiss);
			document.body.removeEventListener('keyup', this.handleDismiss);
		}
	},

	save: function()
	{
		this.td.textContent = this.input.value.trim();
	}
};
