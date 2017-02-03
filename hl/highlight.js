;(function(){

	if(!NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;

	document.addEventListener('DOMContentLoaded', function(){
		
		var containers = document.querySelectorAll('.highlight');

		if (!containers.length) return;

		// initialization фand parsing
		containers.forEach(function(container){

			var text = container.textContent.split('\n'); // store text
			
			container.textContent = ''; // empty container

			text.reduce(function(split, str){ // parser

				split[0].push(str.slice(0, 9).trim()); // offset
				split[1].push(str.slice(9, -16).trim()); // raw
				split[2].push(str.slice(-16).trim()); // ascii

				return split;

			}, [[],[],[]]).forEach(function(item, index, column){ // create columns
				column = document.createElement('span');
				column.textContent = item.join('\n');
				column.classList.add('selection-disable');
				column.appendChild(column.cloneNode(true));
				column.classList.add('column');
				column.lastChild.classList.add('overlay');
				column.highlight = true;
				column.index = index;
				container.appendChild(column);
			});

		});

		document.addEventListener('mousedown', selectionStart);
		document.addEventListener('mouseup', selectionEnd);
		document.addEventListener('mousemove', selectionChange);

	});

	var selection = document.getSelection();
	var range = document.createRange();

	var wrappers = ['offset', 'raw', 'ascii'].map(function(name, el){
		el = document.createElement('span');
		el.classList.add(name);
		return el;
	});

	var focused, last;

	function clean(container) {
		container.childNodes.forEach(function(column, content){
			content = column.lastChild.textContent;
			column.lastChild.textContent = '';
			column.lastChild.textContent = content;
		});

	};

	function toForm (copy) {

		var form = copy ? focused.parentNode : last.parentNode;

		if(form = form.parentNode.parentNode.querySelector('form')) {
			form.string_of_payload.value = copy ? wrappers[0].textContent.slice(0, 8) : '';
			form.part_of_payload.value = copy ? wrappers[1].textContent.replace('\n', ' ') : '';
		}

	};

	function selectionStart(e){
		if(!e.target.highlight) return;
		console.log('start');

		selection.removeAllRanges(); 
		focused = e.target;

		if(last) clean(last.parentNode);

		document.body.classList.add('selection-disable');
		focused.classList.add('selection-enable');

	};

	function selectionEnd(e){
		if(!focused) return last ? void (clean(last.parentNode), toForm(false)) : void null;

		console.log('end');

		selectionChange(false);
		toForm(true);

		focused.classList.remove('selection-enable');
		document.body.classList.remove('selection-disable');

		last = focused;
		focused = null;

	};

	function selectionChange(event){
		if(!focused) return;
		clean(focused.parentNode);

		var srange = selection.getRangeAt(0);
		var stext = selection.toString();
		var slength = stext.length;
		var start = srange.startOffset;
		var end = srange.endOffset;
		var overlay = focused.lastChild;

		var text = overlay.textContent;
		var length = text.length;
		var index = focused.index;

		// preload emited colum

		// if event emit by offset column
		if(index === 0) {
			start -= (start % 10);
			end += 10 - (end % 10);
		}

		// if event emit by raw column
		if(index === 1) {
			while(true){
				
				var loop = false;

				if (start && text[start-1] != '\n' && (text[start] == ' ' || text[start-1] != ' ')) 
					--start, loop = true;
		
				if (end < length && text[end] != '\n' && text[end-1] != '\n' && (text[end] != ' ' || text[end-1] == ' ')) 
					++end, loop = true;
				
				if(!loop) break;

			}
		}

		if (end > length) end = length;
		if (start < 0) start = 0;

		// highlight columns
		offset(index, start, end, text);
		raw(index, start, end);
		ascii(index, start, end);

		if (!event) { // trigger after mousemove
			selection.removeAllRanges(); 
			range.setStart (focused.firstChild, start);
			range.setEnd (focused.firstChild, end);
			selection.addRange(range); // reinit native selection range
		}
	};

	// highlight offset column
	function offset(index, start, end, stext){

		var wrapper = wrappers[0];
		var column = focused.parentNode.firstChild;
		var overlay = column.lastChild.firstChild;
		var text = overlay.textContent;
		var length = text.length;

		var eol = false;

		// if event emit by raw column
		if(index === 1){
			eol = stext[end-1] == '\n';
			
			start = (start - (start)/49|0) / 48 | 0;
			end = (end - (end)/49|0) / 48 | 0;

			if (!eol) end += 1;
			
			end = end * 10;
			start = start * 10;
		}

		// if event emit by ascii column
		if (index === 2 && end - start) {
			eol = stext[end-1] == '\n';
			
			start = (start - (start)/17|0) / 16 | 0;
			end = (end - (end)/17|0) / 16 | 0;

			if (!eol) end += 1;
			
			end = end * 10;
			start = start * 10;
			
		}

		if (end > length) end = length;
		if (start > length) start = length;
		if (start < 0) start = 0;

		range.setStart(overlay, start);
		range.setEnd(overlay, end);
		range.surroundContents (wrapper);

	};

	// highlight raw column
	function raw(index, start, end, stext){

		var wrapper = wrappers[1];
		var column = focused.parentNode.childNodes[1];
		var overlay = column.lastChild.firstChild;
		var text = overlay.textContent;
		var length = text.length;

		// if event emit by offset column
		if (index === 0) {
			start = start / 10 | 0;
			end = Math.ceil(end / 10);
			start = start * 49;
			end = end * 49;
		}

		// if event emit by ascii column
		if (index === 2) {
			var x = start / 17 | 0;
			start -= x;
			start *= 3;
			start += x;
			if (text[start] == ' ') ++start;

			x = end / 17 | 0;
			end -= x;
			end *= 3;
			end += x;
			if (text[end-1] == ' ') --end;
		}

		if (end > length) end = length;
		if (start > length) start = length;
		if (start < 0) start = 0;

		range.setStart(overlay, start);
		range.setEnd(overlay, end);
		range.surroundContents (wrapper);

	};

	// highlight ascii column
	function ascii(index, start, end, stext){

		var wrapper = wrappers[2];
		var column = focused.parentNode.childNodes[2];
		var overlay = column.lastChild.firstChild;
		var text = overlay.textContent;
		var length = text.length;

		// if event emit by offset column
		if (index === 0) {
			start = start / 10 | 0;
			end = Math.ceil(end / 10);
			start = start * 17;
			end = end * 17;
		}

		// if event emit by raw column
		if (index === 1) {

			var x = (start+1) / 49 | 0;
			var y = (end+1) / 49 | 0;

			start = (start - x + 1) / 3 | 0;

			end = (end - y + 1) / 3 | 0;

			end += y;
			start += x;

		}

		if (end > length) end = length;
		if (start > length) start = length;
		if (start < 0) start = 0;

		range.setStart(overlay, start);
		range.setEnd(overlay, end);
		range.surroundContents (wrapper);

	};


})();