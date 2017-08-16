(() => {
	/*
	*	App.generateBlockData
	*	Generate block data needed on the scores page
	*/
	App.generateBlockData = () => {
		const blockParents = [
			{ name: "Prevent", capacity: [], key: "p" },
			{ name: "Detect", capacity: [], key: "d" },
			{ name: "Response", capacity: [], key: "r" },
			{ name: "Other", capacity: [], key: "o" }
		];

		const blocks = {};
		const blocksShowing = [];
		for (let i = 0; i < App.jeeTree.length; i++) {
			for (let j = 0; j < App.jeeTree[i].capacities.length; j++) {
				const newBlockShowing = {};
				newBlockShowing.level = 0;
				newBlockShowing.status = "";
				newBlockShowing.name = App.jeeTree[i].capacities[j].name;
				const abbrTmp = App.jeeTree[i].capacities[j].indicators[0].id;
				const abbrTmpArr = abbrTmp.toLowerCase().split('.');
				newBlockShowing.abbr = abbrTmpArr[0] + '-' + abbrTmpArr[1];
				blocksShowing.push(newBlockShowing);
				blocks[newBlockShowing.abbr] = "";

				// this will add the capacities under the major categories
				let bp = blockParents.find(cc => cc.key === abbrTmpArr[0]);
				if (!bp) bp = blockParents.find(cc => cc.name === 'Other');
				bp.capacity.push(newBlockShowing);
			}
		}
		return { blocks, blocksShowing, blockParents };
	}


	App.buildTabNavigation = (selector, ccClass) => {
		const blockTmp = App.generateBlockData();
		// define blocks
		const blocks = blockTmp.blocks;
		const blocksShowing = blockTmp.blocksShowing;
		const blockParents = blockTmp.blockParents;
		
		// call function to render the tabs
		App.setupScoresTabs(blocksShowing, blocks, ccClass, blockParents);
	}


	/*
	*	App.setupScoresTabs
	*	Initializes the tab blocks on the page being
	*	initialized.
	*/
	App.setupScoresTabs = (blocksShowing, blocks, ccClass, blockParents) => {
		// add the major categories to the sidebar
		const blockCategories = d3.select('.block-link-container').selectAll('.block-link-capacities')
			.data(blockParents)
			.enter().append('div')
			.attr('class', 'block-link-capacities');

		blockCategories.append('div')
			.attr('block-link-capacities-name', function(p) { return p.key; })
			.attr('id', function(p) { return p.key; })
			.attr('class', 'block-link-capabilities-header block-link-capabilities-title')
			.html(function(p) { return p.name; });


		var blockLinks = blockCategories.selectAll('.block-link')
			.data(function(d, i) {return d.capacity})
			.enter().append('div')
				.attr('class', 'block-link')
				.attr('level', p => p.level)
				.classed('children-showing', p => { if (p.level === 0) return false; })
				.attr('block-name', p => { return p.abbr; })
				.on('click', p => {
					const hash = hasher.getHashAsArray();
					const newHash = [hash[0], p.abbr]
						.concat(hash[0] === 'scores' ? [1] : [])
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
	};

	App.getActiveBlockSelector = () => {
		return '.' + d3.select('.block-link.active').attr('block-name') + '-block';
	};
})();
