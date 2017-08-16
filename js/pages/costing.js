(() => {
	App.initCosting = (capClass, indClass) => {
		const capId = Util.getIndicatorId(capClass);
		const indId = Util.getIndicatorId(capClass + '-' + indClass);

		$('.go-to-results-button').click(() => hasher.setHash('results'));


		/* --------------- Input Block Overview and Links -------------- */		
		function buildContent() {
			App.buildTabNavigation('.block-link-container', capId);
			buildCapacityDescription();
			buildIndicatorContent();
			attachNextButtonBehavior();
		}


		// add the capacity description content
		function buildCapacityDescription() {
			$('.capacity-description-container').html(Routing.templates['capacity-description']());
			App.buildCapacityDescription(capId);
		}

		// build the indicator tabs
		function buildIndicatorContent() {
			const cc = App.getCoreCapacity(capId);
			const ind = App.getIndicator(indId);

			// update number of indicators complete, and indicator description
			updateIndicatorProgress();

			// add indicators to slots
			const indSlots = d3.select('.indicator-container').selectAll('.indicator-slot')
				.data(cc.indicators)
				.enter().append('div')
					.attr('class', 'indicator-slot')
					.classed('active', d => d.id === indId)
					.classed('empty', d => typeof User.getIndicatorScore(d.id) === 'undefined')
					.on('click', (d, i) => {
						hasher.setHash(`scores/${capClass}/${i+1}`);
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
			indSlots.append('div')
				.attr('class', 'indicator-cost')
				.text('$0');

			// add description
			$('.indicator-description').html(`${indId.toUpperCase()} - ${ind.name}`);
		}

		// set up list of actions for user to choose from
		function setupActionContent() {
			const ind = App.getIndicator(indId);

			const headers = d3.select('.action-headers').selectAll('.action-header')
				.data(ind.actions)
				.enter().append('div')
					.attr('class', 'action-header')
					.on('click', function(d) {
						showAction(d);
					});
			headers.append('input').attr('type', 'checkbox');
			headers.append('span').text(d => d.name);
		}
		setupActionContent();

		function showAction(action) {
			// make this header active
			d3.selectAll('.action-header')
				.classed('active', d => d.name === action.name);

			// show correct items for this action
			showItemBlocks(action);
		}

		function showItemBlocks(action) {
			const moneyFormat = d3.format('$.3s');

			let items = d3.select('.item-block-container').selectAll('.item-block')
				.data(action.inputs);  // TODO needs to be line items for action
			items.exit().remove();

			// add HTML structure to each new item
			const newItems = items.enter().append('div')
				.attr('class', 'item-block');
			newItems.append('div').attr('class', 'item-title');
			newItems.append('div').attr('class', 'item-cost');
			newItems.append('div')
				.attr('class', 'item-select-button btn btn-primary')
				.text('Selected');
			newItems.append('div').attr('class', 'item-description');
			const itemFooters = newItems.append('div').attr('class', 'item-footer');
			itemFooters.append('div')
				.attr('class', 'item-edit-cost-button')
				.text('Edit Item Cost');
			itemFooters.append('div')
				.attr('class', 'item-view-details-button')
				.text('View Details');

			items = newItems.merge(items);
			items.select('.item-title').text(d => d.name);
			items.select('.item-cost').text(moneyFormat(45e3));
			items.select('.item-select-button').on('click', (d) => {
				// user selects an action
			});
			items.select('.item-description').text(d => d.description);
		}
		showAction(App.getIndicator(indId).actions[0]);


		// updates message on how many indicators have been scored
		function updateIndicatorProgress() {
			const cc = App.getCoreCapacity(capId);
			const numInds = cc.indicators.length;
			const numScored = numInds - d3.selectAll('.empty').nodes().length;
			d3.select('.indicator-progress')
				.text(`Select a score for each indicator (${numScored} of ${numInds}):`);
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
						hasher.setHash(`scores/${nextHash[capClass[0]].next}-1/${1}`);
					} else {
						hasher.setHash(`scores/${capClass[0]}-${parseInt(capClass[2])+1}/${1}`);
					}
				} else {
					hasher.setHash(`scores/${capClass}/${parseInt(indClass) + 1}`);
				}
			});

			d3.select('.previous-score').on('click', function() {
				const indsCount = d3.select(`.${capClass}-block`).selectAll('.indicator-slot').nodes().length;

				if (capClass[0] !== 'p' && (parseInt(capClass[2]) === 1 && parseInt(indClass) === 1)) {
					// go back one major block (e.g. d-1)
					let prevClass = nextHash[capClass[0]].prev + '-' + nextHash[nextHash[capClass[0]].prev].max;
					hasher.setHash(`scores/${prevClass}/${1}`);
				} else if (parseInt(indClass) === nextHash[capClass[0]].min) {
					// go back one minor block
					const prevInd = capClass[0]+'-'+(parseInt(capClass[2])-1)
					hasher.setHash(`scores/${prevInd}/${1}`);
				} else {
					// go back one indicator
					hasher.setHash(`scores/${capClass}/${(indClass - 1)}`);
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
