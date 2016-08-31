/**
 * Plugin to highlight the cells containing the matched string during a search.
 * @type {Object}
 */
DataTable.prototype.highlightMatches = {
	initialise: function(datatable) {
		if ( !this instanceof DataTable ) return;

		this.datatable = datatable;

		datatable.on('datatable.search', this.highlight.bind(this));
	},

	highlight: function() {
		var _scope = this, val = this.datatable.searchInput.value;

		if ( !val.length ) {
			_scope.resetMatches();
			return false;
		}

		var matches = [];

		for( var i = 0, len = _scope.datatable.searchPages.length; i < len; i++ ) {
			let page = _scope.datatable.searchPages[i];
			for( var _i = 0, _len = page.length; _i < _len; _i++ ) {
				let tr = page[_i];
				for( var _j = 0, _jlen = tr.cells.length; _j < _jlen; _j++ ) {
					let cell = tr.cells[_j];
					let text = cell.textContent.toLowerCase();
					let inArray = matches.indexOf(tr) > -1;
					if ( text.includes(val) && !inArray ) {
						matches.push(tr);
						cell.classList.add('match');
					} else {
						cell.classList.remove('match');
					}
				};
			};
		};
	},

	resetMatches: function() {
		var _scope = this;
		for( var i = 0, len = _scope.datatable.searchPages.length; i < len; i++ ) {
			let page = _scope.datatable.searchPages[i];
			for( var _i = 0, _len = page.length; _i < _len; _i++ ) {
				let tr = page[_i];
				for( var _j = 0, _jlen = tr.cells.length; _j < _jlen; _j++ ) {
					let cell = tr.cells[_j];
					cell.classList.remove('match');
				};
			};
		};
	},
};