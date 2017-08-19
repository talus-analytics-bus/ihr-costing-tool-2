(() => {

    App.geoJson = {};

    const accessToken = 'pk.eyJ1Ijoibmljb2xhaXZhc3F1ZXoiLCJhIjoiY2o2MWNlaWk3MG5ycTJ3bndmZWs4NWFyNSJ9.h0XBCKm965_UoB4oRS_3eA';

    App.mapConfig = {
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

    App.createLeafletMap = () => {

        let map, info, activeCountry = '';

        const initMap = () => {
            map = L.map(App.mapConfig.divId)
                .setView(App.mapConfig.view.coordinates, App.mapConfig.view.zoom);

            const mapRect = document.getElementById(App.mapConfig.divId).getBoundingClientRect();

            // this will show tooltip relative to cursor and map div
            const showInfoTooltip = (e, div) => {

                const xOffset = () => div.getBoundingClientRect().width / -2;

                const right = (ev) => {
                    return mapRect.right - ev.clientX + xOffset();
                }

                const top = (ev) => {
                    const offset = 30;
                    const pos = ev.clientY - mapRect.top
                    return pos + (pos >= offset ? -1 : 1) * offset;
                }

                $(div).css('right', right(e));
                $(div).css('top', top(e));
            }

            L.tileLayer(App.mapConfig.url, App.mapConfig.options).addTo(map);

            info = L.control();

            info.onAdd = function () {
                this._div = L.DomUtil.create('div', 'info');

                $(this._div).css('position', 'absolute');
                $(this._div).css('z-index', '1000');
                $(this._div).css('min-width', '100px');
                $(this._div).css('text-align', 'center');
                $(this._div).css('pointer-events', 'none');
                // this.update();
                return this._div;
            };

            info.update = function (props, event) {

                this._div.innerHTML = props && props.name ? `<p>${props.name}</p>` : '';

                // follow the cursor
                if (event) {
                    showInfoTooltip(event, this._div);
                }
            };

        };

        const showTooltip = (e) => {
            info.update(e.target.feature.properties, e.originalEvent)
        }

        const highlightFeature = (e) => {
            const layer = e.target;

            if (activeCountry !== layer.feature.properties.iso_a2) {
                layer.setStyle(App.mapConfig.styles.active);

                // info.update(layer.feature.properties, layer);
            }
        }

        const resetHighlight = (e) => {
            const layer = e.target;

            if (activeCountry !== layer.feature.properties.iso_a2) {
                App.geoJson.resetStyle(layer);
                info.update();
            }
        }

        const selectFeature = (e) => {
            const abbreviation = e.target.feature.properties.iso_a2;

            // if active country is same as selected country, then we deselect
            if (abbreviation === activeCountry) {
                activeCountry = '';
                App.geoJson.resetStyle(e.target);
                d3.select('.country-dropdown.dropdown > button')
                    .text('Choose country');
                App.whoAmI = {};
                return;
            }
            activeCountry = abbreviation;

            // apply selected styling to selected country
            App.geoJson.eachLayer((layer) => {
                if (abbreviation === layer.feature.properties.iso_a2) {
                    layer.setStyle(App.mapConfig.styles.selected);
                } else {
                    App.geoJson.resetStyle(layer);
                }
            });

            // assign selected country to dropdown
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
                mousemove: showTooltip,
                click: selectFeature,
            });

            // check if country has already been selected
            if (App.whoAmI.hasOwnProperty('abbreviation') && App.whoAmI.abbreviation === layer.feature.properties.iso_a2) {
                layer.setStyle(App.mapConfig.styles.selected);
                activeCountry = App.whoAmI.abbreviation;

            }
        }

        const renderMap = () => {
            $.getJSON('data/custom.geo.json' , (data) => {
                App.geoJson = L.geoJson(data, {
                    style: App.mapConfig.styles.default,
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