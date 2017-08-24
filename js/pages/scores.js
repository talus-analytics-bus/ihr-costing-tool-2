(() => {
	App.initScores = (capClass, indClass) => {
		const capId = Util.getIndicatorId(capClass).toLowerCase();
		const indId = Util.getIndicatorId(capClass + '-' + indClass).toLowerCase();

		const capacity = App.getCapacity(capId);
		const indicator = App.getIndicator(indId);


		/* --------------- Input Block Overview and Links -------------- */		
		function buildContent() {
			App.buildTabNavigation('.block-link-container', capId, {
				includeScoreBars: true,
			});
			buildCapacityDescription();
			buildIndicatorContent();
			buildScorePickerTable();
			attachNextButtonBehavior();
		}


		// add the capacity description content
		function buildCapacityDescription() {
			$('.capacity-description-container').html(Routing.templates['capacity-description']());
			App.buildCapacityDescription(capId);
		}

		// build the indicator tabs
		function buildIndicatorContent() {
			// update number of indicators complete
			updateIndicatorProgress();

			// add indicators to slots
			const indSlots = d3.select('.indicator-container').selectAll('.indicator-slot')
				.data(capacity.indicators)
				.enter().append('div')
					.attr('class', 'indicator-slot')
					.classed('active', d => d.id === indId)
					.classed('empty', d => typeof User.getIndicatorScore(d.id) === 'undefined')
					.on('click', (d, i) => {
						hasher.setHash(`scores/${capClass}/${i+1}`);
					});

			// add indicator name
			indSlots.append('div')
				.attr('class', 'indicator-name')
				.text(d => `${d.id.toUpperCase()} - ${Util.truncateText(d.name)}`);

			// add indicator score
			const scoreContainer = indSlots.append('div')
				.attr('class', 'indicator-score');
			scoreContainer.append('span')
				.attr('class', 'score-none')
				.style('display', d => User.getIndicatorScore(d.id) ? 'none' : 'inline')
				.html('<i>No Score</i>');
			for (let i = 1; i <= 5; i++) {
				scoreContainer.append('img')
					.attr('class', `rp-score`)
					.attr('src', `img/rp-${i}.png`)
					.attr('alt', i)
					.attr('score', i)
					.style('display', (d) => {
						return +User.getIndicatorScore(d.id) === i ? 'inline' : 'none';
					});
			}

			// add description
			$('.indicator-description').html(`${indId.toUpperCase()} - ${indicator.name}`);
		}

		// build the score picker table
		function buildScorePickerTable() {
			const ind = App.getIndicator(indId);

			const scoreRows = d3.select('.score-picker-table tbody').selectAll('tr')
				.data(d3.range(1, 6))
				.enter().append('tr')
					.attr('class', 'score-row')
					.on('click', function(d) {
						// deactivate all rows and unselect radio buttons
						d3.selectAll('.score-row')
							.classed('active', false)
							.selectAll('input')
								.property('checked', false);

						// toggle row clicked
						const currRow = d3.select(this);
						const isChecked = currRow.property('checked');
						currRow.classed('active', !isChecked)
							.select('input')
								.property('checked', !isChecked);

						// save user score
						User.setIndicatorScore(indId, d);

						// update score for active indicator
						const scoreContainer = d3.select('.indicator-slot.active .indicator-score');
						scoreContainer.select('.score-none').style('display', 'none');
						scoreContainer.selectAll('img').style('display', function() {
							return (+$(this).attr('score') === +d) ? 'inline' : 'none';
						});

						updateIndicatorProgress();
					});

			scoreRows.append('td').append('input')
				.attr('type', 'radio');

			const scoreLabels = scoreRows.append('td');
			scoreLabels.append('img')
				.attr('class', 'rp-score-table-img rp-score')
				.attr('src', d => `img/rp-${d}.png`);
			scoreLabels.append('span')
				.text(d => App.scoreLabels[d]);

			scoreRows.append('td')
				.attr('class', 'score-description-cell')
				.text(d => ind.score_descriptions[d]);
			scoreRows.append('td');
		};
		
		// updates message on how many indicators have been scored
		function updateIndicatorProgress() {
			const numInds = capacity.indicators.length;
			const numScored = capacity.indicators.filter(ind => ind.score).length;
			d3.select('.indicator-progress')
				.text(`Select a score for each indicator (${numScored} of ${numInds}):`);
		};

		// define the behavior for the "previous" and "next" button
		function attachNextButtonBehavior() {
			d3.select('.next-score').on('click', () => {
				const nextIndId = App.getNextIndicator(capId, indId).id;
				if (!nextIndId) hasher.setHash('costsinstructions');

				const lastDotIndex = nextIndId.lastIndexOf('.');
				const nextCapClass = nextIndId.slice(0, lastDotIndex).replace('.', '-');
				const nextIndClass = nextIndId.slice(lastDotIndex + 1)
				hasher.setHash(`scores/${nextCapClass}/${nextIndClass}`);
			});

			d3.select('.previous-score').on('click', function() {
				const prevIndId = App.getPrevIndicator(capId, indId).id;
				if (!prevIndId) return;

				const lastDotIndex = prevIndId.lastIndexOf('.');
				const prevCapClass = prevIndId.slice(0, lastDotIndex).replace('.', '-');
				const prevIndClass = prevIndId.slice(lastDotIndex + 1)
				hasher.setHash(`scores/${prevCapClass}/${prevIndClass}`);
			});

			$('.go-to-costing-button').click(() => hasher.setHash('costsinstructions'));
		}


		// TODO if previous hash was this CC, don't slide
		if (!App.prevHash) App.prevHash = '';
		const prevHashArr = App.prevHash.split('/');

		if (prevHashArr[0] !== 'scores' || prevHashArr[1] !== capClass) {
			//$(`.${capClass}-block`).fadeOut(0, function(){$(this).fadeIn();});
		}


		// update the hash history
		App.prevHash = hasher.getHash();

		buildContent();
	};
})();
