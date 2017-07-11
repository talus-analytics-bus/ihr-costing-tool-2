(() => {
  App.createCountryMap = () => {
    var zoom = d3.zoom()
        .scaleExtent([1, 9])
        .on("zoom", move);

    App.zoom = zoom;
    const mapContainer = d3.select('.map-container');

    let width = 600;
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
      const rectWidth = 20,
        zoomRectHeight = 48;
      const zoomRectPadding = {top: 20, right: 20}
      const zoomIconContainer = svg.append('g')
        .attr('transform', `translate(${width - rectWidth - zoomRectPadding.right}, ${zoomRectPadding.top})`);

      // add zoom controls to the map
      zoomIconContainer.append('rect')
        .attr('class','glossy')
        .attr('width', rectWidth)
        .attr('height', zoomRectHeight);
      zoomIconContainer.append('image')
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
          const scaleDiff = (curThis.k + 0.5) / curThis.k;
          if (curThis.k < 1) {
           curThis.k = 1;
           curThis.x = 0; 
           curThis.y = 0;
          }
          else if (curThis.k > 9) {
           curThis.k = 9; 
          }
          else {
            // adjust x and y
          }
          curThis.k += 0.5;
          move(curThis);
        });
      zoomIconContainer.append('image')
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
          if (curThis.k < 1) {
           curThis.k = 1;
           curThis.x = 0; 
           curThis.y = 0; 
          }
          else if (curThis.k > 9) {
           curThis.k = 9; 
          }
          move(curThis);
        });
    
    // // add pan icons
    //   const panIconContainer = svg.append('g')
    //     .attr('transform', `translate(${width - 80}, 100)`);
    //     // .attr('transform', 'translate(' + (width - 75) + ',80)');
    //   const panRectHeight = 20;
    //   panIconContainer.append('rect')
    //     .attr('class', 'glossy')
    //     .attr('width', rectWidth)
    //     .attr('height', panRectHeight)
    //     .attr('x', 20);
    //   panIconContainer.append('rect')
    //     .attr('class', 'glossy')
    //     .attr('width', rectWidth)
    //     .attr('height', panRectHeight)
    //     .attr('y', 20);
    //   panIconContainer.append('rect')
    //     .attr('class', 'glossy')
    //     .attr('width', rectWidth)
    //     .attr('height', panRectHeight)
    //     .attr('x', 40)
    //     .attr('y', 20);
    //   panIconContainer.append('rect')
    //     .attr('class', 'glossy')
    //     .attr('width', rectWidth)
    //     .attr('height', panRectHeight)
    //     .attr('x', 20)
    //     .attr('y', 40);
    //   panIconContainer.append('rect')
    //     .attr('class', 'glossy')
    //     .attr('width', rectWidth)
    //     .attr('height', panRectHeight)
    //     .style('stroke', 'none')
    //     .attr('x', 20)
    //     .attr('y', 20);
    //   panIconContainer.append('image')
    //     .attr('class', 'pan-img')
    //     .attr('x', 23)
    //     .attr('y', 3)
    //     .attr('xlink:href', 'img/map/chevron-up.png')
    //     // .on('dblclick', function() { d3.event.stopPropagation(); })
    //     .on('click', function() { pan(0, 1); });
    //   panIconContainer.append('image')
    //     .attr('class', 'pan-img')
    //     .attr('x', 3)
    //     .attr('y', 23)
    //     .attr('xlink:href', 'img/map/chevron-left.png')
    //     // .on('dblclick', function() { d3.event.stopPropagation(); })
    //     .on('click', function() { pan(1, 0); });
    //   panIconContainer.append('image')
    //     .attr('class', 'pan-img')
    //     .attr('x', 43)
    //     .attr('y', 23)
    //     .attr('xlink:href', 'img/map/chevron-right.png')
    //     // .on('dblclick', function() { d3.event.stopPropagation(); })
    //     .on('click', function() {pan(-1, 0); });
    //   panIconContainer.append('image')
    //     .attr('class', 'pan-img')
    //     .attr('x', 23)
    //     .attr('y', 43)
    //     .attr('xlink:href', 'img/map/chevron-down.png')
    //     // .on('dblclick', function() { d3.event.stopPropagation(); })
    //     .on('click', function() { pan(0, -1); });

    //     $('.pan-img').attr('width', '14').attr('height', '14'); // firefox fix
    }

    // function pan(dx, dy) {
    //   // pan on click
    //   const curThis = d3.zoomTransform(d3.select('svg').node());
    //   curThis.x += dx*100;
    //   curThis.y += dy*100;
    //   move(curThis);      
    // };

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
      } else {
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

      // if was already active, change dropdown menu selection to "Select country"
      if (!alreadyIsActive) {
        d3.select(this).each(function(d){
          // get country params data that matches code
          const countryParam = _.findWhere(App.countryParams, {abbreviation: d.properties.code});
          d3.select('.country-dropdown.dropdown > button')
            .text(countryParam.name);
        });
      } else {
        d3.select('.country-dropdown.dropdown > button')
            .text('Choose country');
      }
      // else, change dropdown menu selection to current country name

    };
  };
})();