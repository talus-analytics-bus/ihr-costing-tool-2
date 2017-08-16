(() => {
	App.buildTabNavigation = (selector, capId) => {
		const ccId = capId.charAt(0);

		// add a container for each core capacity
		const blockCategories = d3.select(selector).selectAll('.block-link-capacities')
			.data(App.jeeTree)
			.enter().append('div')
				.attr('class', 'block-link-capacities')

		// add the core capacity block link
		const blockHeaders = blockCategories.append('div')
			.attr('class', 'block-link-capabilities-header')
			.classed('active', d => d.active = d.id === ccId)
			.on('click', (d) => {
				const hash = hasher.getHashAsArray();
				hasher.setHash(`${hash[0]}/${d.id}-1`);
			});

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
		const blockLinks = blockCategories.selectAll('.block-link')
			.data(d => d.capacities)
			.enter().append('div')
				.attr('class', 'block-link')
				.style('display', d => d.id.charAt(0) === ccId ? 'block' : 'none')
				.classed('active', d => d.id === capId)
				.on('click', (d) => {
					const hash = hasher.getHashAsArray();
					const capLinkId = d.id.replace('.', '-');
					hasher.setHash(`${hash[0]}/${capLinkId}`);
				});
		blockLinks.append('div')
			.attr('class', 'block-link-title')
			.html(d => d.name);
		blockLinks.append('div').attr('class', 'block-link-cover');
	};
})();
