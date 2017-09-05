(() => {
	App.buildCapacityDescription = (capId) => {
		const cap = App.getCapacity(capId);

		d3.selectAll('.capacity-name').text(`${capId.toUpperCase()} - ${cap.name}`);
		d3.selectAll('.capacity-target').text(cap.target_description);
		if (cap.desired_impact) {
			d3.selectAll('.capacity-desired-impact').text(cap.desired_impact);
		} else {
			d3.selectAll('.capacity-desired-impact-container').style('display', 'none');
		}
		if (cap.notes) {
			d3.selectAll('.capacity-additional-notes').text(cap.notes);
		} else {
			d3.selectAll('.capacity-additional-notes-container').style('display', 'none');
		}

		$('.capacity-description-header').click(() => {
			$('.capacity-description-details').toggle();
			$('#chevron').toggleClass('rotate-chevron');
		});	
	}
})();
