// All code for the Costing page should go here

(() => {
	App.initCosting = (ccClass, indClass) => {
		$('.cost-instructions-start').click(()=>{hasher.setHash(`costs/`);});
		$('.go-to-results-button').click(() => hasher.setHash('results'));

		ccId = Util.getIndicatorId(ccClass);
		indId = Util.getIndicatorId(ccClass + '-' + indClass);


		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		
		const blockTmp = App.generateBlockData();
		// define blocks
		const blocks = blockTmp.blocks;
		const blocksShowing = blockTmp.blocksShowing;
		const blockParents = blockTmp.blockParents;


		// This code addes all of the individual indicators to score (p-1, p-2, p-3, etc)
		function addCoreCapacityTabs() {
			const block = d3.select('.block-container.input-block-container').selectAll('block')
				.data(blocksShowing)
				.enter().append('div')
					.attr('class', (d) =>  {
						return `block ${d.abbr}-block no-reset`;
					});
		};
		addCoreCapacityTabs();

		
		// call function to render the tabs
		App.setupScoresTabs(blocksShowing, blocks, ccClass, blockParents);

		// TODO if previous hash was this CC, don't slide
		if (!App.prevHash) App.prevHash = '';
		const prevHashArr = App.prevHash.split('/');

		if (prevHashArr[0] !== 'costs' || prevHashArr[1] !== ccClass) {
			$(`.${ccClass}-block`).fadeOut(0, function(){$(this).fadeIn();});
		}

		// DEMO show the fake-block html in the AMR example
		// TODO setup the block content dynamically
		const demoScoringHtml = $('.fake-block').html();
		$(`.${ccClass.toLowerCase()}-block`).html(demoScoringHtml);
		$('.fake-block').html('');


		/*
		* updateIndicatorProgress
		* Updates message about how many indicators have been scored for the current
		* core capacity
		*/
		function updateIndicatorProgress() {
			// get name of tab block to use
			const blockSelector = App.getActiveBlockSelector();

			// get active block content
			const block = d3.select(blockSelector);

			const numInds = block.selectAll('.indicator-slot').nodes().length;
			const numScored = block.selectAll('.full').nodes().length;
			block.select('.indicator-progress').text(`${numScored} of ${numInds} indicators costed`);
		};


	    /*
		* setupScoreTabContent
		* Populates each CC's score tab content
		*/
		function setupScoreTabContent() {
			// get name of tab block to use
			const blockSelector = App.getActiveBlockSelector();

			// get active block content
			const block = d3.select(blockSelector);

			// get corresponding CC ID
			const ccIdArr = blockSelector.split('-');
			const ccId = ccIdArr[0][1] + '.' + ccIdArr[1];

			// set title of page to core capacity
			const cc = App.getCoreCapacity(ccId);
			block.select('.core-capacity-name').text(cc.name);
			block.select('.capacity-target').text(cc.target_description);
			block.select('.capacity-desired-impact').text(cc.desired_impact);
            block.select('.capacity-additional-notes').text(cc.notes);

            $('.capacity-description-header').click(()=> {
            	$('.capacity-description-details').toggle();
            	$('#chevron').toggleClass("rotate-chevron");

            });

			// set description of indicator and the score descriptions
			const ind = App.getIndicator(indId);
			$('.indicator-description').text(ind.name);

			// select indicator container that holds the slots
			const indContainer = block.select('.indicator-container');

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
						curSlot.classed(Util.getIndicatorClass(d.jee_id), true);

						// add class 'full' if there's a score defined
						// add class 'empty' otherwise
						const curSlotScore = User.getIndicatorScore(d.jee_id);
						const slotClass = (curSlotScore !== undefined) ? 'full' : 'empty';
						curSlot.classed(slotClass, true);

					})
					.on('click', function(d, i) {
						hasher.setHash(`costs/${ccClass}/${i+1}`);
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

			// add button to edit score
			indSlots.append('div')
				.attr('class', 'indicator-edit-score-button')
				.text('Edit Score')
				.on('click', (d) => {
					d3.event.stopPropagation();
					hasher.setHash(`scores/${ccClass}/${indClass}`);
				});

			// set number of indicators scored and total number
			updateIndicatorProgress();
		};
		setupScoreTabContent();

		/*
		 * Set up list of actions for user to choose from
		 */
		function setupActionContent() {
			const ind = App.getIndicator(indId);

			d3.select('.action-headers').selectAll('.action-header')
				.data(ind.questions)  // TODO using questions right now
				.enter().append('div')
					.attr('class', 'action-header')
					.text(d => d.name.slice(0, 20))
					.on('click', (d) => {
						showItemBlocks(d);
					});
		}
		setupActionContent();

		function showItemBlocks(action) {
			const moneyFormat = d3.format('$.3s');

			let items = d3.select('.item-block-container').selectAll('.item-block')
				.data([action]);  // TODO needs to be line items for action
			items.exit().remove();

			// add HTML structure to each new item
			const newItems = items.enter().append('div')
				.attr('class', 'item-block');
			newItems.append('div').attr('class', 'item-title');
			newItems.append('div').attr('class', 'item-cost');
			newItems.append('div')
				.attr('class', 'item-select-button')
				.text('Select');
			newItems.append('div').attr('class', 'item-description');
			const itemFooters = newItems.append('div').attr('class', 'item-footer');
			itemFooters.append('div')
				.attr('class', 'item-edit-cost-button')
				.text('Edit Item Cost');
			itemFooters.append('div')
				.attr('class', 'item-view-details-button')
				.text('View Details');

			items = newItems.merge(items);
			items.select('.item-title').text('Item Title');
			items.select('.item-cost').text(moneyFormat(45e3));
			items.select('.item-select-button').on('click', (d) => {
				// user selects an action
			});
			items.select('.item-description').text('Description text...');
		}
		showItemBlocks(App.getIndicator(indId).questions);  // TODO need to change this
		

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
			const indsCount = d3.select(`.${ccClass}-block`).selectAll('.indicator-slot').nodes().length;
			if (parseInt(indClass) === indsCount) {
				if (ccClass === 'r-5' && indClass === '5') {
					// no-op
				}
				else if (parseInt(ccClass[2]) === nextHash[ccClass[0]].max) {
					hasher.setHash(`costs/${nextHash[ccClass[0]].next}-1/${1}`);
				}
				else {
					hasher.setHash(`costs/${ccClass[0]}-${parseInt(ccClass[2])+1}/${1}`);
				}
			} else {
				hasher.setHash(`costs/${ccClass}/${parseInt(indClass) + 1}`);
			}
		});

        d3.select('.previous-cost').on('click', function () {
             const indsCount = d3.select(`.${ccClass}-block`).selectAll('.indicator-slot').nodes().length;
            //if (parseInt(indClass) === indsCount) {
            if (ccClass === 'p-1' && indClass === '1') {
                // no-op
            }
            else if (ccClass[0] !== 'p' && (parseInt(ccClass[2]) === 1 && parseInt(indClass) === 1)) {
                  	// go back one major block (e.g. d-1)
                    let prevClass = nextHash[ccClass[0]].prev + '-' + nextHash[nextHash[ccClass[0]].prev].max;
                    hasher.setHash(`costs/${prevClass}/${1}`);
            } else if (parseInt(indClass) === nextHash[ccClass[0]].min) {
            	// go back one minor block
				  const prevInd = ccClass[0]+'-'+(parseInt(ccClass[2])-1)
                hasher.setHash(`costs/${prevInd}/${1}`);
            }
			else {
            	// go back one indicator

                hasher.setHash(`costs/${ccClass}/${(indClass - 1)}`);
            }

            //} else {
              //  hasher.setHash(`costs/${ccClass}/${parseInt(indClass) + 1}`);
            //}
        });

		// update the hash history
		App.prevHash = hasher.getHash();
	};

	/*
	* getActiveBlockSelector
	* Returns the active block selector for the score page
	*/
	App.getActiveBlockSelector = () => {
		return '.' + d3.select('.block-link.active').attr('block-name') + '-block';
	};
})();
