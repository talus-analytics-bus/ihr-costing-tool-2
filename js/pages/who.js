(() => {
	App.initWho = (ccClass) => {

		/*Initialize country picker map*/
		App.createCountryMap();
		switch(ccClass) {
            case 'currency':
                initCurrencyTab();
                break;
            case 'pop-dist':
                initPopDistTab();
                break;
            default:
                initCountryTab();
        }

		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		// define blocks
		const blocks = {
		  "country": {},
		  "currency": {},
		  "pop-dist": {}
		}

		// define blocksShowing
		const blocksShowing = [
		  {
		    "abbr": "country",
		    "name": "Country",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "currency",
		    "name": "Currency",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "pop-dist",
		    "name": "Population and Districts",
		    "level": 0,
		    "status": ""
		  }
		];

		// call function to render the tabs
		App.setupWhoTabs(blocksShowing, blocks, ccClass);
	};

    hasCountrySelected = () => App.whoAmI.hasOwnProperty('currency');
    hasCurrencySelected = () => App.whoAmI.selectedCurrency && App.whoAmI.selectedCurrency.hasOwnProperty('name');

	/*
	*	initCountryTab
	*	Initialize the country picker dropdown on the country tab in Who Am I?
	*/
	initCountryTab = () => {
		if (App.whoAmI.hasOwnProperty('name')) {
            d3.select('.country-dropdown.dropdown > button')
                .text(App.whoAmI.name);
		}

		d3.select('.country-dropdown.dropdown-menu').selectAll('.country-option')
			.data(App.countryParams)
			.enter()
				.append('a')
					.attr('class','country-option dropdown-item')
					.text(function(d) { return d.name})
					.on('click', function (d) {
						d3.select('.country-dropdown.dropdown > button').text(d.name);
						countryDropdownToggle(d.abbreviation);
						App.whoAmI = JSON.parse(JSON.stringify(d));
					});

        // wrap in timeout to make sure that dom element is already present
        setTimeout(() => {

            const map = L.map('leaflet-map')
                .setView([0, 0], 1);

            const accessToken = 'pk.eyJ1Ijoibmljb2xhaXZhc3F1ZXoiLCJhIjoiY2o2MWNlaWk3MG5ycTJ3bndmZWs4NWFyNSJ9.h0XBCKm965_UoB4oRS_3eA';

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                maxZoom: 8,
                minZoom: 1,
                id: 'mapbox.light',
                accessToken,
            }).addTo(map);

            const info = L.control();

            info.onAdd = function (map) {
                this._div = L.DomUtil.create('div', 'info');
                this.update();
                return this._div;
            }

            info.update = function (props) {
                this._div.innerHTML = props && props.name ? `<p>${props.name}</p>` : '';
            }

            let geoJson;
            const customStyle = {
                stroke: true,
                weight: 0.4,
                fill: true,
                color: '#000',
                fillColor: '#fff',
                fillOpacity: 1
            };
            let activeCountry = '';
            const highlightFeature = (e) => {
                const layer = e.target;

                layer.setStyle({
                    fillColor: '#ff7a7a',
                });

                info.update(layer.feature.properties);
            }
            const resetHighlight = (e) => {
                geoJson.resetStyle(e.target);
                info.update();
            }
            const selectFeature = (e) => {
                const layer = e.target;
                const abbreviation = layer.feature.properties.iso_a2;
                if (abbreviation === activeCountry) {
                    activeCountry = '';
                    geoJson.resetStyle(layer);
                    d3.select('.country-dropdown.dropdown > button')
                        .text('Choose country');
                    App.whoAmI = {};
                    return;
                }
                activeCountry = abbreviation;

                layer.setStyle({
                    fillColor: 'red',
                });
                const countryParam = _.findWhere(App.countryParams, {abbreviation});
                d3.select('.country-dropdown.dropdown > button')
                    .text(countryParam.name);
                App.whoAmI = JSON.parse(JSON.stringify(countryParam));
            }
            const featureEventHandlers = (feature, layer) => {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: selectFeature,
                });
            }

            $.getJSON('/data/custom.geo.json' , (data) => {
                geoJson = L.geoJson(data, {
                    style: customStyle,
                    onEachFeature: featureEventHandlers,
                }).addTo(map);
            });

            info.addTo(map);
        }, 100);

	};

	initCurrencyTab = () => {
	    // transforms currency object and adds code that matches with the original currencies.json key
	    const currencyObj = (key, obj) => Object.assign({}, obj, {
	        code: key,
        });

	    const changeDropdownLabel = (name) => {
            d3.select('.currency__container > button').text(name);
        }

	    // transform currencies object into array
        const currenciesArray = Object.keys(App.currencies)
            .map((key) => currencyObj(key, App.currencies[key]));

        // if country is selected and no currency has been selected yet, select matching country currency as default
        if (hasCountrySelected() && !hasCurrencySelected()) {
            App.whoAmI.selectedCurrency = App.currencies[App.whoAmI.currency] ? currencyObj(App.whoAmI.currency, App.currencies[App.whoAmI.currency]) : {};
        }

        // if there is selected currency, mark it as selected
        if (hasCurrencySelected()) {
            changeDropdownLabel(App.whoAmI.selectedCurrency.name);
        }

	    // prepare currency dropdown
        d3.select('.currency__container__dropdown.dropdown-menu')
            .selectAll('.currency-option')
            .data(currenciesArray)
            .enter()
                .append('a')
                .attr('class', 'currency-option dropdown-item')
                .text((d) => d.name)
                .on('click', (d) => {
                    changeDropdownLabel(d.name);
                    App.whoAmI.selectedCurrency = d;
                })
    }

    initPopDistTab = () => {
        const jeeTreeFieldMapping = {
            'basic_info.population': 'population',
            'basic_info.level_1_areas.area_name': 'adm-org-1',
            'basic_info.level_1_areas.area_count': 'adm-org-1-count',
            'basic_info.level_2_areas.area_name': 'adm-org-2',
            'basic_info.level_2_areas.area_count': 'adm-org-2-count',
            'basic_info.level_3_areas.area_name': 'adm-org-3',
            'basic_info.level_3_areas.area_count': 'adm-org-3-count',
            'basic_info.level_4_areas.area_name': 'adm-org-4',
            'basic_info.level_4_areas.area_count': 'adm-org-4-count',
            'advanced_info.national_health_care_facilities_count': 'hcf',
            'advanced_info.staff.national_epi_count': 'epi',
            'advanced_info.staff.national_chw_count': 'chw',
        };

        const getJeeTreeValue = (keyString, jeeTreeObj) => {
            return keyString.split('.')
                .reduce((objVal, currKey) => {
                    return objVal.hasOwnProperty(currKey) ? objVal[currKey] : {};
                }, jeeTreeObj);
        }

        const setKeyTreeValue = (keyString, jeeTreeObj, newVal) => {
            const isValidNestedKey = keyString.split('.')
                .reduce((acc, currKey) => {
                    if (acc.val) {
                        if (acc.obj.hasOwnProperty(currKey)) {
                            return Object.assign({}, acc, {
                                obj: acc.obj[currKey],
                            });
                        }
                        return {
                            obj: {},
                            val: false,
                        }
                    }
                    return acc;
                }, {
                    obj: jeeTreeObj,
                    val: true,
                });

            if (isValidNestedKey.val) {
                // TODO: change this
                const exp = `jeeTreeObj.${keyString} = ${newVal}`;

                eval(exp);
            }
        }

        // set default values if country is selected
        if (hasCountrySelected()) {
            Object.keys(jeeTreeFieldMapping)
                .forEach((keyString) => {
                    $(`#${jeeTreeFieldMapping[keyString]}`).val(getJeeTreeValue(keyString, App.whoAmI));
                });
        }

        // change jeetree values
        const changeValue = _.debounce(setKeyTreeValue, 1000);
        const invertedMapping = _.invert(jeeTreeFieldMapping);
        $('#pop-dist input').on('keyup', (ev) => {
            const id = $(ev.target).attr('id');

            changeValue(invertedMapping[id], App.whoAmI, ev.target.value);
        });

    }

	/*
	*	countryDropdownToggle
	*	Set the map's active country to the dropdown selection
	*/
	countryDropdownToggle = (countryCode) => {
		d3.selectAll(".country")
        	.classed('active', false);
		d3.selectAll('.country')
			.each(function(d){
				if (d.properties.code === countryCode) {
					d3.select(this).classed('active',true);
				}
			});
	};
})();