(() => {

    App.geoJson = {};

    App.createLeafletMap = () => {

        const accessToken = 'pk.eyJ1Ijoibmljb2xhaXZhc3F1ZXoiLCJhIjoiY2o2MWNlaWk3MG5ycTJ3bndmZWs4NWFyNSJ9.h0XBCKm965_UoB4oRS_3eA';
        const mapConfig = {
            divId: 'leaflet-map',
            view: {
                coordinates: [0, 0],
                zoom: 1,
            },
            url: 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
            options: {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                maxZoom: 8,
                minZoom: 1,
                id: 'mapbox.light',
                accessToken,
            },
            styles: {
                default: {
                    stroke: true,
                    weight: 0.4,
                    fill: true,
                    color: '#000',
                    fillColor: '#fff',
                    fillOpacity: 1
                },
                active: {
                    fillColor: '#ff7a7a',
                },
                selected: {
                    fillColor: '#AA0000',
                }
            }
        };



        let map, info, activeCountry = '';

        const initMap = () => {
            map = L.map(mapConfig.divId)
                .setView(mapConfig.view.coordinates, mapConfig.view.zoom);

            L.tileLayer(mapConfig.url, mapConfig.options).addTo(map);

            info = L.control();

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
                layer.setStyle(mapConfig.styles.active);

                //info.update(layer.feature.properties);
                

                layer.bindPopup(layer.feature.properties.name, {closeButton: false, offset: L.point(-60, 0)});
                //layer.openPopup();
            }
        }

        const resetHighlight = (e) => {
            const layer = e.target;
            if (activeCountry !== e.target.feature.properties.iso_a2) {
                App.geoJson.resetStyle(e.target);
                info.update();
                //layer.closePopup();
            }
        }

        const selectFeature = (e) => {
            const abbreviation = e.target.feature.properties.iso_a2;

            if (abbreviation === activeCountry) {
                activeCountry = '';
                App.geoJson.resetStyle(e.target);
                d3.select('.country-dropdown.dropdown > button')
                    .text('Choose country');
                App.whoAmI = {};
                return;
            }
            activeCountry = abbreviation;

            App.geoJson.eachLayer((layer) => {
                if (abbreviation === layer.feature.properties.iso_a2) {
                    layer.setStyle(mapConfig.styles.selected);
                } else {
                    App.geoJson.resetStyle(layer);
                }
            });

            const countryParam = _.findWhere(App.countryParams, {abbreviation});
            d3.select('.country-dropdown.dropdown > button')
                .text(countryParam.name);
            App.whoAmI = JSON.parse(JSON.stringify(countryParam));
            d3.select('.currency-container > button').text(App.currencies[App.whoAmI.currency].name);

        }

        const featureEventHandlers = (feature, layer) => {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: selectFeature,
            });

            // check if country has already been selected
            if (App.whoAmI.hasOwnProperty('abbreviation') && App.whoAmI.abbreviation === layer.feature.properties.iso_a2) {
                layer.setStyle(mapConfig.styles.selected);
                activeCountry = App.whoAmI.abbreviation;

            }
        }

        const renderMap = () => {
            $.getJSON('data/custom.geo.json' , (data) => {
                App.geoJson = L.geoJson(data, {
                    style: mapConfig.styles.default,
                    onEachFeature: featureEventHandlers,
                }).addTo(map);
            });

            info.addTo(map);
        }

        // wrap in timeout to make sure that dom element is already present
        setTimeout(() => {

            initMap();
            renderMap();
        }, 100);
    }
})();