/**
 * Plugin to highlight the cells containing the matched string during a search.
 * @type {Object}
 */
DataTable.prototype.highlightMatches = {
	init: function(datatable) {
		if ( !this instanceof DataTable ) return;

		this.datatable = datatable;
		this.className = 'match'

		this.datatable.table.on('datatable.search', this.highlight.bind(this));
	},

	highlight: function() {
		var _this = this, val = this.datatable.searchInput.value;

		if ( !val.length ) {
			_this.resetMatches();
			return false;
		}

		var matches = [];
		for( var i = 0, len = _this.datatable.searchPages.length; i < len; i++ ) {
			let page = _this.datatable.searchPages[i];
			for( var _i = 0, _len = page.length; _i < _len; _i++ ) {
				let tr = page[_i];
				for( var _j = 0, _jlen = tr.cells.length; _j < _jlen; _j++ ) {
					let cell = tr.cells[_j];
					let text = cell.textContent.toLowerCase();
					let result = new RegExp(val, 'i').test(text);
					if ( result ) {
						cell.classList.add(_this.className);
					} else {
						cell.classList.remove(_this.className);
					}
				};
			};
		};
	},

	resetMatches: function() {
		var _this = this;
		var matches = this.datatable.table.getElementsByClassName(_this.className);

		for (var i = matches.length-1; i > -1; i--) {
			matches[i].classList.remove(_this.className);
		}
	},
};