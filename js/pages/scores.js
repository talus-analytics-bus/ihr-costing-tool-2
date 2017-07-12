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

		// add functionality to score picker table (click)
		d3.selectAll('.score-row').on('click', function () {
			const curRow = d3.select(this);
			const curInput = curRow.select('input');
			const isChecked = curInput.property('checked');
			d3.selectAll('.score-row').selectAll('input')
				.property('checked', false);
			d3.selectAll('.score-row')
				.classed('active', false);
			curInput.property('checked', !isChecked);
			curRow.classed('active', !isChecked);
		});
	};
})();