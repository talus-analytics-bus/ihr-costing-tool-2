(() => {
	App.initCosting = (capClass, indClass) => {
		const capId = Util.getIndicatorId(capClass);
		const indId = Util.getIndicatorId(capClass + '-' + indClass);

		const capacity = App.getCapacity(capId);
		const indicator = App.getIndicator(indId);
		const actions = App.getNeededActions(indicator);

		$('.go-to-results-button').click(() => hasher.setHash('results'));


		/* --------------- Input Block Overview and Links -------------- */		
		function buildContent() {
			App.buildTabNavigation('.block-link-container', capId, {
				displayCostingProgress: true,
			});
			buildCapacityDescription();
			buildIndicatorContent();
			if (actions.length) showAction(actions[0]);
			attachNextButtonBehavior();
		}


		// add the capacity description content
		function buildCapacityDescription() {
			const pageLang = App.lang === 'fr' ? 'capacity-description-fr' : 'capacity-description';
			$('.capacity-description-container').html(Routing.templates[pageLang]());
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
			// update number of indicators complete, and indicator description
			updateIndicatorProgress();

			// add indicators to slots
			const indSlotContainers = d3.select('.indicator-container').selectAll('.indicator-slot-container')
				.data(capacity.indicators)
				.enter().append('div')
					.attr('class', 'indicator-slot-container');
			const indSlots = indSlotContainers.append('div')
				.attr('class', 'indicator-slot')
				.classed('active', d => d.id === indId)
				.classed('empty', d => typeof App.getIndicatorScore(d.id) === 'undefined')
				.on('click', (d, i) => {
					hasher.setHash(`costs/${capClass}/${i+1}`);
				});

			// add arrow
			const chevron = indSlots.append('svg')
				.attr('class', 'chevron')
				.classed('active', d => d.id === indId)
				.attr('viewBox', '0 0 24 24');
			chevron.append('path').attr('d', 'M8 5v14l11-7z');

			// add indicator name
			indSlots.append('div')
				.attr('class', 'indicator-id')
				.text(d => `${d.id.toUpperCase()} - `);
			indSlots.append('div')
				.attr('class', 'indicator-name')
				.text(d => Util.truncateText(d.name));

			// add indicator score
			const scoreContainer = indSlots.append('div')
				.attr('class', 'indicator-score')
				.html((d) => {
					const score = App.getIndicatorScore(d.id);
					if (!score) return '<i>No Score</i>';

					const targetScore = (User.targetScoreType === 'step') ? score + 1 : User.targetScore;
					let scoreStr = `<img class="rp-score" src="img/rp-${score}.png" alt=${score} />`;
					if (targetScore > score && score < 4) {
						scoreStr += (App.lang === 'fr' ? '<span> à </span>' : '<span> to </span>') +
							`<img class="rp-score" src="img/rp-${targetScore}.png" alt=${targetScore} />`;
					}
					return scoreStr;
				});

			// add description
			$('.indicator-description').html(`${indId.toUpperCase()} - ${indicator.name}`);

			// get the indicator that the user is on
			const indSlotContainer = indSlotContainers.filter(d => d.id === indId);

			// if indicator doesn't have a score, provide link for user to score
			if (!indicator.score) {
				indSlotContainer.append('div')
					.attr('class', 'no-score-container')
					.html(App.lang === 'fr' ? '' : 'Cet indicateur n\'a pas encore été noté. Cliquez <u>ici</u> pour entrer un score.')
					.on('click', () => {
						hasher.setHash(`scores/${capClass}/${indClass}`);
					});
				$('.action-description-container').hide();
				return;
			}

			// if no actions (bc score is 4 or 5), display text saying so
			if (!actions.length) {
				let noActionText = App.lang === 'fr' ? 'Aucune action n\'est requise pour augmenter le score actuel de cet indicateur' : 'There are no actions needed to increase the current score for this indicator';
				if (indicator.score === 4) {
					noActionText = App.lang === 'fr' ? 'Les coûts pour passer du score 4 au score 5 sont très spécifiques au pays et ne sont pas inclus dans l\'outil d\'évaluation des coûts du RSI.' : 'Costs to increase from score <b>4</b> to <b>5</b> are highly country-specific and are not included in the IHR Costing Tool.';
				} else if (indicator.score === 5) {
					noActionText = App.lang === 'fr' ? 'Les indicateurs avec un score de 5 ne nécessitent pas de coûts (aucune nouvelle action n\'est requise).' : 'Indicators with a score of <b>5</b> do not require costing (no new actions required).';
				}
				indSlotContainer.append('div')
					.attr('class', 'no-actions-container')
					.html(noActionText);
				$('.action-description-container').hide();
				return;
			}

			// add actions under each indicator
			const actionSlotContainers = indSlotContainer.selectAll('.action-slot')
				.data(actions)
				.enter().append('div')
					.attr('class', 'action-slot-container');
			const actionSlots = actionSlotContainers.append('div')
				.attr('class', 'action-slot')
				.attr('action-id', d => d.id)
				.on('click', d => showAction(d));
			const actionChevron = actionSlots.append('svg')
				.attr('class', 'chevron')
				.attr('viewBox', '0 0 24 24');
			actionChevron.append('path').attr('d', 'M8 5v14l11-7z');
			actionSlots.append('div')
				.attr('class', 'action-name')
				.text(d => `${d.id.toUpperCase()} - ${d.name}`);
			actionSlots.append('div').attr('class', 'action-progress');
			updateActionProgress();

			// build container to put the items
			const itemLeft = '155px';
			const itemOffRight = '800px';
			const itemOffLeft = '-800px';
			const itemContainers = actionSlotContainers.append('div')
				.attr('class', 'item-block-container')
				.each(d => d.itemShownIndex = 0);

			// add arrows for each item block container and progress text
			itemContainers.append('div')
				.attr('class', 'item-block-progress-text')
				.text(d => App.lang === 'fr' ? `Élément 1 sur ${App.getNeededInputs(d.inputs, indicator.score).length}` : `Item 1 of ${App.getNeededInputs(d.inputs, indicator.score).length}`);
			itemContainers.append('div')
				.attr('class', 'item-block-arrow-prev item-block-arrow')
				.style('display', 'none')
				.on('click', function(d) {
					// scroll to previous item
					const $container = $(this).parent();
					$container.find(`.item-block[item-index=${d.itemShownIndex}]`).animate({
						left: itemOffRight,
					});
					d.itemShownIndex--;
					$container.find(`.item-block[item-index=${d.itemShownIndex}]`).animate({
						left: itemLeft,
					});

					// update progress text
					const numItems = App.getNeededInputs(d.inputs, indicator.score).length;
					$container.find('.item-block-progress-text')
						.text(App.lang === 'fr' ? `Élément ${d.itemShownIndex + 1} sur ${App.getNeededInputs(d.inputs, indicator.score).length}` : `Item ${d.itemShownIndex + 1} of ${numItems}`);

					// hide previous button if at beginning
					if (d.itemShownIndex === 0) $(this).hide();

					// show next button
					$container.find('.item-block-arrow-next').show();
				})
				.append('img')
					.attr('src', 'img/prev-arrow.png')
					.attr('alt', 'Previous');
			itemContainers.append('div')
				.attr('class', 'item-block-arrow-next item-block-arrow')
				.style('display', (d) => {
					return App.getNeededInputs(d.inputs, indicator.score).length > 1 ? 'block' : 'none';
				})
				.on('click', function(d) {
					// scroll to next item
					const $container = $(this).parent();
					$container.find(`.item-block[item-index=${d.itemShownIndex}]`).animate({
						left: itemOffLeft,
					});
					d.itemShownIndex++;
					$container.find(`.item-block[item-index=${d.itemShownIndex}]`).animate({
						left: itemLeft,
					});

					// update progress text
					const numItems = App.getNeededInputs(d.inputs, indicator.score).length;
					$container.find('.item-block-progress-text')
						.text(App.lang === 'fr' ? `Élément ${d.itemShownIndex + 1} sur ${App.getNeededInputs(d.inputs, indicator.score).length}` : `Item ${d.itemShownIndex + 1} of ${numItems}`);

					// hide next button if at end
					if (d.itemShownIndex + 1 >= numItems) $(this).hide();

					// show previous button
					$container.find('.item-block-arrow-prev').show();
				})
				.append('img')
					.attr('src', 'img/next-arrow.png')
					.attr('alt', App.lang === 'fr' ? 'Suivant' : 'Next');

			// build the item blocks for each action
			let items = itemContainers.selectAll('.item-block')
				.data(d => App.getNeededInputs(d.inputs, indicator.score))
				.enter().append('div')
					.attr('class', 'item-block')
					.attr('item-index', (d, i) => i)
					.style('left', (d, i) => (i === 0) ? itemLeft : itemOffRight);
			const itemShells = items.append('div').attr('class', 'item-shell');
			const itemFront = itemShells.append('div')
				.attr('class', 'front')
				.append('div')
					.attr('class', 'item-front-shell');
			const itemBack = itemShells.append('div').attr('class', 'back');

			// build the front of the item block
			itemFront.append('div')
				.attr('class', 'item-title-container')
				.append('div')
					.attr('class', 'item-title')
					.text(d => d.name);

			const startupContainer = itemFront.append('div')
				.attr('class', 'item-startup-cost-container');
			startupContainer.append('div')
				.attr('class', 'item-cost-name')
				.text(App.lang === 'fr' ? 'Coût de démarrage: ' : 'Startup Cost: ');
			startupContainer.append('input')
				.attr('class', 'startup-cost-input form-control')
				.attr('value', (d) => {
					const cost = d.isCustomCost ? d.customStartupCost : d.startupCost + d.capitalCost;
					return Util.comma(cost);
				})
				.style('color', d => d.costed ? 'black' : '#999')
				.on('change', function(d) {
					d.isCustomCost = true;
					d.customStartupCost = Util.getInputNumVal(this);
					if (!d.customRecurringCost) d.customRecurringCost = d.recurringCost;

					d.costed = true;
					const $container = $(this).closest('.item-block');
					$container.find('input').css('color', 'black');
					$container.find('.item-save-button').removeClass('primary');
					App.updateAllCosts();
				});
			startupContainer.append('div')
				.attr('class', 'item-cost-currency')
				.text(App.whoAmI.currency_iso);
			startupContainer.append('img')
				.attr('class', 'item-cost-tooltip-img')
				.attr('src', 'img/question-mark.png')
				.each(function addTooltip(d) {
					$(this).tooltipster({ content: App.definitions[App.lang].startupCost });
				});
			
			const recurringContainer = itemFront.append('div')
				.attr('class', 'item-recurring-cost-container');
			recurringContainer.append('div')
				.attr('class', 'item-cost-name')
				.text(App.lang === 'fr' ? 'Coût récurrent: ' : 'Recurring Cost: ');
			recurringContainer.append('input')
				.attr('class', 'recurring-cost-input form-control')
				.attr('value', (d) => {
					const cost = d.isCustomCost ? d.customRecurringCost : d.recurringCost;
					return Util.comma(cost);
				})
				.style('color', d => d.costed ? 'black' : '#999')
				.on('change', function(d) {
					d.isCustomCost = true;
					d.customRecurringCost = Util.getInputNumVal(this);
					if (!d.customStartupCost) d.customStartupCost = d.startupCost + d.capitalCost;

					d.costed = true;
					const $container = $(this).closest('.item-block');
					$container.find('input').css('color', 'black');
					$container.find('.item-save-button').removeClass('primary');
					App.updateAllCosts();
				});
			recurringContainer.append('div')
				.attr('class', 'item-cost-currency')
				.text(App.lang === 'fr' ? `${App.whoAmI.currency_iso}/an` : `${App.whoAmI.currency_iso}/yr`);
			recurringContainer.append('img')
				.attr('class', 'item-cost-tooltip-img')
				.attr('src', 'img/question-mark.png')
				.each(function addTooltip(d) {
					$(this).tooltipster({ content: App.definitions[App.lang].recurringCost });
				});

			itemFront.append('div')
				.attr('class', 'item-save-cost-text')
				.text(App.lang === 'fr' ? 'Sauvegardés!' : 'Costs Saved!');

			const itemFooters = itemFront.append('div').attr('class', 'item-footer');
			itemFooters.append('div')
				.attr('class', 'item-save-button')
				.classed('primary', d => !d.costed)
				.text(App.lang === 'fr' ? 'Sauvegarder les coûts' : 'Save Costs')
				.on('click', function(d) {
					if (true) {
					// if (!d.costed) {
						d.costed = true;
						$(this)
							.removeClass('primary')
							.closest('.item-block').find('input')
								.css('color', 'black');

						// update action progress
						updateActionProgress();

						// check if indicator is fully costed
						const numCosted = App.getNumIndicatorsCosted(capacity);
						d3.select('.block-link-subtitle.active')
							.text(`${numCosted} of ${capacity.indicators.length}`);
					}

					// flash "costs saved!" text
					const saveCostText = $(this).closest('.item-block').find('.item-save-cost-text');
					saveCostText.show();
					setTimeout(() => { saveCostText.fadeOut(800); }, 1000);

					App.updateAllCosts();
				});
			itemFooters.append('div')
				.attr('class', 'item-view-details-button')
				.text(App.lang === 'fr' ? 'Voir les détails' : 'View Details')
				.on('click', function() {
					$(this).closest('.item-block').toggleClass('active');
				});


			// build the back of the card
			const backContent = itemBack.append('div')
				.attr('class', 'item-details-container');

			function buildTableInContent(title, dataFilterFunc) {
				const sBox = backContent.append('div')
					.style('display', (d) => {
						const allLineItems = App.getNeededLineItems(d.line_items, indicator.score);
						const lineItems = allLineItems.filter(dataFilterFunc);
						return lineItems.length ? 'block' : 'none';
					});
				sBox.append('div')
					.attr('class', 'item-details-title')
					.text(title);
				const sTableContainer = sBox.append('div')
					.attr('class', 'line-item-table-container');
				const sTable = sTableContainer.append('table')
					.attr('class', 'line-item-table table table-condensed table-striped')
					.append('tbody');
				const sRows = sTable.selectAll('tr')
					.data((d) => {
						const allLineItems = App.getNeededLineItems(d.line_items, indicator.score);
						return allLineItems.filter(dataFilterFunc);
					})
					.enter().append('tr');
				const sNameCell = sRows.append('td');
				sNameCell.append('span').text(li => li.name);
				sNameCell.append('img')
					.attr('class', 'line-item-description-button')
					.attr('src', 'img/question-mark.png')
					.each(function addTooltipster(d) {
						let contentStr = `<div class="li-tooltip-content">`;
						contentStr += `<b>${d.name}:</b> ${d.description}`;
						contentStr += `</div>`;
						$(this).tooltipster({
							interactive: true,
							trigger: 'hover',
							content: contentStr,
						});
					});
				sRows.append('td').text(li => App.moneyFormatLong(li.cost));

				// add total cost
				const sTotalRow = sTable.append('tr');
				sTotalRow.append('td').text('Total');
				sTotalRow.append('td').text((d) => {
					const allLineItems = App.getNeededLineItems(d.line_items, indicator.score);
					const lineItems = allLineItems.filter(dataFilterFunc);
					return App.moneyFormatLong(d3.sum(lineItems, li => li.cost))
				});

				return sBox;
			}

			// add startup and recurring cost tables
			const sContent = buildTableInContent(App.lang === 'fr' ? 'Coûts de démarrage / d\'investissement par défaut' : 'Default Startup/Capital Costs', (li) => {
				return li.line_item_type === 'start-up' || li.line_item_type === 'capital';
			});
			const rContent = buildTableInContent(App.lang === 'fr' ? 'Coûts récurrents par défaut' : 'Default Recurring Costs', (li) => {
				return li.line_item_type === 'recurring';
			});

			// adjust height of tables if both tables are showing
			d3.selectAll('.item-details-container').each(function adjustTableHeight(d) {
				const allLineItems = App.getNeededLineItems(d.line_items, indicator.score);
				const recurringLi = allLineItems.filter(li => li.line_item_type === 'recurring');
				if (recurringLi.length && recurringLi.length < allLineItems.length) {
					d3.select(this).selectAll('.line-item-table-container')
						.style('height', '57px');
				}
			});

			// add button to return to view of front of card
			backContent.append('div')
				.attr('class', 'item-footer')
				.append('div')
					.attr('class', 'item-return-to-front-button')
					.text(App.lang === 'fr' ? 'Revenir à modifier les coûts' : 'Return to Edit Cost')
					.on('click', function() {
						$(this).closest('.item-block').toggleClass('active');
					});
		}

		function showAction(action) {
			// make the correct action slot active
			d3.selectAll('.action-slot-container, .action-slot')
				.classed('active', d => d.id === action.id)
				.select('.chevron')
					.classed('active', d => d.id === action.id);

			// show correct item container
			const minHeight = '340px';
			$('.action-slot-container:not(.active) .item-block-container')
				.css('height', minHeight)
				.css('min-height', '0px')
				.slideUp(400, function() {
					$(this)
						.css('height', 'auto')
						.css('min-height', minHeight);
				});
			$('.action-slot-container.active .item-block-container')
				.css('height', minHeight)
				.css('min-height', '0px')
				.slideDown(400, function() {
					$(this)
						.css('height', 'auto')
						.css('min-height', minHeight);
				});

			// update descriptions
			if (actions.length) {
				$('.action-description').html(`${action.id.toUpperCase()} - ${action.name}`);
			} else {
				$('.action-description').html('<i>No actions need to be taken to increase the score for this indicator</i>');
			}
		}

		// updates message on how many indicators have been scored
		function updateIndicatorProgress() {
			const numInds = capacity.indicators.length;
			const numScored = App.getNumIndicatorsCosted(capacity);
			d3.select('.indicator-progress')
				.text(App.lang === 'fr' ? `Vérifier les coûts pour chaque indicateur (${numScored} sur ${numInds}) :` : `Review costs for each indicator (${numScored} of ${numInds}):`);
		};

		// updates message on number of inputs scored for each action
		function updateActionProgress() {
			d3.selectAll('.action-progress').text((d) => {
				const inputs = App.getNeededInputs(d.inputs, indicator.score);
				const numInputsCosted = inputs.filter(input => input.costed).length;
				return App.lang === 'fr' ? `${numInputsCosted} sur ${inputs.length} éléments évalués` : `${numInputsCosted} of ${inputs.length} items costed`;
			});
		}

		// define the behavior for the "previous" and "next" button
		function attachNextButtonBehavior() {
			d3.select('.next-cost').on('click', () => {
				const nextInd = App.getNextIndicator(capId, indId)
				if (nextInd === null) {
					hasher.setHash('results');
				} else {
					const nextIndId = nextInd.id;
					const lastDotIndex = nextIndId.lastIndexOf('.');
					const nextCapClass = nextIndId.slice(0, lastDotIndex).replace('.', '-');
					const nextIndClass = nextIndId.slice(lastDotIndex + 1)
					hasher.setHash(`costs/${nextCapClass}/${nextIndClass}`);
				}
			});

			d3.select('.previous-cost').on('click', function() {
				const prevIndId = App.getPrevIndicator(capId, indId).id;
				if (!prevIndId) return;

				const lastDotIndex = prevIndId.lastIndexOf('.');
				const prevCapClass = prevIndId.slice(0, lastDotIndex).replace('.', '-');
				const prevIndClass = prevIndId.slice(lastDotIndex + 1)
				hasher.setHash(`costs/${prevCapClass}/${prevIndClass}`);
			});
		}

		buildContent();
	};
})();
