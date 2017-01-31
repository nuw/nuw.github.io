
	if (!NodeList.prototype.forEach) {
		NodeList.prototype.forEach = Array.prototype.forEach;
	}

;(function(){
	let highlight = true; // flag of highlighting is active now

	let flag; // stored current or last ascii column

	let config = {
		highlightSelector: '.highlight > pre',
		lineLength: 16 + 1, // length + EOL
		ascii: wrapNode('ascii'),
		raw: wrapNode('raw'),
		offset: wrapNode('offset')
	};

	document.addEventListener("DOMContentLoaded", function() {

		document
			.querySelectorAll(config.highlightSelector + '> :last-child')
			.forEach (function (node) {
				let overlay = document.createElement('pre');
				overlay.classList.add('overlay');
				overlay.textContent = node.textContent;
				node.appendChild(overlay);
				node.addEventListener ('mousedown', mousedown, false);
				node.classList.add('selection');
				node.isASCII = true;
			});

		document.addEventListener('mouseup', mouseup, false);

		// form handler
		document.querySelectorAll('.btn.btn-default')
			.forEach (function(node) {
				node.addEventListener('mousedown', function() {
					alert('Line: ' + this.parentNode.querySelectorAll('input')[0].value + '\n' + 'Data: ' + this.parentNode.querySelectorAll('input')[1].value)
				})
			});


	});


	function mousedown () {
		cleanSelection(this);

		flag = this;
		highlight = false;

		document.body.classList.add('noselect');
		flag.classList.add('yesselect');
	}


	function mouseup () {
		
		let selection = document.getSelection().getRangeAt(0);
		let selectionStart = selection.startOffset;
		let selectionEnd = selection.endOffset;

		if(highlight || !flag || !flag.isASCII || !flag.textContent.length || selectionStart == selectionEnd) 
			return cleanSelection();
		
		let rawRange = document.createRange();
    	let offsetRange = document.createRange();
    	let overlayRange = document.createRange();

    	// get text nodes
    	let rawNode = flag.parentNode.childNodes[1].childNodes[0];  
    	let offsetNode = flag.parentNode.childNodes[0].childNodes[0]; 
    	let overlayNode = flag.querySelector('.overlay').childNodes[0]; 
		
		let start, end, length; // offset start/end and length of rawNode or offsetNode
    	
    	// ============== overlay ==============

    	if (selectionEnd - selectionStart != 1 && flag.textContent[selectionStart] != '\n') { 

    		overlayRange.setStart(overlayNode, selectionStart);
			overlayRange.setEnd(overlayNode, selectionEnd);
			overlayRange.surroundContents(config.ascii);

		}
		

    	// ============== rawNode ==============
    	length = rawNode.textContent.length;

    	start = selectionStart * 3 - (selectionStart / config.lineLength |0) * 2;

		if(rawNode.textContent[start] == ' ') start += 1;

    	end = selectionEnd * 3 - (selectionEnd / config.lineLength |0) * 2;

    	if(rawNode.textContent[end-1] == ' ') end -= 1;

		if(!end || end > length || end < start) end = length;


		rawRange.setStart(rawNode, start);
		rawRange.setEnd(rawNode, end);
		rawRange.surroundContents(config.raw);

		// ============== offsetNode ==============

		length = offsetNode.textContent.length;

    	start = (selectionStart / config.lineLength |0) * 10;

    	if (flag.textContent[selectionStart] == '\n') start += 10;

    	end = (selectionEnd / config.lineLength |0) * 10 + 10;

    	if (flag.textContent[selectionEnd-1] == '\n') end -= 10;

    	if(selectionEnd < 1 || end > length || end < start) end = length;


		offsetRange.setStart(offsetNode, start);
		offsetRange.setEnd(offsetNode, end);
		offsetRange.surroundContents(config.offset);

		// ============== form ==============

		let form = flag.parentNode.parentNode.parentNode.parentNode.querySelector('form');

		if (form) {
			form.string_of_payload.value = offsetRange.toString().slice(0,8);
			form.part_of_payload.value = rawRange.toString();
		}

		highlight = true;

	}

	function cleanSelection (defaultFlag) {
		if (!flag && !defaultFlag) return;
		if (!flag) flag = defaultFlag;
		document.getSelection().removeAllRanges()
		let overlay = flag.querySelector('.overlay');
		let parent = flag.parentNode;

		// reset first column with offset
		let tmp = parent.childNodes[0].textContent.toString()
		parent.childNodes[0].textContent = '';
		parent.childNodes[0].textContent = tmp;

		// reset column with hex data
		tmp = parent.childNodes[1].textContent.toString()
		parent.childNodes[1].textContent = '';
		parent.childNodes[1].textContent = tmp;

		// reset overlay
		tmp = flag.textContent;
		overlay.textContent = '';
		overlay.textContent = flag.textContent.toString();
		
		document.body.classList.remove('noselect');
		flag.classList.remove('yesselect');

		// reset form
		let form = flag.parentNode.parentNode.parentNode.parentNode.querySelector('form');
		if (form) {
			form.string_of_payload.value = '';
			form.part_of_payload.value = '';
		}

		flag = false;
	}

	function wrapNode (type) {
		wrap = document.createElement('span')
		wrap.classList.add(type);
		wrap.classList.add('highlighter');
		return wrap;
	};

})();