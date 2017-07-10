(() => {
  App.createCountryMap = () => {
    var zoom = d3.zoom()
        .scaleExtent([1, 9])
        .on("zoom", move);

    const mapContainer = d3.select('.map-container');

    let width = 700;
    var height = width / 2;
    var topo,projection,path,svg,g;
    // var tooltip = mapContainer.append("div").attr("class", "tooltip hidden");
    setup(width,height);

    function setup(width,height){
      projection = d3.geoMercator()
        .translate([(width/2), (height/2)])
        .scale( width / 2 / Math.PI)
        .rotate([-11,0]);

      path = d3.geoPath().projection(projection);

      svg = mapContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom)
        .on("dblclick.zoom", null) // disable double-click zooming
        .append("g");

    // add blue background (ocean)
    svg.append('rect')
      .attr('width',width)
      .attr('height',height)
      .attr('class','map-background');

      g = svg.append("g");
    }

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {

          var world = JSON.parse(xhttp.responseText);

          var countries = topojson.feature(world, world.objects.countries).features,
          neighbors = topojson.neighbors(world.objects.countries.geometries);

          topo = countries;
          draw(topo);

        }
    };
    xhttp.open("GET", "data/world-topo-min.json", true);
    xhttp.send();

    function draw(topo) {
      var country = g.selectAll(".country").data(topo);

      // add country shapes
      country.enter().insert("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("id", function(d,i) { return d.id; })
          .attr("title", function(d,i) { return d.properties.name; })
          .on('click', countryClick)
          .each(function(d){
            // add tooltips to country shapes
            $(this).tooltipster({
              trigger: 'hover',
              maxWidth: 600,
              content: d.properties.name,
            });

          });
      // //offsets for tooltips
      // var offsetL = mapContainer.offsetLeft+20;
      // var offsetT = mapContainer.offsetTop+10;

      // //tooltips
      // country
      //   .on("mousemove", function(d,i) {

      //     var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

      //     tooltip.classed("hidden", false)
      //            .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
      //            .html(d.properties.name);

      //     })
      //     .on("mouseout",  function(d,i) {
      //       tooltip.classed("hidden", true);
      //     });

      // add zoom and pan controls group to map
      const zoomRectWidth = 20,
        zoomRectHeight = 48;
      const zoomRectPadding = {top: 40, right: 40}
      const mapControls = svg.append('g')
        .attr('transform', `translate(${width - zoomRectWidth - zoomRectPadding.right}, ${zoomRectPadding.top})`);

      // add zoom controls to the map
      mapControls.append('rect')
        .attr('class','glossy')
        .attr('width', zoomRectWidth)
        .attr('height', zoomRectHeight);
      mapControls.append('image')
        .attr('class', 'plus-icon')
        .attr('x', 2)
        .attr('y', 4)
        .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
        .attr('xlink:href', 'img/map/plus.png')
        .attr('width', 16)
        .attr('height', 16)
        .on('click', function () {
          // zoom in on click
          const curThis = d3.zoomTransform(d3.select('svg').node());
          curThis.k += 0.5;
          move(curThis);
        });
      mapControls.append('image')
        .attr('class', 'minus-icon')
        .attr('x', 2)
        .attr('y', 27)
        .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
        .attr('xlink:href', 'img/map/minus.png')
        .attr('width', 16)
        .attr('height', 16)
        .on('click', function () {
          // zoom out on click
          const curThis = d3.zoomTransform(d3.select('svg').node());
          curThis.k -= 0.5;
          move(curThis);
        });
    }

    // let all country strokes appear to be 0.25px at any zoom level
    const initCountryStrokeWidth = 0.25;

    /*
    * move
    * Translate/scale map whenever pan or zoom occur
    */
    function move(curThis) {
      let t, s;
      if (curThis) {
        t = [curThis.x, curThis.y];
        s = curThis.k;
        console.log(curThis);
      } else {
        console.log(d3.event.transform)
        t = [d3.event.transform.x,d3.event.transform.y];
        s = d3.event.transform.k;
      }

      var h = height / 4;
      zscale = s;

      t[0] = Math.min(
        (width/height)  * (s - 1), 
        Math.max( width * (1 - s), t[0] )
      );

      t[1] = Math.min(
        h * (s - 1) + h * s, 
        Math.max(height  * (1 - s) - h * s, t[1])
      );

      g.attr("transform", "translate(" + t + ")scale(" + s + ")");

      // adjust the country hover stroke width based on zoom level
      d3.selectAll(".country").style("stroke-width", initCountryStrokeWidth / s); // assumes init s is = 1.189207115002721
    }

    /*
    * countryClick
    * When country is clicked, toggle the currently selected country
    */
    function countryClick () {
      const activeClass = "active";
      var alreadyIsActive = d3.select(this).classed(activeClass);
      svg.selectAll(".country")
        .classed(activeClass, false);
      d3.select(this).classed(activeClass, !alreadyIsActive);
    };
  };
})();