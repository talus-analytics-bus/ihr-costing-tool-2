(() => {

	App.geoJson = {};

	App.createLeafletMap = () => {

		const accessToken = 'pk.eyJ1IjoibXZhbm1hZWxlIiwiYSI6ImNpeWx0ZnZzYTAwM2YzMmw3cTYwdGt1ejIifQ.Ja_TgAIXRhED-PXg8XXHVg';
		// const accessToken = 'pk.eyJ1Ijoibmljb2xhaXZhc3F1ZXoiLCJhIjoiY2o2MWNlaWk3MG5ycTJ3bndmZWs4NWFyNSJ9.h0XBCKm965_UoB4oRS_3eA';
		const urlLang = {
			en: 'https://api.mapbox.com/styles/v1/mvanmaele/cjhi7ddzm08p12sne2e1jsms7/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibXZhbm1hZWxlIiwiYSI6ImNpeWx0ZnZzYTAwM2YzMmw3cTYwdGt1ejIifQ.Ja_TgAIXRhED-PXg8XXHVg',
			fr: 'https://api.mapbox.com/styles/v1/mvanmaele/cjhi7eqd71ob62rped5yb63yy/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibXZhbm1hZWxlIiwiYSI6ImNpeWx0ZnZzYTAwM2YzMmw3cTYwdGt1ejIifQ.Ja_TgAIXRhED-PXg8XXHVg',
		};
		const attrLang = {
			en: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
			fr: 'Données cartographiques &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributeurs, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagerie © <a href="http://mapbox.com">Mapbox</a>',
		};
		App.mapConfig = {
			divId: 'leaflet-map',
			view: {
				coordinates: [20, 0],
				zoom: 2,
			},
			url: urlLang[App.lang],
			options: {
				attribution: attrLang[App.lang],
				maxZoom: 8,
				minZoom: 2,
				id: 'mapbox.light',
				accessToken,
			},
			styles: {
				default: {
					stroke: true,
					weight: 0,
					fill: true,
					color: 'transparent',
				},
				active: {
					fillColor: '#ff7a7a',
				},
				selected: {
					fillColor: '#dd0000',
					weight: 1,
					color: '#333',
				}
			}
		};


		let map, info, activeCountry = '';

		const initMap = () => {
			map = L.map(App.mapConfig.divId, { zoomSnap: 0.1 })
				.setView(App.mapConfig.view.coordinates, App.mapConfig.view.zoom);

			L.tileLayer(App.mapConfig.url, App.mapConfig.options).addTo(map);

			info = L.control({ position: 'topright' })
				.setPosition('topright');

			info.onAdd = function (map) {
				this._div = L.DomUtil.create('div', 'info');
				this.update();
				return this._div;
			};

			info.update = function (props) {
				this._div.innerHTML = props && props.name ? `<p>${props.name}</p>` : '';
			};

		};

		const highlightFeature = (e) => {
			const layer = e.target;

			if (activeCountry !== layer.feature.properties.iso_a2) {
				layer.setStyle(App.mapConfig.styles.active);

				//info.update(layer.feature.properties);
			}
		}

		const resetHighlight = (e) => {
			const layer = e.target;
			if (activeCountry !== e.target.feature.properties.iso_a2) {
				App.geoJson.resetStyle(e.target);
				info.update();
			}
		}

		const selectFeature = (e) => {
			const abbreviation = e.target.feature.properties.iso_a2;

			if (abbreviation === activeCountry) {
				activeCountry = '';
				App.geoJson.resetStyle(e.target);
				App.whoAmI = {};
				return;
			}
			activeCountry = abbreviation;

			App.geoJson.eachLayer((layer) => {
				if (abbreviation === layer.feature.properties.iso_a2) {
					layer.setStyle(App.mapConfig.styles.selected);
				} else {
					App.geoJson.resetStyle(layer);
				}
			});

			App.updateCountry(abbreviation);
		}

		const featureEventHandlers = (feature, layer) => {
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: selectFeature,
			});

			// check if country has already been selected
			if (App.whoAmI.hasOwnProperty('abbreviation') && App.whoAmI.abbreviation === layer.feature.properties.iso_a2) {
				layer.setStyle(App.mapConfig.styles.selected);
				activeCountry = App.whoAmI.abbreviation;

			}
		}

		const renderMap = () => {
			$.getJSON('data/custom.geo.json', (data) => {
				App.geoJson = L.geoJson(data, {
					style: App.mapConfig.styles.default,
					onEachFeature: featureEventHandlers,
				}).addTo(map);
			});

			info.addTo(map);
			info.setPosition('topright');
		}

		// wrap in timeout to make sure that dom element is already present
		setTimeout(() => {
			initMap();
			renderMap();
		}, 100);

		return map;
	}
})();
