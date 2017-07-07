(() => {
	App.initWho = () => {
		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		// colors for the block links, depending on status	
		var blockModeColors = {
			'': 'transparent',
			'default': 'transparent',
			'incomplete': 'rgba(242,222,222,1)', // red
			'custom': 'rgba(252,248,227,1)'
		};

		// define blocks
		const blocks = {
		  "country": {},
		  "currency": {},
		  "pop-dist": {}
		}

		// define blocksShowing
		const blocksShowing = [
		  {
		    "abbr": "country",
		    "name": "Country",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "currency",
		    "name": "Currency",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "pop-dist",
		    "name": "Population and Districts",
		    "level": 0,
		    "status": ""
		  }
		];

		// add "links" (tabs) to sidebar
		var blockLinks = d3.select('.block-link-container').selectAll('.block-link')
			.data(blocksShowing)
			.enter().append('div')
				.attr('class', 'block-link')
				.attr('level', function(d) { return d.level; })
				.style('display', function(d) { return (d.level > 0) ? 'none' : 'block'; })
				.classed('children-showing', function(d) { if (d.level === 0) return false; })
				.attr('block-name', function(d) { return d.abbr; })
				.on('click', function(d) { showBlock(d.abbr); });
		blockLinks.append('div')
			.attr('class', 'block-link-title')
			.html(function(d) { return d.name; });
		blockLinks.append('div')
			.attr('class', 'block-status')
			.html(function(d) { return d.status; });
		blockLinks.append('div').attr('class', 'block-link-cover');
		
		// add arrow image to active block
		d3.select('.block-link-container .block-link:first-child').append('img')
			.attr('class', 'block-link-arrow')
			.attr('src', 'img/chevron-right.png');

		// // add parent attribute to children blocks
		// for (var name in blocks) {
		// 	if (blocks[name].hasOwnProperty('children')) {
		// 		for (var childName in blocks[name].children) {
		// 			blocks[name].children[childName].parent = name;
		// 		}
		// 	}
		// }


		// // only show blocks related to chosen esfs
		// var blocksShowing = [];
		// var addBlockToVar = function(name, block, level, parentAbbr) {
		// 	var isRelevant = false;
		// 	for (var i = 0; i < block.esf.length; i++) {
		// 		if (inputValues.esf.indexOf(String(block.esf[i])) > -1) {
		// 			isRelevant = true;
		// 			break;
		// 		}
		// 	}
		// 	if (block.hazard && block.hazard.indexOf(inputValues.hazard) === -1) isRelevant = false;
		// 	if (isRelevant) {
		// 		var blockInfo = {
		// 			abbr: name,
		// 			name: block.blockName ? block.blockName : $('.' + name + '-block .block-title-title').text(),
		// 			level: level,
		// 			status: 'default',
		// 		};
		// 		if (level === 1) blockInfo.parentAbbr = parentAbbr;
		// 		for (var ind in block) blockInfo[ind] = block[ind];
		// 			blocksShowing.push(blockInfo);
		// 	}
		// 	return isRelevant;
		// };
		// for (var name in blocks) {
		// 	var isRelevant = addBlockToVar(name, blocks[name], 0);
		// 	if (isRelevant && blocks[name].hasOwnProperty('children')) {
		// 		for (var childName in blocks[name].children) {
		// 			addBlockToVar(childName, blocks[name].children[childName], 1, name);
		// 		}
		// 	}
		// };

		// // add "links" (tabs) to sidebar
		// var blockLinks = d3.select('.block-link-container').selectAll('.block-link')
		// .data(blocksShowing)
		// .enter().append('div')
		// .attr('class', 'block-link')
		// .attr('level', function(d) { return d.level; })
		// .style('display', function(d) { return (d.level > 0) ? 'none' : 'block'; })
		// .classed('children-showing', function(d) { if (d.level === 0) return false; })
		// .attr('block-name', function(d) { return d.abbr; })
		// .on('click', function(d) { showBlock(d.abbr); });
		// blockLinks.append('div')
		// .attr('class', 'block-link-title')
		// .html(function(d) { return d.name; });
		// blockLinks.append('div')
		// .attr('class', 'block-status')
		// .html(function(d) { return d.status; });
		// blockLinks.append('div').attr('class', 'block-link-cover');
		
		// // add arrow image to active block
		// d3.select('.block-link-container .block-link:first-child').append('img')
		// .attr('class', 'block-link-arrow')
		// .attr('src', 'img/chevron_right.png');


		// function that updates an input block's status (incomplete, default, custom)
		var updateBlockStatus = function(blockAbbr, defaultStatus, moduleName) {
			var blockInfo = getBlockInfo(blockAbbr);
			var statuses = blockInfo.isDefault;

			// set the status
			if (typeof defaultStatus !== 'undefined') {
				if (moduleName) statuses[moduleName] = defaultStatus;
				else statuses[blockAbbr] = defaultStatus;
			}
			
			// determine the status name to display
			for (var ind in statuses) {
				// color tooltip elements either white or red depending on default status
				if (blockInfo.hasOwnProperty('tooltipElements') && blockInfo.tooltipElements.hasOwnProperty(ind)) {
					var tooltipEle = blockInfo.tooltipElements[ind];
					statuses[ind] ? $(tooltipEle).removeClass('non-default') : $(tooltipEle).addClass('non-default');
					
					// show tooltip for the tooltip elements
					if (blockAbbr === currBlockAbbr) {
						if (blockInfo.hasOwnProperty('tooltipShowFn') && blockInfo.tooltipShowFn.hasOwnProperty(ind)) {
							blockInfo.tooltipShowFn[ind](statuses[ind]);
						} else {
							toggleInputTooltip(tooltipEle, statuses[ind]);
						}
					}
				}
			}

			// set the status name and update the block link name and color
			var statusText = getBlockStatus(blockAbbr);		
			var blockLink = d3.select('.block-link[block-name="' + blockAbbr + '"]');
			blockLink.datum().status = statusText;
			blockLink.select('.block-status').text((statusText === 'default') ? '' : statusText);
			updateBlockLinkColor(blockInfo.abbr, blockLink);
			
			// update any text elements displaying default status (e.g. population summary)
			if (blockInfo.hasOwnProperty('isDefaultTextElements')) {
				for (var ind in blockInfo.isDefaultTextElements) {
					$(blockInfo.isDefaultTextElements[ind]).text(getBlockComponentStatus(blockInfo, ind));
				}
			}
			
			// if the block has a parent, update the parent block as well
			if (blockInfo.hasOwnProperty('parent')) updateBlockStatus(blockInfo.parent);
		};
		
		// // color block links appropriately (white, red, or yellow) in a horizontal gradient
		// var updateBlockLinkColor = function(blockAbbr, blockLinkEle) {
		// 	if (typeof blockLinkEle === 'undefined') var blockLinkEle = d3.select('.block-link[block-name="' + blockAbbr + '"]');		
		// 	blockLinkEle.style('background', function(d) {
		// 		var bgColor = (blockAbbr === currBlockAbbr && (d.status === '' || d.status === 'default')) ? '#f0f0f0' : blockModeColors[d.status];
		// 		return 'linear-gradient(to right, ' + bgColor + ', white)';
		// 	});
		// };
		
		// // show or hide the tooltips for a block
		// var toggleBlockTooltip = function(blockAbbr, show) {
		// 	var blockInfo = getBlockInfo(blockAbbr);
		// 	if (blockInfo.hasOwnProperty('tooltipElements')) {
		// 		var tooltipElements = [];
		// 		var tooltipEleDict = blockInfo.tooltipElements;
		// 		for (var ind in tooltipEleDict) {
		// 			if (show) {
		// 				// if not default, add element to tooltipster collection to show or hide
		// 				if (blockInfo.hasOwnProperty('tooltipShowFn') && blockInfo.tooltipShowFn.hasOwnProperty(ind)) {
		// 					blockInfo.tooltipShowFn[ind](blockInfo.isDefault[ind]);
		// 				} else {
		// 					if (!blockInfo.isDefault[ind]) tooltipElements.push(tooltipEleDict[ind]);
		// 				}
		// 			} else {
		// 				tooltipElements.push(tooltipEleDict[ind]);
		// 			}
		// 		}
		// 		var displayStr = show ? 'show' : 'hide';
		// 		if ($(tooltipElements.join(', ')).hasClass('tooltipstered')) $(tooltipElements.join(', ')).tooltipster(displayStr);
		// 	}		
		// };

		// show the specified block while hiding other blocks
		var showBlock = function(blockAbbr, animate) {
			if (typeof animate === 'undefined') var animate = true;
			var pastBlockAbbr = currBlockAbbr;
			var blockInfo = getBlockInfo(blockAbbr);
			
			// clicked block link of block already showing or parent block link while child block was showing
			var clickedSameOrParent = (blockAbbr === currBlockAbbr) ||
			(blockInfo.hasOwnProperty('children') && blockInfo.children.hasOwnProperty(currBlockAbbr));
			if (clickedSameOrParent) return;
			
			// hide all other blocks, including tooltips
			if (animate) $('.input-block-container .block').slideUp();
			else $('.input-block-container .block').hide();
			if (typeof pastBlockAbbr !== 'undefined') {
				toggleBlockTooltip(pastBlockAbbr, false);
				$('.block-link[block-name="' + pastBlockAbbr + '"]').removeClass('active');
			}
			
			// reset all borders
			d3.selectAll('.block-link')
			.style('border-top', function(d, i) { return (i === 0) ? '1px solid #ccc' : 'none'; })
			.style('border-bottom', '1px solid #ccc');

			// clicked the block link of a different block than the one currently showing
			currBlockAbbr = blockAbbr;
			if (blockInfo.hasOwnProperty('firstChild')) currBlockAbbr = blockInfo.firstChild;		
			
			// place arrow on active row, and attach active attribute to block link
			var blockLink = $('.block-link[block-name="' + currBlockAbbr + '"]').addClass('active');
			$('.block-link-arrow').appendTo(blockLink).show();
			
			// show block's children if it exists
			if (blockInfo.hasOwnProperty('children') && !Util.isKeyInObject(blockInfo.children, pastBlockAbbr)) {
				for (var childName in blockInfo.children) {
					if (animate) $('.block-link[block-name="' + childName + '"]').slideDown();
					else $('.block-link[block-name="' + childName + '"]').show();
				}
			}
			
			// hide previous block's children if it exists
			if (typeof pastBlockAbbr !== 'undefined') {
				var pastBlockInfo = getBlockInfo(pastBlockAbbr);
				if (pastBlockInfo.hasOwnProperty('parent') && pastBlockInfo.parent !== blockInfo.parent && pastBlockInfo.parent !== blockAbbr) {
					var pastParentBlockInfo = getBlockInfo(pastBlockInfo.parent);
					hideBlockLinks(pastParentBlockInfo.children, animate);
				} else if (pastBlockInfo.hasOwnProperty('children') && !Util.isKeyInObject(pastBlockInfo.children, blockAbbr)) {
					hideBlockLinks(pastBlockInfo.children, animate);
				}
			}
			
			// move block to show downwards to align with block link
			/*var offsetTop = blockLink.offset().top - blockLink.parent().offset().top;
			offsetTop -= $('.' + blockAbbr + '-block').height() / 2;
			if (offsetTop <= 0) offsetTop = -11;
			$('.' + blockAbbr + '-block').css('margin-top', offsetTop);*/

			// move block to stick to top of input block container
			/*var blockContainerTop = $('.input-block-container').offset().top;
			var scrollTop = $(window).scrollTop();
			var diffTop = scrollTop + 60 - blockContainerTop;
			if (diffTop < 0) diffTop = 0;
			$('.' + blockAbbr + '-block').css('margin-top', diffTop);*/
			
			// collect all elements to show (block, block-info, extraBlocks)
			var selectionToShow = $('.' + currBlockAbbr + '-block');
			if (blockInfo.hasOwnProperty('extraBlocks')) {
				var showExtraBlocks = true;
				if (blockInfo.hasOwnProperty('extraBlocksCond')) {
					showExtraBlocks = blockInfo.extraBlocksCond();
				}
				if (showExtraBlocks) {
					var extraBlocks = blockInfo.extraBlocks;
					for (var i = 0; i < extraBlocks.length; i++) {
						selectionToShow = selectionToShow.add(extraBlocks[i]);
					}
				}
			}
			if (animate) selectionToShow.slideDown();
			else selectionToShow.show();
			selectionToShow.trigger('block-open');

			// show tooltips if there are any (timeout is to wait for animation to be done)
			if (animate) setTimeout(function() { toggleBlockTooltip(currBlockAbbr, true); }, 410);
			else toggleBlockTooltip(currBlockAbbr, true);

			// if opened up eagle i block, mark as completed
			if (currBlockAbbr === 'eaglei') updateBlockStatus('eaglei', true);
			
			// fix borders for when children are showing
			if (blockInfo.hasOwnProperty('children') || blockInfo.hasOwnProperty('parent')) {
				blockLink.nextAll('[level="0"]:first')
				.css('border-top', '1px solid #ccc')
				.prev().css('border-bottom', 'none');
			}

			// update block link colors
			if (typeof pastBlockAbbr !== 'undefined') updateBlockLinkColor(pastBlockAbbr);
			updateBlockLinkColor(currBlockAbbr);		
		};
		
		// color block links appropriately (white, red, or yellow) in a horizontal gradient
		var updateBlockLinkColor = function(blockAbbr, blockLinkEle) {
			if (typeof blockLinkEle === 'undefined') var blockLinkEle = d3.select('.block-link[block-name="' + blockAbbr + '"]');		
			blockLinkEle.style('background', function(d) {
				var bgColor = (blockAbbr === currBlockAbbr && (d.status === '' || d.status === 'default')) ? '#f0f0f0' : blockModeColors[d.status];
				return 'linear-gradient(to right, ' + bgColor + ', white)';
			});
		};

		// show or hide the tooltips for a block
		var toggleBlockTooltip = function(blockAbbr, show) {
			var blockInfo = getBlockInfo(blockAbbr);
			if (blockInfo.hasOwnProperty('tooltipElements')) {
				var tooltipElements = [];
				var tooltipEleDict = blockInfo.tooltipElements;
				for (var ind in tooltipEleDict) {
					if (show) {
						// if not default, add element to tooltipster collection to show or hide
						if (blockInfo.hasOwnProperty('tooltipShowFn') && blockInfo.tooltipShowFn.hasOwnProperty(ind)) {
							blockInfo.tooltipShowFn[ind](blockInfo.isDefault[ind]);
						} else {
							if (!blockInfo.isDefault[ind]) tooltipElements.push(tooltipEleDict[ind]);
						}
					} else {
						tooltipElements.push(tooltipEleDict[ind]);
					}
				}
				var displayStr = show ? 'show' : 'hide';
				if ($(tooltipElements.join(', ')).hasClass('tooltipstered')) $(tooltipElements.join(', ')).tooltipster(displayStr);
			}		
		};

		// // hide the block links of the children block of the given block name
		// var hideBlockLinks = function(blockNames, animate) {
		// 	for (var blockName in blockNames) {
		// 		if (animate) $('.block-link[block-name="' + blockName + '"]').slideUp();
		// 		else $('.block-link[block-name="' + blockName + '"]').hide();
		// 	}
		// };
		
		// get the block information (may be embedded in another block's children attribute)
		var getBlockInfo = function(blockAbbr) {
			for (var name in blocks) {
				if (name === blockAbbr) return blocks[name];
				else if (blocks[name].hasOwnProperty('children')) {
					for (var childName in blocks[name].children) {
						if (childName === blockAbbr) return blocks[name].children[childName];
					}
				}
			}
		};
		
		// returns the status of a child block
		var getBlockStatus = function(blockAbbr) {
			var blockInfo = getBlockInfo(blockAbbr);
			var status = (blockInfo.hasOwnProperty('completeText')) ? blockInfo.completeText : 'default';
			
			if (blockInfo.hasOwnProperty('children')) {
				for (var childName in blockInfo.children) {
					var childStatus = getBlockStatus(childName);
					if (childStatus === 'incomplete' || childStatus === 'custom') {
						return childStatus;
					}
				}
			} else {
				var statusObj = blockInfo.isDefault;
				for (var ind in statusObj) {
					var componentStatus = getBlockComponentStatus(blockInfo, ind);
					if (componentStatus === 'incomplete') return 'incomplete';
					else if (componentStatus === 'custom' && status !== 'custom') {
						status = 'custom';
					}
				}
			}
			return status;
		};
		
		// // returns the default status for a component of a block
		// var getBlockComponentStatus = function(blockInfo, componentName) {
		// 	if (typeof blockInfo === 'undefined') var blockInfo = getBlockInfo(blockAbbr);
		// 	if (blockInfo.isDefault[componentName] === false) {
		// 		if (blockInfo.hasOwnProperty('required') && blockInfo.required.indexOf(ind) > -1) {
		// 			return 'incomplete';
		// 		} else {
		// 			return 'custom';
		// 		}
		// 	} else {
		// 		return blockInfo.hasOwnProperty('completeText') ? blockInfo.completeText : 'default';
		// 	}
		// };
		
		// // determine whether the block is being shown based on the user's ESF choices
		// var isBlockOnPage = function(blockAbbr) {
		// 	for (var i = 0; i < blocksShowing.length; i++) {
		// 		if (blocksShowing[i].abbr === blockAbbr) return true;
		// 	}
		// 	return false;
		// };
		
		// // show or hide tooltip and change input color
		// var toggleInputTooltip = function(element, isDefault) {
		// 	var $element = $(element);
		// 	if ($element.hasClass('tooltipstered')) {
		// 		$element.tooltipster(isDefault ? 'hide' : 'show');
		// 	}
		// };

		var currBlockAbbr; // the block name abbreviation for the current block showing
		showBlock(blocksShowing[0].abbr, false);
		blockLinks.each(function(d) { updateBlockStatus(d.abbr); });


		// /* ------------------------------- Building the DOM Elements --------------------------------- */
		// // display correct block content and descriptions if based on hazard
		// $('.input-block-container .block-content, .input-block-container .block-description').css('display', function() {
		// 	return 'block';
		// 	// var contentHazardStr = $(this).attr('hazard');
		// 	// if (typeof contentHazardStr !== 'undefined') {
		// 	// 	var contentHazards = contentHazardStr.split(',');
		// 	// 	return (contentHazards.indexOf(inputValues.hazard) === -1) ? 'none' : 'block';
		// 	// } 
		// });
		
		// // build out location block
		// if (isBlockOnPage('location')) {
		// 	// add counties and states for county picker
		// 	var countyClass = '.search-county';
		// 	var stateClass = '.search-state-for-county';	
		// 	var addOptions = function(data, type, param) {
		// 		if (!param) var param = {};
		// 		if (!param.hasOwnProperty('refresh')) param.refresh = true;
				
		// 		var cont = (type === 'county') ? countyClass : stateClass;
		// 		var ele = (type === 'county') ? '.search-county-element' : '.search-state-element';
		// 		$(ele).remove();
		// 		d3.select(cont).selectAll(ele)
		// 		.data(data)
		// 		.enter().append('option')
		// 		.attr('class', ele.slice(1))
		// 		.attr('selected', function(d) { if (d.selected) return true; })
		// 		.attr('value', function(d) { return d.abbr;	})
		// 		.html(function(d) {
		// 			return (type === 'county') ? d.abbr : d.name;
		// 		});
		// 		if (param.refresh) {
		// 			$(cont).multiselect('rebuild');
		// 		}
		// 	};
		// 	var addOptionsForState = function(state_abbr, param) {
		// 		if (!param) var param = {};
				
		// 		var county_list = [];
		// 		for (var fips in COUNTIES) {
		// 			if (COUNTIES[fips].state_abbr === state_abbr) {
		// 				county_list.push({
		// 					abbr: COUNTIES[fips].county_abbr,
		// 					selected: (inputValues.locations.indexOf(+fips) > -1)
		// 				});
		// 			}
		// 		}
				
		// 		Util.sortObjects(county_list, 'abbr');
		// 		addOptions(county_list, 'county', param);
		// 	};
		// 	var displayForState = function(state_abbr, param) {
		// 		if (!param) var param = {};
		// 		addOptionsForState(state_abbr, param);
		// 		if (param.hasOwnProperty('refresh') && param.refresh === false) {
		// 			$('.search-state-for-county option[value="' + state_abbr + '"]').attr('selected', true);
		// 		} else {
		// 			$(stateClass).multiselect('select', state_abbr, false);
		// 		}
		// 	};
		// 	addOptions(STATES_UNIQ, 'state', {refresh: false});
		// 	if (inputValues.locations.length > 0) {
		// 		displayForState(App.getLocationObject()[0].state_abbr, {refresh: false});
		// 	}
			
		// 	// add cities to city picker
		// 	d3.select('.search-city').selectAll('option')
		// 	.data(CITIES_UNIQ)
		// 	.enter().append('option')
		// 	.attr('value', function(d) { return d.fips; })
		// 	.text(function(d) { return d.name; });
			
		// 	// add states to state pickers
		// 	var stateNames = Util.sortObjects(STATES_UNIQ.slice(0), 'name');
		// 	d3.select('.search-state').selectAll('option')
		// 	.data(stateNames)
		// 	.enter().append('option')
		// 	.attr('value', function(d) { return d.abbr; })
		// 	.text(function(d) { return d.name; });
		// }
	};
})();