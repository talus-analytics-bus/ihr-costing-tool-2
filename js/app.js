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

		// add the hrefs to the dropdown menu items
        $('.dropdown-item').click(function() {
            hasher.setHash($(this).attr('page'));
        });

		// activate tooltipster
		$.tooltipster.setDefaults({
			//plugins: ['follower'],
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
		.defer(d3.json, 'data/global_base_costs.json')
		.defer(d3.json, 'data/global_staff_multipliers.json')
		.await((error, countryParams, jeeTree, currencies, globalBaseCosts, globalStaffMultipliers) => {

			App.countryParams = countryParams;
			App.jeeTree = jeeTree;
			App.currencies = currencies;
			App.globalBaseCosts = globalBaseCosts;
			App.globalStaffMultipliers = globalStaffMultipliers;
			App.whoAmI = {};

			// add costs to each level of the jeeTree
			App.updateAllCosts({
				setInputsToSelected: true,
			});
			
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
                //return 'linear-gradient(to right, ' + bgColor + ', white)';
				return;
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


  /* ------------------ jeeTree Getter Functions ------------------- */
  App.normalCcIds = ['p', 'd', 'r'];

  // gets the capacity from the jeeTree given an id
	App.getCapacity = (id) => {
		const ccId = id.includes('.') ? id.split('.')[0].toLowerCase() : 'o';
		const capId = id.toLowerCase();
		const cc = App.jeeTree.find(cc => cc.id === ccId);
		if (!cc) return null;
		return cc.capacities.find(cap => cap.id === capId);
	}

  // gets the indicator from the jeeTree given an id
	App.getIndicator = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 2 : 1;
		const capId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
		const indId = id.toLowerCase();
		const cap = App.getCapacity(capId);
		if (!cap) return null;
		return cap.indicators.find(ind => ind.id === indId);
	}

	// gets the previous indicator given an indicator
	App.getPrevIndicator = (capId, indId) => {
		const ccId = capId.includes('.') ? capId.split('.')[0].toLowerCase() : 'o';
		const ccIndex = App.jeeTree.findIndex(cc => cc.id === ccId);
		const cc = App.jeeTree[ccIndex];
		const capIndex = cc.capacities.findIndex(cap => cap.id === capId);
		const cap = cc.capacities[capIndex];
		const indIndex = cap.indicators.findIndex(ind => ind.id === indId);
		if (indIndex > 0) {
			return cap.indicators[indIndex - 1];
		} else {
			// go to prev capacity
			if (capIndex > 0) {
				const prevCap = cc.capacities[capIndex - 1];
				return prevCap.indicators[prevCap.indicators.length - 1];
			} else {
				// go to next core capacity
				if (ccIndex > 0) {
					const prevCc = App.jeeTree[ccIndex - 1];
					const prevCap = prevCc.capacities[prevCc.capacities.length - 1];
					return prevCap.indicators[prevCap.indicators.length - 1];
				} else {
					// that's the beginning!
					return null;
				}
			}
		}
	}

	// gets the next indicator given an indicator
	App.getNextIndicator = (capId, indId) => {
		const ccId = capId.includes('.') ? capId.split('.')[0].toLowerCase() : 'o';
		const ccIndex = App.jeeTree.findIndex(cc => cc.id === ccId);
		const cc = App.jeeTree[ccIndex];
		const capIndex = cc.capacities.findIndex(cap => cap.id === capId);
		const cap = cc.capacities[capIndex];
		const indIndex = cap.indicators.findIndex(ind => ind.id === indId);
		if (indIndex < cap.indicators.length - 1) {
			return cap.indicators[indIndex + 1];
		} else {
			// go to next capacity
			if (capIndex < cc.capacities.length - 1) {
				return cc.capacities[capIndex + 1].indicators[0];
			} else {
				// go to next core capacity
				if (ccIndex < App.jeeTree.length - 1) {
					return App.jeeTree[ccIndex + 1].capacities[0].indicators[0];
				} else {
					// that's the end!
					return null;
				}
			}
		}
	}

  // gets the action from the jeeTree given an id
  App.getAction = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 3 : 2;
		const indId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
		const actionId = id.toLowerCase();
		const ind = App.getIndicator(indId);
		if (!ind) return null;
		return ind.actions.find(a => a.id === actionId);
  }

  // gets the input from the jeeTree given an id
  App.getInput = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 4 : 3;
		const actionId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
		const inputId = id.toLowerCase();
		const action = App.getAction(actionId);
		if (!action) return null;
		return action.inputs.find(input => input.id === inputId);
  }

  // gets the line item from the jeeTree given an id
  App.getLineItem = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 5 : 4;
  	const inputId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
  	const liId = id.toLowerCase();
  	const input = App.getInput(inputId);
  	if (!input) return null;
  	return input.line_items.find(li => li.id === liId);
  }


  /* ------------------ Scoring Functions ------------------- */
  App.getNeededActions = (ind) => {
		// find actions that match the target score
		let actions = [];
		if (ind.score) {
			if (User.targetScoreType === 'step') {
				actions = ind.actions.filter((action) => {
					return action.score_step_to.includes(ind.score + 1);
				});
			} else if (User.targetScoreType === 'target') {
				const scoresToGetTo = d3.range(ind.score + 1, User.targetScore + 1);
				actions = ind.actions.filter((action) => {
					for (let k = 0; k < action.score_step_to.length; k++) {
						if (scoresToGetTo.includes(action.score_step_to[k])) return true;
					}
					return false;
				});
			}
		} else {
			// if indicator is not scored, display all actions for the user to see
			actions = ind.actions;
		}
		return actions;
  }

  // returns average score for a set of given indicators
  App.getAverageCurrentScore = (inds) => {
		const indScores = [];
		inds.forEach((ind) => {
			if (ind.score) indScores.push(ind.score);
		});
		return d3.mean(indScores);
  }

  // returns average new score for a set of given indicators
  App.getAverageTargetScore = (inds) => {
		const newIndScores = [];
		inds.forEach((ind) => {
			if (ind.score) {
				if (User.targetScoreType === 'step') {
					if (ind.score === 5) newIndScores.push(5);
					else newIndScores.push(ind.score + 1);
				} else if (User.targetScoreType === 'target') {
					if (ind.score > User.targetScore) newIndScores.push(ind.score);
					else newIndScores.push(User.targetScore);
				}
			}
		});
		return d3.mean(newIndScores);
  }


  /* ------------------ Cost Functions ------------------- */
	// sets/updates the costs for all levels of the jeeTree
	App.updateAllCosts = (param={}) => {
		App.jeeTree.forEach((cc) => {
			cc.startupCost = 0;
			cc.capitalCost = 0;
			cc.recurringCost = 0;

			cc.capacities.forEach((cap) => {
				cap.startupCost = 0;
				cap.capitalCost = 0;
				cap.recurringCost = 0;

				cap.indicators.forEach((ind) => {
					ind.startupCost = 0;
					ind.capitalCost = 0;
					ind.recurringCost = 0;

					const actions = App.getNeededActions(ind);
					actions.forEach((a) => {
						a.startupCost = 0;
						a.capitalCost = 0;
						a.recurringCost = 0;

						a.inputs.forEach((input) => {
							input.startupCost = 0;
							input.capitalCost = 0;
							input.recurringCost = 0;

							// set inputs to user-selected (usually on init)
							if (param.setInputsToSelected) input.selected = true;

							input.line_items.forEach((li) => {
								const costObj = App.globalBaseCosts.find((gbc) => {
									return gbc.id === li.base_cost;
								});
								li.cost = costObj ? costObj.cost : 0;

								// include multipliers
								if (li.staff_multiplier) {
									const multiplierObj = App.globalStaffMultipliers.find((sm) => {
										return sm.id === li.staff_multiplier;
									});
									if (multiplierObj) li.cost *= multiplierObj.count;
								}
								if (li.country_multiplier) {
									// TODO lookup and include
								}
								if (li.custom_multiplier_1) {
									li.cost *= App.getMultiplierValue(li.custom_multiplier_1);
								}
								if (li.custom_multiplier_2) {
									li.cost *= App.getMultiplierValue(li.custom_multiplier_2);
								}

								// add overhead if a salary
								if (costObj && costObj.subheading_name === 'Salaries') {
									// TODO add overhead from country parameters
								}

								if (li.line_item_type === 'start-up') {
									input.startupCost += li.cost;
								} else if (li.line_item_type === 'capital') {
									input.capitalCost += li.cost;
								} else if (li.line_item_type === 'recurring') {
									input.recurringCost += li.cost;
								}
							});
							if (input.selected) {
								a.startupCost += input.startupCost;
								a.capitalCost += input.capitalCost;
								a.recurringCost += input.recurringCost;
							}
						});
						ind.startupCost += a.startupCost;
						ind.capitalCost += a.capitalCost;
						ind.recurringCost += a.recurringCost;
					});
					cap.startupCost += ind.startupCost;
					cap.capitalCost += ind.capitalCost;
					cap.recurringCost += ind.recurringCost;
				});
				cc.startupCost += cap.startupCost;
				cc.capitalCost += cap.capitalCost;
				cc.recurringCost2 += cap.recurringCost;
			});
		});
	}

	// builds the cost text for any level of the jeeTree above line item (e.g. indicator)
	App.getCostText = (branch) => {
		const startupCost = branch.startupCost + branch.capitalCost;
		const recurringCost = branch.recurringCost;
		if (!recurringCost) return moneyFormat(startupCost);
		//if (!startupCost) return `${moneyFormat(recurringCost)}/yr`;
		return `${moneyFormat(startupCost)} + ${moneyFormat(recurringCost)}/yr`;
	}


	// parses multiplier string or integer and returns an integer
	App.getMultiplierValue = (input) => {
		if (typeof input === 'number') return input;
		const numbers = input.match(/\d+/);
		if (!numbers) return 1;
		return numbers[0];
	}

	const moneyFormat = (num) => {
		if (num < 100) return d3.format('$')(Math.round(num));
		return d3.format('$,.3r')(num);
	}
})();
