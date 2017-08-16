(() => {
	App.initScores = (ccClass, indClass) => {


		ccId = Util.getIndicatorId(ccClass);
		indId = Util.getIndicatorId(ccClass + '-' + indClass);

		// // DEMO set scores for first and second indicators for AMR
		// User.setIndicatorScore('p.3.1', 1);
		// User.setIndicatorScore('p.3.2', 2);

		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		
		const blockTmp = App.generateBlockData();
		// define blocks
		const blocks = blockTmp.blocks;
		const blocksShowing = blockTmp.blocksShowing;
		const blockParents = blockTmp.blockParents;

		// This code addes all of the individual indicators to score (p-1, p-2, p-3, etc)
		addCoreCapacityTabs = () => {
			const block = d3.select('.block-container.input-block-container').selectAll('block')
				.data(blocksShowing)
				.enter().append('div')
					.attr('class', (d) =>  {
						return `block ${d.abbr}-block no-reset`;
					});
		};
		addCoreCapacityTabs();

		// style the scores page by adding gradient definition
		styleScores = () => {
			const slotGradient = d3.select('body').append('linearGradient')
				.attr('class','indicator-slot-gradient')
				.attr('x1',322.44)
				.attr('y1',51.62)
				.attr('x2',322.44)
				.attr('gradientUnits','userSpaceOnUse');

			slotGradient.append('stop')
				.attr('offset','0')
				.attr('stop-color','#e6e7e8');
				
			slotGradient.append('stop')
				.attr('offset','1')
				.attr('stop-color','#fff');
		};
		styleScores();
		
		// call function to render the tabs
		App.setupScoresTabs(blocksShowing, blocks, ccClass, blockParents);

		// TODO if previous hash was this CC, don't slide
		if (!App.prevHash) App.prevHash = '';
		const prevHashArr = App.prevHash.split('/');

		if (prevHashArr[0] !== 'scores' || prevHashArr[1] !== ccClass) {
			$(`.${ccClass}-block`).fadeOut(0, function(){$(this).fadeIn();});
		}

		// DEMO show the fake-block html in the AMR example
		// TODO setup the block content dynamically
		const demoScoringHtml = $('.fake-block').html();
		$(`.${ccClass.toLowerCase()}-block`).html(demoScoringHtml);
		$('.fake-block').html('');

		/*
		* updateIndicatorScore
		* Updates the score in the summary box whenever an indicator's
		* score is changed.
		*/
		updateIndicatorScore = (indId, newScore) => {
			// get indicator class for selection
			// const indClass = Util.getIndicatorClass(indId);

			// get current indicator score selection
			const indSlot = d3.select(`.indicator-slot.${ccClass}-${indClass}`);

			if (newScore === undefined) newScore = '';
			if (newScore !== '') {
				// if score is number, set to number
				indSlot.select('.indicator-score')
					.text(newScore);
				// add full
				// remove empty
				indSlot
					.classed('full', true)
					.classed('empty', false);

			} else {
				// if score is 'no score', set to 'No score'
				indSlot.select('.indicator-score')
					.text('No score');

				// add empty
				// remove full
				indSlot
					.classed('full', false)
					.classed('empty', true);
			}

			// flash the indicator slot the appropriate color
			const animationDuration = 250; // msec
            const indicatorFlashColor = "#ffe0b2";
            $(`.indicator-slot.${ccClass}-${indClass}`).css('background','none');
            $(`.indicator-slot.${ccClass}-${indClass}`).animate({
                'background-color': indicatorFlashColor
            }, animationDuration, function() {
                $(`.indicator-slot.${ccClass}-${indClass}`).animate({
                    'background-color': 'none'
                }, animationDuration, function() {
                    // Animation complete.
                    $(`.indicator-slot.${ccClass}-${indClass}`).css('background','');

                });
            });
		};

		/*
		* getNewIndicatorScore
		* Gets what the indicator score is currently set to on an
		* indicator's score page
		*/
		getNewIndicatorScore = () => {
			return $('input:checked').val();
		};

		/*
		* updateIndicatorProgress
		* Updates message about how many indicators have been scored for the current
		* core capacity
		*/
		updateIndicatorProgress = () => {
			// get name of tab block to use
			const blockSelector = App.getActiveBlockSelector();

			// get active block content
			const block = d3.select(blockSelector);

			const numInds = block.selectAll('.indicator-slot').nodes().length;
			const numScored = block.selectAll('.full').nodes().length;
			block.select('.indicator-progress').text(`${numScored} of ${numInds} indicators scored`);
		};

	    /*
		* setupScoreTabContent
		* Populates each CC's score tab content
		*/
		setupScoreTabContent = () => {
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
			for (let i = 1; i < 6; i++) {
				block.select(`.score-row._${i}`).select('td:nth-child(2)').text(ind.score_descriptions[`${i}`]);
			}

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
						hasher.setHash(`scores/${ccClass}/${i+1}`);
					});

			// add indicator name
			indSlots.append('div')
				.classed('indicator-name', true)
				.text(d => {
					return Util.truncateText(d.name);
				});

			// add indicator score
			indSlots.append('div')
				.classed('indicator-score', true)
				.text(d => d.score || 'No score');

			// set number of indicators scored and total number
			updateIndicatorProgress();

			// set score picker to first unscored indicator OR
			// first indicator if all scored
			const emptySlot = block.select('.empty');
			if (emptySlot.nodes().length > 0 && indClass === undefined) {
				emptySlot.classed('active', true);
			} else {
				if (indClass === undefined) indClass = '1';
				indSlots.data(inds);
				const activeSlot = d3.select(`.indicator-slot.${ccClass}-${indClass}`);
				activeSlot.classed('active', true);
				// if active indicator has score, set that in the score
				// picker
				if (activeSlot.data()[0].score) {
					// get row and input
					const curRow = block.select(`.score-row._${activeSlot.data()[0].score}`);
					const curInput = curRow.select('input');

					// unselect all radio buttons
					d3.selectAll('.score-row').selectAll('input')
						.property('checked', false);

					// deactivate all rows
					d3.selectAll('.score-row')
						.classed('active', false);

					// select the correct radio button and row
					curInput.property('checked', true);
					curRow.classed('active', true);
				}
			}

		};
		setupScoreTabContent();
		
		// add functionality to score picker table (click)
		d3.selectAll('.score-row').on('click', function () {

			// get which row was clicked and its radio button
			const curRow = d3.select(this);
			const curInput = curRow.select('input');

			// get whether radio button was currently selected
			const isChecked = curInput.property('checked');

			// unselect all radio buttons
			d3.selectAll('.score-row').selectAll('input')
				.property('checked', false);

			// deactivate all rows
			d3.selectAll('.score-row')
				.classed('active', false);

			// select the correct radio button and row
			// (if deselecting, rmv the selection)
			curInput.property('checked', !isChecked);
			curRow.classed('active', !isChecked);

			// TODO do this dynamically based on indicator ID
			// TODO update indicator score in User
			const indicatorScore = getNewIndicatorScore();
			User.setIndicatorScore(indId, indicatorScore);

			// TODO update indicator score in summary table above, with animation
			updateIndicatorScore(indId, indicatorScore);

			// update progress message
			updateIndicatorProgress();

			// TODO update whether next button is blue or gray
			// TODO update whether the core capacity is completely scored
			// TODO update whether all indicators are completely scored

		});

		// set titles for table cells to be equal to their text so
		// the space can be reserved
		d3.selectAll('td').each(function(){d3.select(this).attr('content',d3.select(this).text());});

		// set function for next button
		const nextHash = {
			'p': {next: 'd', prev:'p', max: 7, min: 1},
			'd': {next: 'r', prev:'p', max: 4, min: 1},
			'r': {next: 'r', prev:'d', max: 5, min: 1}
		};
		d3.select('.next-score').on('click', function () {
			const indsCount = d3.select(`.${ccClass}-block`).selectAll('.indicator-slot').nodes().length;
			if (parseInt(indClass) === indsCount) {
				if (ccClass === 'r-5' && indClass === '5') {
					// no-op
				}
				else if (parseInt(ccClass[2]) === nextHash[ccClass[0]].max) {
					hasher.setHash(`scores/${nextHash[ccClass[0]].next}-1/${1}`);
				}
				else {
					hasher.setHash(`scores/${ccClass[0]}-${parseInt(ccClass[2])+1}/${1}`);
				}
			} else {
				hasher.setHash(`scores/${ccClass}/${parseInt(indClass) + 1}`);
			}
		});

        d3.select('.previous-score').on('click', function () {
             const indsCount = d3.select(`.${ccClass}-block`).selectAll('.indicator-slot').nodes().length;
            //if (parseInt(indClass) === indsCount) {
            if (ccClass === 'p-1' && indClass === '1') {
                // no-op
            }
            else if (ccClass[0] !== 'p' && (parseInt(ccClass[2]) === 1 && parseInt(indClass) === 1)) {
                  	// go back one major block (e.g. d-1)
                    let prevClass = nextHash[ccClass[0]].prev + '-' + nextHash[nextHash[ccClass[0]].prev].max;
                    hasher.setHash(`scores/${prevClass}/${1}`);
            } else if (parseInt(indClass) === nextHash[ccClass[0]].min) {
            	// go back one minor block
				  const prevInd = ccClass[0]+'-'+(parseInt(ccClass[2])-1)
                hasher.setHash(`scores/${prevInd}/${1}`);
            }
			else {
            	// go back one indicator

                hasher.setHash(`scores/${ccClass}/${(indClass - 1)}`);
            }

            //} else {
              //  hasher.setHash(`scores/${ccClass}/${parseInt(indClass) + 1}`);
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