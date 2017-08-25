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
			$('.capacity-description-container').html(Routing.templates['capacity-description']());
			App.buildCapacityDescription(capId);
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
				.classed('empty', d => typeof User.getIndicatorScore(d.id) === 'undefined')
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
					const score = User.getIndicatorScore(d.id);
					if (!score) return '<i>No Score</i>';

					const targetScore = (User.targetScoreType === 'step') ? score + 1 : User.targetScore;
					let scoreStr = `<img class="rp-score" src="img/rp-${score}.png" alt=${score} />`;
					if (targetScore > score && score < 5) {
						scoreStr += '<span> to </span>' +
							`<img class="rp-score" src="img/rp-${targetScore}.png" alt=${targetScore} />`;
					}
					return scoreStr;
				});

			// add description
			$('.indicator-description').html(`${indId.toUpperCase()} - ${indicator.name}`);

			// add actions under each indicator
			const actionSlotContainers = indSlotContainers.filter(d => d.id === indId).selectAll('.action-slot')
				.data(actions)
				.enter().append('div')
					.attr('class', 'action-slot-container');
			const actionSlots = actionSlotContainers.append('div')
				.attr('class', 'action-slot')
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
				.text(d => `Item 1 of ${App.getNeededInputs(d.inputs, indicator.score).length}`);
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
						.text(`Item ${d.itemShownIndex + 1} of ${numItems}`);

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
						.text(`Item ${d.itemShownIndex + 1} of ${numItems}`);

					// hide next button if at end
					if (d.itemShownIndex + 1 >= numItems) $(this).hide();

					// show previous button
					$container.find('.item-block-arrow-prev').show();
				})
				.append('img')
					.attr('src', 'img/next-arrow.png')
					.attr('alt', 'Next');

			// add/update the items in the item containers
			let items = itemContainers.selectAll('.item-block')
				.data(d => App.getNeededInputs(d.inputs, indicator.score));
			items.exit().remove();			

			const newItems = items.enter().append('div')
				.attr('class', 'item-block')
				.attr('item-index', (d, i) => i);
			newItems.append('div').attr('class', 'item-title');
			
			const startupContainer = newItems.append('div').attr('class', 'item-startup-cost-container');
			startupContainer.append('div').text('Startup Cost: ');
			startupContainer.append('input').attr('class', 'startup-cost-input form-control');
			startupContainer.append('div').text(App.whoAmI.currency_iso);
			
			const recurringContainer = newItems.append('div').attr('class', 'item-recurring-cost-container');
			recurringContainer.append('div').text('Recurring Cost: ');
			recurringContainer.append('input').attr('class', 'recurring-cost-input form-control');
			recurringContainer.append('div').text(`${App.whoAmI.currency_iso}/yr`);

			const itemFooters = newItems.append('div').attr('class', 'item-footer');
			itemFooters.append('div')
				.attr('class', 'item-save-button')
				.classed('primary', d => !d.costed)
				.text('Save Costs');
			itemFooters.append('div')
				.attr('class', 'item-view-details-button')
				.text('View Details')
				.each(function() {
					$(this).tooltipster({
						theme: 'tooltipster-shadow',
						maxWidth: 400,
						trigger: 'click',
						side: ['top', 'right', 'bottom', 'left'],
					});
				});

			items = newItems.merge(items)
				.style('left', (d, i) => (i === 0) ? itemLeft : itemOffRight);
			items.select('.item-title').text(d => d.name);
			items.select('.startup-cost-input')
				.attr('value', d => Util.comma(d.startupCost + d.capitalCost))
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
			items.select('.recurring-cost-input')
				.attr('value', d => Util.comma(d.recurringCost))
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

			// saving costs
			items.select('.item-save-button').on('click', function(d) {
				if (!d.costed) {
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
				App.updateAllCosts();
			});

			// clicking "view details" show a list of line items
			items.select('.item-view-details-button').each(function(d) {
				const contentContainer = d3.select(document.createElement('div'));
				const content = contentContainer.append('div')
					.attr('class', 'item-details-container');
				
				const lineItems = App.getNeededLineItems(d.line_items, indicator.score);
				const startupItems = lineItems.filter((li) => {
					return li.line_item_type === 'start-up' || li.line_item_type === 'capital';
				});
				const recurringItems = lineItems.filter((li) => {
					return li.line_item_type === 'recurring';
				});

				function buildTableInContent(data, param={}) {
					const startupBox = content.append('div');
					startupBox.append('div')
						.attr('class', 'item-details-title')
						.text(param.title || 'Cost');
					const sTable = startupBox.append('table')
						.attr('class', 'line-item-table table table-condensed table-striped')
						.append('tbody');
					const sRows = sTable.selectAll('tr')
						.data(data)
						.enter().append('tr');
					sRows.append('td').text(li => li.name);
					sRows.append('td').text(li => App.moneyFormat(li.cost));

					// add total cost
					const sTotalRow = sTable.append('tr');
					sTotalRow.append('td').text('Total');
					sTotalRow.append('td').text(App.moneyFormat(d3.sum(data, li => li.cost)));
				}

				// add startup cost table, if any startup costs
				if (startupItems.length) {
					let startupTitle = 'Startup/Capital Costs';
					if (d.isCustomCost) startupTitle = `Default ${startupTitle}`;
					buildTableInContent(startupItems, { title: startupTitle });
				}
				if (recurringItems.length) {
					let recurringTitle = 'Recurring Costs';
					if (d.isCustomCost) recurringTitle = `Default ${recurringTitle}`;
					buildTableInContent(recurringItems, { title: recurringTitle });
				}

				$(this).tooltipster('content', contentContainer.html());
			});
		}

		function showAction(action) {
			// make the correct action slot active
			d3.selectAll('.action-slot-container, .action-slot')
				.classed('active', d => d.id === action.id)
				.select('.chevron')
					.classed('active', d => d.id === action.id);

			// show correct item container
			const minHeight = '310px';
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
				.text(`Review costs for each indicator (${numScored} of ${numInds}):`);
		};

		// updates message on number of inputs scored for each action
		function updateActionProgress() {
			d3.selectAll('.action-progress').text((d) => {
				const numInputsCosted = d.inputs.filter(input => input.costed).length;
				return `${numInputsCosted} of ${d.inputs.length} items costed`;
			});
		}

		// define the behavior for the "previous" and "next" button
		function attachNextButtonBehavior() {
			d3.select('.next-cost').on('click', () => {
				const nextIndId = App.getNextIndicator(capId, indId).id;
				if (!nextIndId) hasher.setHash('results');

				const lastDotIndex = nextIndId.lastIndexOf('.');
				const nextCapClass = nextIndId.slice(0, lastDotIndex).replace('.', '-');
				const nextIndClass = nextIndId.slice(lastDotIndex + 1)
				hasher.setHash(`costs/${nextCapClass}/${nextIndClass}`);
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
