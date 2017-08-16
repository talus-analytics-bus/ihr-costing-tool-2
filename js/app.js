const App = {};

(() => {
	App.scoreLabels = {
		1: 'No Capacity',
		2: 'Limited Capacity',
		3: 'Developed Capacity',
		4: 'Demonstrated Capacity',
		5: 'Sustainable Capacity',
	};

	/*
	*	Initialize basic app behaviors
	*/
	App.initialize = (callback) => {

		// initiate behavior for navigation links
		$('.tool-name').click(() => hasher.setHash(''));
		$('.nav-item').click(function() {
			if ($(this).attr('page') !== undefined) { // dropdown lists do not have associated pages
                hasher.setHash($(this).attr('page'));
            }
		});

        $('.dropdown-item').click(function() {
            hasher.setHash($(this).attr('page'));
        });

		// activate tooltipster
		$.tooltipster.setDefaults({
			plugins: ['follower'],
			contentAsHTML: true,
			trigger: 'hover',
			anchor: 'top-center',
			 offset: [5, -25],
			theme: 'tooltipster-shadow',
			maxWidth: 320,
		});
		
		// load country params data
		d3.queue()
		.defer(d3.json, 'data/country-params.json')
		.defer(d3.json, 'data/jeeTree.json')
		.defer(d3.json, 'data/currencies.json')
		.await((error, countryParams, jeeTree, currencies) => {

			App.countryParams = countryParams;
			App.jeeTree = jeeTree;
			App.currencies = currencies;
			App.whoAmI = {};
			
			// launch callback fcn in arguments
			callback();
		});
	}
	

	/*
	 * App.setupCountryTabs
	 */
    App.setupWhoTabs = (blocksShowing, blocks, ccClass) => {
        // colors for the block links, depending on status
        const blockModeColors = {
            '': 'transparent',
            'default': 'transparent',
            'incomplete': 'rgba(242,222,222,1)', // red
            'custom': 'rgba(252,248,227,1)'
        };

        // add "links" (tabs) to sidebar
        var blockLinks = d3.select('.block-link-container').selectAll('.block-link')
            .data(blocksShowing)
            .enter().append('div')
            .attr('class', 'block-link')
            .attr('level', function(d) { return d.level; })
            .style('display', function(d) { return (d.level > 0) ? 'none' : 'block'; })
            .classed('children-showing', function(d) { if (d.level === 0) return false; })
            .attr('block-name', function(d) { return d.abbr; })
            .on('click', function(d) {
            	const hash = hasher.getHashAsArray();
            	const newHash = [hash[0], d.abbr]
					.concat(hash[0] ==='scores'?[1]:[])
					.join('/');
            	hasher.setHash(newHash);
            	});
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

        var currBlockAbbr; // the block name abbreviation for the current block showing
        showBlock(ccClass, false);
        blockLinks.each(function(d) { updateBlockStatus(d.abbr); });



    };


    /*
    *	App.getCoreCapacity
    *	Finds the specified core capacity in the jeeTree and returns it
    */
	App.getCoreCapacity = (ccId) => {
		// ensure id valid
		ccId = ccId.toUpperCase();

		// get right core element
		// TODO add hashes for PoE, rad, and chem
		const coreElementHash = {
			'P': 'Prevent',
			'D': 'Detect',
			'R': 'Respond'
		};

		// get right core element
		const ccIdArr = ccId.split('.');
		const ce = _.findWhere(App.jeeTree, {name: coreElementHash[ccIdArr[0]]});

		// get right core capacity
		const ccIdx = ccIdArr[1] - 1;
		const cc = ce.capacities[ccIdx];

		// return result
		return cc;
	};

	/*
	*	App.getIndicator
	*	Finds the specified indicator in the jeeTree and returns it
	*/
	App.getIndicator = (indId) => {
		// ensure id valid
		indId = indId.toUpperCase();

		// get right core capacity
		const cc = App.getCoreCapacity(indId);

		// get right indicator
		const indIdArr = indId.split('.');
		const indIdx = indIdArr[2] - 1;
		const ind = cc.indicators[indIdx];

		// return result
		return ind;
	};
})();
