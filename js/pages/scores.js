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
			d3.select('.block-container.input-block-container').selectAll('block')
				.data(blocksShowing)
				.enter().append('div')
					.attr('class', (d) =>  {
						return `block ${d.abbr}-block no-reset`;
					});
		};
		addCoreCapacityTabs();
		
		// call function to render the tabs
		App.setupTabs(blocksShowing, blocks);


	};
})();