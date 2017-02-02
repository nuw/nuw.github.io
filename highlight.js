
	if (!NodeList.prototype.forEach) {
		NodeList.prototype.forEach = Array.prototype.forEach;
	}

;(function(){
	var highlight = true; // flag of highlighting is active now

	var flag; // stored current or last ascii column

	var config = {
		highlightSelector: '.highlight > pre',
		lineLength: 16 + 1, // length + EOL
		ascii: wrapNode('ascii'),
		raw: wrapNode('raw'),
		offset: wrapNode('offset')
	};

	document.addEventListener("DOMContentLoaded", function() {

		// get all 3st column (ascii) and bind handler
		document
			.querySelectorAll(config.highlightSelector + '> :last-child')
			.forEach (function (node) {
				// overlay for visual selection
				// because firefox not update textContent between mouseup and mousedown for Selection API
				var overlay = document.createElement('pre');
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
				node.addEventListener('mousedown', function(e) {
					e.preventDefault();
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
		
		var selection = document.getSelection().getRangeAt(0);
		var selectionStart = selection.startOffset;
		var selectionEnd = selection.endOffset;

		if(highlight || !flag || !flag.isASCII || !flag.textContent.length || selectionStart == selectionEnd) 
			return cleanSelection();
		
		var rawRange = document.createRange();
    	var offsetRange = document.createRange();
    	var overlayRange = document.createRange();

    	// get text nodes
    	var rawNode = flag.parentNode.childNodes[1].childNodes[0];  
    	var offsetNode = flag.parentNode.childNodes[0].childNodes[0]; 
    	var overlayNode = flag.querySelector('.overlay').childNodes[0]; 
		
		var start, end, length; // offset start/end and length of rawNode or offsetNode or overlayNode
    	
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

		var form = flag.parentNode.parentNode.parentNode.parentNode.querySelector('form');

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

		var overlay = flag.querySelector('.overlay');
		var parent = flag.parentNode;

		// reset first column with offset
		var tmp = parent.childNodes[0].textContent.toString()
		parent.childNodes[0].textContent = ''; // its important
		parent.childNodes[0].textContent = tmp;

		// reset column with hex data
		tmp = parent.childNodes[1].textContent.toString()
		parent.childNodes[1].textContent = ''; // its important
		parent.childNodes[1].textContent = tmp;

		// reset overlay
		tmp = flag.textContent;
		overlay.textContent = ''; // its important
		overlay.textContent = flag.textContent.toString();
		
		document.body.classList.remove('noselect');
		flag.classList.remove('yesselect');

		// reset form
		var form = flag.parentNode.parentNode.parentNode.parentNode.querySelector('form');
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