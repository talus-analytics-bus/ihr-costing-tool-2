(() => {
	App.buildTabNavigation = (selector, capId, param={}) => {
		const ccId = capId.split('.')[0];

		// add a container for each core capacity
		const blockCategories = d3.select(selector).selectAll('.block-link-capacities')
			.data(App.jeeTree)
			.enter().append('div')
				.attr('class', 'block-link-capacities');

		// add the core capacity block link
		const blockHeaders = blockCategories.append('div')
			.attr('class', 'block-link-capabilities-header')
			.classed('active', (d) => {
				if (d.name === 'Other') {
					return d.active = !App.normalCcIds.includes(ccId);
				}
				return d.active = d.id === ccId;
			})
			.on('click', (d) => {
				const hash = hasher.getHashAsArray();
				const capLinkId = d.capacities[0].id.replace('.', '-');
				hasher.setHash(`${hash[0]}/${capLinkId}/1`);
			});
		blockHeaders.append('div').attr('class', 'block-link-cover');

		// add the arrow for each core capacity
		const chevron = blockHeaders.append('svg')
			.attr('class', 'chevron')
			.attr('viewBox', '0 0 24 24')
			.classed('active', d => d.active)
			.attr('src', 'img/chevron-right.png');
		chevron.append('path')
			.attr('d', 'M8 5v14l11-7z');

		// add the core capacity name
		blockHeaders.append('span').text(d => d.name);

		// add capacities for each core capacity
		const blockLinkContainer = blockCategories.append('div')
			.style('display', d => d.active ? 'block' : 'none');
		const blockLinks = blockLinkContainer.selectAll('.block-link')
			.data(d => d.capacities)
			.enter().append('div')
				.attr('class', 'block-link')
				.classed('active', d => d.id === capId)
				.on('click', (d) => {
					const hash = hasher.getHashAsArray();
					const capLinkId = d.id.replace('.', '-');
					hasher.setHash(`${hash[0]}/${capLinkId}/1`);
				});
		blockLinks.append('div')
			.attr('class', 'block-link-title')
			.html(d => `${d.id.toUpperCase()} - ${d.name}`);
		blockLinks.append('div')
			.attr('class', 'block-link-subtitle')
			.classed('active', d => d.id === capId)
			.html((d) => {
				if (param.displayCostingProgress) {
					const numCosted = App.getNumIndicatorsCosted(d);
					return `${numCosted} of ${d.indicators.length}`;
				}
				const numScored = d.indicators.filter(ind => ind.score).length;
				return `${numScored} of ${d.indicators.length}`;
			});
		blockLinks.append('div').attr('class', 'block-link-cover');
	};
})();
