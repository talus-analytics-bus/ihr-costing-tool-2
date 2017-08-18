(() => {
	App.initCosting = (capClass, indClass) => {
		const capId = Util.getIndicatorId(capClass);
		const indId = Util.getIndicatorId(capClass + '-' + indClass);

		const capacity = App.getCapacity(capId);
		const indicator = App.getIndicator(indId);
		const actions = App.getNeededActions(indicator);

		const moneyFormat = (num) => {
			if (num < 100) return d3.format('$')(Math.round(num));
			return d3.format('$,.3r')(num);
		}

		$('.go-to-results-button').click(() => hasher.setHash('results'));


		/* --------------- Input Block Overview and Links -------------- */		
		function buildContent() {
			App.buildTabNavigation('.block-link-container', capId);
			buildCapacityDescription();
			buildIndicatorContent();
			if (actions.length) showAction(actions[0]);
			updateTotalCosts();
			attachNextButtonBehavior();
		}


		// add the capacity description content
		function buildCapacityDescription() {
			$('.capacity-description-container').html(Routing.templates['capacity-description']());
			App.buildCapacityDescription(capId);
		}

		// build the indicator tabs
		function buildIndicatorContent() {
			// update number of indicators complete, and indicator description
			updateIndicatorProgress();

			// add indicators to slots
			const indSlots = d3.select('.indicator-container').selectAll('.indicator-slot')
				.data(capacity.indicators)
				.enter().append('div')
					.attr('class', 'indicator-slot')
					.classed('active', d => d.id === indId)
					.classed('empty', d => typeof User.getIndicatorScore(d.id) === 'undefined')
					.on('click', (d, i) => {
						hasher.setHash(`costs/${capClass}/${i+1}`);
					});

			// add indicator name
			indSlots.append('div')
				.attr('class', 'indicator-name')
				.text(d => `${d.id.toUpperCase()} - ${Util.truncateText(d.name)}`);

			// add indicator score
			const scoreContainer = indSlots.append('div')
				.attr('class', 'indicator-score');
			scoreContainer.append('span')
				.attr('class', 'score-none')
				.style('display', d => User.getIndicatorScore(d.id) ? 'none' : 'inline')
				.html('<i>No Score</i>');
			for (let i = 1; i <= 5; i++) {
				scoreContainer.append('img')
					.attr('class', `rp-score`)
					.attr('src', `img/rp-${i}.png`)
					.attr('alt', i)
					.attr('score', i)
					.style('display', (d) => {
						return +User.getIndicatorScore(d.id) === i ? 'inline' : 'none';
					});
			}

			// add cost for each indicator
			indSlots.append('div').attr('class', 'indicator-cost');

			// add description
			$('.indicator-description').html(`${indId.toUpperCase()} - ${indicator.name}`);
		}

		// set up list of actions for user to choose from
		function setupActionContent() {
			if (actions.length) {
				// add every action for the indicator
				const headers = d3.select('.action-header-content').selectAll('.action-header')
					.data(actions)
					.enter().append('div')
						.attr('class', 'action-header')
						.on('click', (d) => {
							showAction(d);
						});
				headers.append('div')
					.attr('class', 'action-name')
					.text(d => d.name);
				headers.append('div')
					.attr('class', 'action-scores')
					.html((d) => {
						return `<img class="rp-score" src="img/rp-${d.score_step_to - 1}.png" />` +
							' to ' +
							`<img class="rp-score" src="img/rp-${d.score_step_to}.png" />`;
					});
				headers.append('div').attr('class', 'action-cost');
			} else {
				$('.action-header-content, .item-block-container').hide();
				$('.action-header-empty-content').show();
			}
		}
		setupActionContent();

		function showAction(action) {
			// make this header active
			d3.selectAll('.action-header')
				.classed('active', d => d.id === action.id);

			// show correct items for this action
			showItemBlocks(action);
		}

		function showItemBlocks(action) {
			let items = d3.select('.item-block-container').selectAll('.item-block')
				.data(action.inputs);  // TODO needs to be line items for action
			items.exit().remove();

			// add HTML structure to each new item
			const newItems = items.enter().append('div')
				.attr('class', 'item-block');
			newItems.append('div').attr('class', 'item-title');
			newItems.append('div').attr('class', 'item-cost');
			newItems.append('div')
				.attr('class', 'item-select-button')
				.text('Selected');
			const itemFooters = newItems.append('div').attr('class', 'item-footer');
			itemFooters.append('div')
				.attr('class', 'item-edit-cost-button')
				.text('Edit Item Cost');
			itemFooters.append('div')
				.attr('class', 'item-view-details-button')
				.text('View Details')
				.each(function() {
					$(this).tooltipster({
						theme: 'tooltipster-shadow',
						maxWidth: 400,
						trigger: 'click',
						side: ['top', 'right', 'bottom', 'left'],
					});
				});

			items = newItems.merge(items);
			items.select('.item-title').text(d => d.name);
			items.select('.item-cost').text(d => moneyFormat(d.cost));
			items.select('.item-select-button')
				.classed('selected', d => d.selected)
				.on('click', function(d) {
					// user toggles an item
					d.selected = !d.selected;
					d3.select(this)
						.classed('selected', d.selected)
						.text(d.selected ? 'Selected': 'Select');

					updateTotalCosts();
				});
			items.select('.item-view-details-button').each(function(d) {
				const contentContainer = d3.select(document.createElement('div'));
				const content = contentContainer.append('div')
					.attr('class', 'item-details-container');
				
				// add table of line items
				const liTable = content.append('table')
					.attr('class', 'line-item-table table table-condensed table-striped')
					.append('tbody');
				const liRows = liTable.selectAll('tr')
					.data(d.line_items)
					.enter().append('tr');
				liRows.append('td').text(li => li.name);
				liRows.append('td').text(li => moneyFormat(li.cost));

				// add total cost
				const totalRow = liTable.append('tr');
				totalRow.append('td').text('Total');
				totalRow.append('td').text(moneyFormat(d.cost));

				$(this).tooltipster('content', contentContainer.html());
			});
		}

		// updates the total cost of the actions
		function updateTotalCosts() {
			App.updateAllCosts();
			d3.selectAll('.action-cost').text(d => moneyFormat(d.cost));
			d3.selectAll('.indicator-cost').text(d => moneyFormat(d.cost));
		}


		// updates message on how many indicators have been scored
		function updateIndicatorProgress() {
			const numInds = capacity.indicators.length;
			const numScored = numInds - d3.selectAll('.empty').nodes().length;
			d3.select('.indicator-progress')
				.text(`Review costs for each indicator (${numScored} of ${numInds}):`);
		};

		// define the behavior for the "previous" and "next" button
		function attachNextButtonBehavior() {
			// set function for next button
			const nextHash = {
				'p': {next: 'd', prev: 'p', max: 7, min: 1},
				'd': {next: 'r', prev: 'p', max: 4, min: 1},
				'r': {next: 'r', prev: 'd', max: 5, min: 1}
			};

			d3.select('.next-score').on('click', () => {
				const indsCount = d3.select(`.${capClass}-block`).selectAll('.indicator-slot').nodes().length;
				if (parseInt(indClass) === indsCount) {
					if (capClass === 'r-5' && indClass === '5') {
						// no-op
					} else if (parseInt(capClass[2]) === nextHash[capClass[0]].max) {
						hasher.setHash(`costs/${nextHash[capClass[0]].next}-1/${1}`);
					} else {
						hasher.setHash(`costs/${capClass[0]}-${parseInt(capClass[2])+1}/${1}`);
					}
				} else {
					hasher.setHash(`costs/${capClass}/${parseInt(indClass) + 1}`);
				}
			});

			d3.select('.previous-score').on('click', function() {
				const indsCount = d3.select(`.${capClass}-block`).selectAll('.indicator-slot').nodes().length;

				if (capClass[0] !== 'p' && (parseInt(capClass[2]) === 1 && parseInt(indClass) === 1)) {
					// go back one major block (e.g. d-1)
					let prevClass = nextHash[capClass[0]].prev + '-' + nextHash[nextHash[capClass[0]].prev].max;
					hasher.setHash(`costs/${prevClass}/${1}`);
				} else if (parseInt(indClass) === nextHash[capClass[0]].min) {
					// go back one minor block
					const prevInd = capClass[0]+'-'+(parseInt(capClass[2])-1)
					hasher.setHash(`costs/${prevInd}/${1}`);
				} else {
					// go back one indicator
					hasher.setHash(`costs/${capClass}/${(indClass - 1)}`);
				}
			});
		}

		
		// TODO if previous hash was this CC, don't slide
		if (!App.prevHash) App.prevHash = '';
		const prevHashArr = App.prevHash.split('/');

		if (prevHashArr[0] !== 'costs' || prevHashArr[1] !== capClass) {
			$(`.${capClass}-block`).fadeOut(0, function(){$(this).fadeIn();});
		}

		// DEMO show the fake-block html in the AMR example
		// TODO setup the block content dynamically
		const demoScoringHtml = $('.fake-block').html();
		$(`.${capClass.toLowerCase()}-block`).html(demoScoringHtml);
		$('.fake-block').html('');


		// update the hash history
		App.prevHash = hasher.getHash();

		buildContent();
	};
})();
