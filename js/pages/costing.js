(() => {
	App.initCosting = (capClass, indClass) => {
		const capId = Util.getIndicatorId(capClass);
		const indId = Util.getIndicatorId(capClass + '-' + indClass);

		$('.go-to-results-button').click(() => hasher.setHash('results'));


		/* --------------- Input Block Overview and Links -------------- */		

		function buildContent() {
			App.buildTabNavigation('.block-link-container', capId);
			buildCapacityDescription();
		}

		function buildCapacityDescription() {
			$('.capacity-description-container').html(Routing.templates['capacity-description']());
			App.buildCapacityDescription(capId);
		}


		/* --------------- --------------------- Old Code ------------------ -------------- */		
		
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


		/*
		* updateIndicatorProgress
		* Updates message about how many indicators have been scored for the current
		* core capacity
		*/
		function updateIndicatorProgress() {
			const numInds = d3.selectAll('.indicator-slot').nodes().length;
			const numScored = d3.selectAll('.full').nodes().length;
			d3.select('.indicator-progress').text(`${numScored} of ${numInds} indicators costed`);
		};


	    /*
		* setupScoreTabContent
		* Populates each CC's score tab content
		*/
		function setupScoreTabContent() {
			const cc = App.getCoreCapacity(capId);

			// set description of indicator and the score descriptions
			const ind = App.getIndicator(indId);
			$('.indicator-description').text(ind.name);

			// select indicator container that holds the slots
			const indContainer = d3.select('.indicator-container');

			// add indicators to slots
			const inds = cc.indicators;
			const indSlots = indContainer.selectAll('.indicator-slot')
				.data(inds)
				.enter().append('div')
					.classed('indicator-slot', true)
					.each(function(d){
						// get current slot
						const curSlot = d3.select(this);

						// add class that defines which indicator it is
						curSlot.classed(Util.getIndicatorClass(d.id), true);

						// add class 'full' if there's a score defined
						// add class 'empty' otherwise
						const curSlotScore = User.getIndicatorScore(d.id);
						const slotClass = (curSlotScore !== undefined) ? 'full' : 'empty';
						curSlot.classed(slotClass, true);

					})
					.on('click', function(d, i) {
						hasher.setHash(`costs/${capClass}/${i+1}`);
					});

			// add indicator name
			indSlots.append('div')
				.classed('indicator-name', true)
				.text(d => {
					return Util.truncateText(d.name);
				});

			// add indicator score
			indSlots.append('div')
				.attr('class', 'indicator-score')
				.html((d) => {
					if (!d.score) return 'No score';

					const score = +d.score;
					if (score >= 4) {
						return `<span class='score-text score-text-${score}'>${score}</span>`;
					}

					const t1 = `<span class='score-text score-text-${score}'>${score}</span>`;
					const t2 = `<span class='score-text score-text-${score + 1}'>${score + 1}</span>`;
					return `${t1} to ${t2}`;
				});

			// add cost for each indicator
			indSlots.append('div')
				.attr('class', 'indicator-cost')
				.text('$0');

			// set number of indicators scored and total number
			updateIndicatorProgress();
		};
		setupScoreTabContent();

		/*
		 * Set up list of actions for user to choose from
		 */
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
		

		// set titles for table cells to be equal to their text so
		// the space can be reserved
		d3.selectAll('td').each(function(){d3.select(this).attr('content',d3.select(this).text());});

		// set function for next button
		const nextHash = {
			'p': {next: 'd', prev:'p', max: 7, min: 1},
			'd': {next: 'r', prev:'p', max: 4, min: 1},
			'r': {next: 'r', prev:'d', max: 5, min: 1}
		};
		d3.select('.next-cost').on('click', function () {
			const indsCount = d3.select(`.${capClass}-block`).selectAll('.indicator-slot').nodes().length;
			if (parseInt(indClass) === indsCount) {
				if (capClass === 'r-5' && indClass === '5') {
					// no-op
				}
				else if (parseInt(capClass[2]) === nextHash[capClass[0]].max) {
					hasher.setHash(`costs/${nextHash[capClass[0]].next}-1/${1}`);
				}
				else {
					hasher.setHash(`costs/${capClass[0]}-${parseInt(capClass[2])+1}/${1}`);
				}
			} else {
				hasher.setHash(`costs/${capClass}/${parseInt(indClass) + 1}`);
			}
		});

        d3.select('.previous-cost').on('click', function () {
             const indsCount = d3.select(`.${capClass}-block`).selectAll('.indicator-slot').nodes().length;
            //if (parseInt(indClass) === indsCount) {
            if (capClass === 'p-1' && indClass === '1') {
                // no-op
            }
            else if (capClass[0] !== 'p' && (parseInt(capClass[2]) === 1 && parseInt(indClass) === 1)) {
                  	// go back one major block (e.g. d-1)
                    let prevClass = nextHash[capClass[0]].prev + '-' + nextHash[nextHash[capClass[0]].prev].max;
                    hasher.setHash(`costs/${prevClass}/${1}`);
            } else if (parseInt(indClass) === nextHash[capClass[0]].min) {
            	// go back one minor block
				  const prevInd = capClass[0]+'-'+(parseInt(capClass[2])-1)
                hasher.setHash(`costs/${prevInd}/${1}`);
            }
			else {
            	// go back one indicator

                hasher.setHash(`costs/${capClass}/${(indClass - 1)}`);
            }

            //} else {
              //  hasher.setHash(`costs/${capClass}/${parseInt(indClass) + 1}`);
            //}
        });

		// update the hash history
		App.prevHash = hasher.getHash();

		buildContent();
	};
})();
