(() => {
	App.initScores = () => {

		// DEMO set scores for first and second indicators for AMR
		User.setIndicatorScore('p.3.1', 1);
		User.setIndicatorScore('p.3.2', 2);

		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		// define blocks
		const blocks = {
		  "p-1": {},
		  "p-2": {},
		  "p-3": {},
		  "p-4": {},
		  "p-5": {},
		  "p-6": {},
		  "p-7": {}
		}

		// define blocksShowing
		const blocksShowing = [
		  {
		    "abbr": "p-1",
		    "name": "National Legislation, Policy, and Financing",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p-2",
		    "name": "IHR Coordination, Communication and Advocacy",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p-3",
		    "name": "Antimicrobial Resistance (AMR)",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p-4",
		    "name": "Zoonotic Disease",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p-5",
		    "name": "Food Safety",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p-6",
		    "name": "Biosafety and Biosecurity",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p-7",
		    "name": "Immunization",
		    "level": 0,
		    "status": ""
		  }
		];

		// TODO add input blocks for each core capacity
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
		App.setupTabs(blocksShowing, blocks);

		// DEMO show the fake-block html in the AMR example
		// TODO setup the block content dynamically
		const demoScoringHtml = $('.fake-block').html();
		$('.p-3-block').html(demoScoringHtml);
		$('.fake-block').html('');

		/*
		* updateIndicatorScore
		* Updates the score in the summary box whenever an indicator's
		* score is changed.
		*/
		updateIndicatorScore = (indId, newScore) => {
			// get indicator class for selection
			const indClass = Util.getIndicatorClass(indId);

			// get current indicator score selection
			const indSlot = d3.select(`.indicator-slot.${indClass}`);

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
			const flashColor = Colors.scoreColors[newScore];
			$('.indicator-slot.p-3-3').css('background','none');
			$('.indicator-slot.p-3-3').animate({
				'background-color': flashColor
			}, animationDuration, function() {
				$('.indicator-slot.p-3-3').animate({
					'background-color': 'none'
				}, animationDuration, function() {
				    // Animation complete.
				    $('.indicator-slot.p-3-3').css('background','');

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

					});

			// add indicator name
			indSlots.append('div')
				.classed('indicator-name', true)
				.text(d => Util.truncateText(d.name));

			// add indicator score
			indSlots.append('div')
				.classed('indicator-score', true)
				.text(d => d.score || 'No score');

			// set number of indicators scored and total number
			updateIndicatorProgress();

			// set score picker to first unscored indicator OR
			// first indicator if all scored
			const emptySlot = block.select('.empty');
			if (emptySlot.nodes().length > 0) {
				emptySlot.classed('active', true);
			} else {
				indSlots.data(inds);
				const activeSlot = d3.select('.indicator-slot');
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
			User.setIndicatorScore('P.3.3', indicatorScore);

			// TODO update indicator score in summary table above, with animation
			updateIndicatorScore('P.3.3', indicatorScore);

			// update progress message
			updateIndicatorProgress();

			// TODO update whether next button is blue or gray
			// TODO update whether the core capacity is completely scored
			// TODO update whether all indicators are completely scored

		});

		// set titles for table cells to be equal to their text so
		// the space can be reserved
		d3.selectAll('td').each(function(){d3.select(this).attr('content',d3.select(this).text());});
	};

	/*
	* getActiveBlockSelector
	* Returns the active block selector for the score page
	*/
	App.getActiveBlockSelector = () => {
		return '.' + d3.select('.block-link.active').attr('block-name') + '-block';
	};
})();