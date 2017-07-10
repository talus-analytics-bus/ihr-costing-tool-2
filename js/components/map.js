(() => {
  App.createCountryMap = () => {
    var zoom = d3.zoom()
        .scaleExtent([1, 9])
        .on("zoom", move);

    const mapContainer = d3.select('.map-container');

    let width = 700;
    var height = width / 2;
    var topo,projection,path,svg,g;
    var graticule = d3.geoGraticule();
    var tooltip = mapContainer.append("div").attr("class", "tooltip hidden");
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
        .append("g");

    // add blue background (ocean)
    svg.append('rect')
      .attr('width',width)
      .attr('height',height)
      .style('fill','#A3C3D8');

      g = svg.append("g")
             .on("click", click);

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

      svg.append("path")
       .datum(graticule)
       .attr("class", "graticule")
       .attr("d", path);

      g.append("path")
       .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
       .attr("class", "equator")
       .attr("d", path);


      var country = g.selectAll(".country").data(topo);

      // add country shapes
      country.enter().insert("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("id", function(d,i) { return d.id; })
          .attr("title", function(d,i) { return d.properties.name; })
          .on('click', countryClick);

      //offsets for tooltips
      var offsetL = mapContainer.offsetLeft+20;
      var offsetT = mapContainer.offsetTop+10;

      //tooltips
      country
        .on("mousemove", function(d,i) {

          var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

          tooltip.classed("hidden", false)
                 .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                 .html(d.properties.name);

          })
          .on("mouseout",  function(d,i) {
            tooltip.classed("hidden", true);
          }); 
    }


    function redraw() {
      height = width / 2;
      d3.select('svg').remove();
      setup(width, height);
      draw(topo);
    }

    const initCountryStrokeWidth = 0.25;
    function move() {

      var t = [d3.event.transform.x,d3.event.transform.y];
      var s = d3.event.transform.k;
      zscale = s;
      var h = height/4;

      t[0] = Math.min(
        (width/height)  * (s - 1), 
        Math.max( width * (1 - s), t[0] )
      );

      t[1] = Math.min(
        h * (s - 1) + h * s, 
        Math.max(height  * (1 - s) - h * s, t[1])
      );

      g.attr("transform", "translate(" + t + ")scale(" + s + ")");

      //adjust the country hover stroke width based on zoom level
      d3.selectAll(".country").style("stroke-width", initCountryStrokeWidth / s); // assumes init s is = 1.189207115002721
    }

    // select country on click
    function click() {
      // clicked
      // if country is not selected,
      // rmv selected from all other countries
      // class country selected

      // if country is selected,
      // rmv selected from this country

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

    //function to add points and text to the map (used in plotting capitals)
    function addpoint(lon,lat,text) {

      var gpoint = g.append("g").attr("class", "gpoint");
      var x = projection([lon,lat])[0];
      var y = projection([lon,lat])[1];

      gpoint.append("svg:circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("class","point")
            .attr("r", 1.5);

      //conditional in case a point has no associated text
      if(text.length>0){

        gpoint.append("text")
              .attr("x", x+2)
              .attr("y", y+2)
              .attr("class","text")
              .text(text);
      }
    }  
  };
})();