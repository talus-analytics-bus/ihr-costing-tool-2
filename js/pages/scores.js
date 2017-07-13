(() => {
	App.initScores = () => {
		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		// define blocks
		const blocks = {
		  "p1": {},
		  "p2": {},
		  "p3": {},
		  "p4": {},
		  "p5": {},
		  "p6": {},
		  "p7": {}
		}

		// define blocksShowing
		const blocksShowing = [
		  {
		    "abbr": "p1",
		    "name": "National Legislation, Policy, and Financing",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p2",
		    "name": "IHR Coordination, Communication and Advocacy",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p3",
		    "name": "Antimicrobial Resistance (AMR)",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p4",
		    "name": "Zoonotic Disease",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p5",
		    "name": "Food Safety",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p6",
		    "name": "Biosafety and Biosecurity",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "p7",
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
		$('.p3-block').html(demoScoringHtml);
		$('.fake-block').html('');

		/*
		* updateIndicatorScore
		* Updates the score in the summary box whenever an indicator's
		* score is changed.
		*/
		updateIndicatorScore = (indClass) => {
			// get current indicator score selection
			const newScore = $('input:checked').val();
			const indSlot = d3.select(`.indicator-slot.${indClass}`);

			console.log(newScore)
			if (newScore !== undefined) {
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
		};

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

			// TODO update indicator score in User
			// TODO do this dynamically based on indicator ID
			updateIndicatorScore(Util.getIndicatorClass('P.3.3'));

			// TODO update indicator score in summary table above, with animation
			// TODO update whether next button is blue or gray
			// TODO update whether the core capacity is completely scored
			// TODO update whether all indicators are completely scored

		});
	};
})();