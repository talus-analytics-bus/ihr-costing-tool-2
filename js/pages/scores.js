(() => {
	App.initScores = (capClass, indClass) => {
		const capId = Util.getIndicatorId(capClass).toLowerCase();
		const indId = Util.getIndicatorId(capClass + '-' + indClass).toLowerCase();

		const capacity = App.getCapacity(capId);
		const indicator = App.getIndicator(indId);

		App.scoreLabels = App.lang === 'fr' ? {
			1: 'Pas de capacité',
			2: 'Capacité limitée',
			3: 'Capacité développée',
			4: 'Capacité démontrée',
			5: 'Capacité durable',
		} : { 
			1: 'No Capacity',
			2: 'Limited Capacity',
			3: 'Developed Capacity',
			4: 'Demonstrated Capacity',
			5: 'Sustainable Capacity',
		}; 

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
			const langPage = App.lang === 'fr' ? 'capacity-description-fr' : 'capacity-description';
			$('.capacity-description-container').html(Routing.templates[langPage]());
			App.buildCapacityDescription(capId);

			// hard-code tooltip for "Immunization"
			if (capacity.name === 'Immunization') {
				$('.capacity-tooltip-img').show().tooltipster({
					interactive: true,
					content: 'An alternative method to estimate vaccination costs is available using the <a href="http://www.avenirhealth.org/software-onehealth.php" target="_blank">OneHealth Tool</a>',
				});
			}
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
					.classed('empty', d => typeof App.getIndicatorScore(d.id) === 'undefined')
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
				.style('display', d => App.getIndicatorScore(d.id) ? 'none' : 'inline')
				.html(App.lang === 'fr' ? '<i>Pas de score</i>' : '<i>No Score</i>');
			for (let i = 1; i <= 5; i++) {
				scoreContainer.append('img')
					.attr('class', `rp-score`)
					.attr('src', `img/rp-${i}.png`)
					.attr('alt', i)
					.attr('score', i)
					.style('display', (d) => {
						return +App.getIndicatorScore(d.id) === i ? 'inline' : 'none';
					});
			}

			// add description
			$('.indicator-description').html(`${indId.toUpperCase()} - ${indicator.name}`);
		}

		// build the score picker table
		function buildScorePickerTable() {
			const scoreRows = d3.select('.score-picker-table tbody').selectAll('tr')
				.data(d3.range(1, 6))
				.enter().append('tr')
					.attr('class', 'score-row')
					.classed('active', d => d === indicator.score)
					.on('click', function(d) {
						const currRow = d3.select(this);
						const wasChecked = currRow.select('input').property('checked');
						const newScore = wasChecked ? undefined : d;

						// deactivate all rows and unselect radio buttons
						const allRows = d3.selectAll('.score-row')
							.classed('active', false);
						allRows.select('input')
							.property('checked', false);
						allRows.select('.score-description-cell')
							.text((d) => {
								const desc = indicator.score_descriptions[d];
								return desc.length > 300 ? `${desc.slice(0, 300)}...` : desc;
							});

						// toggle row clicked
						currRow.classed('active', !wasChecked)
						currRow.select('input')
							.property('checked', !wasChecked);

						// show full descriptions for active scores
						d3.select('.score-row.active .score-description-cell')
							.text(d => indicator.score_descriptions[d]);

						// save user score
						App.setIndicatorScore(indId, newScore);

						// update score for active indicator
						const scoreContainer = d3.select('.indicator-slot.active .indicator-score');
						if (newScore) {
							scoreContainer.select('.score-none').style('display', 'none');
							scoreContainer.selectAll('img').style('display', function() {
								return (+$(this).attr('score') === +d) ? 'inline' : 'none';
							});
						} else {
							scoreContainer.select('.score-none').style('display', 'inline');
							scoreContainer.selectAll('img').style('display', 'none');
						}

						updateIndicatorProgress();
					});

			scoreRows.append('td').append('input')
				.attr('type', 'radio')
				.property('checked', d => d === indicator.score)
				.on('click', function() {
					// toggle an extra checked to become a... triple toggle!
					$(this).prop('checked', !$(this).prop('checked'));
				});

			const scoreLabels = scoreRows.append('td');
			scoreLabels.append('img')
				.attr('class', 'rp-score-table-img rp-score')
				.attr('src', d => `img/rp-${d}.png`);
			scoreLabels.append('span')
				.attr('class', 'score-label')
				.text(d => App.scoreLabels[d]);

			scoreRows.append('td')
				.attr('class', 'score-description-cell')
				.text((d) => {
					const desc = indicator.score_descriptions[d];
					return desc.length > 300 ? `${desc.slice(0, 300)}...` : desc;
				});
			scoreRows.append('td');
		};
		
		// updates message on how many indicators have been scored
		function updateIndicatorProgress() {
			const numInds = capacity.indicators.length;
			const numScored = capacity.indicators.filter(ind => ind.score).length;
			const selectText = App.lang === 'fr' ? `Sélectionnez un score pour chaque indicateur (${numScored} of ${numInds}) :` : `Select a score for each indicator (${numScored} of ${numInds}):`;
			d3.select('.indicator-progress')
				.text(selectText);

			// update color bar in tab navigation
			d3.select('.block-link-subtitle.active').text(`${numScored} of ${numInds}`);
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
