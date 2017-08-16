(() => {
	App.buildCapacityDescription = (ccId) => {
		const cc = App.getCoreCapacity(ccId);

		d3.selectAll('.core-capacity-name').text(`${ccId.toUpperCase()} - ${cc.name}`);
		d3.selectAll('.capacity-target').text(cc.target_description);
		d3.selectAll('.capacity-desired-impact').text(cc.desired_impact);
		d3.selectAll('.capacity-additional-notes').text(cc.notes);

		$('.capacity-description-header').click(() => {
			console.log('toggle');
			$('.capacity-description-details').toggle();
			$('#chevron').toggleClass('rotate-chevron');
		});	
	}
})();
