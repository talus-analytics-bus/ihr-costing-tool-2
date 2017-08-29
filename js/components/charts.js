const Charts = {};

(() => {
	Charts.buildProgressChart = (selector, data, param={}) => {
		const margin = { top: 35, right: 5, bottom: 35, left: 5 };
		const width = param.width || 700;
		const height = param.height || 36;
		const chartContainer = d3.selectAll(selector).append('svg')
			.classed('progress-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const circleRadius = param.radius || 9;
		const rectHeight = param.rectHeight || height / 2;

		const x = d3.scaleLinear()
			.domain([0, 5])
			.range([0, width]);

		// add glow definitions to svg
		const defs = chartContainer.append('defs');
		const filter = defs.append('filter')
			.attr('id', 'blur');
		filter.append('feGaussianBlur')
			.attr('in', 'SourceGraphic')
			.attr('stdDeviation', '1');
		const pattern = defs.append('pattern')
			.attr('id', 'diagonalHatch')
			.attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 4)
			.attr('height', 4);
		pattern.append('rect')
			.attr('x', -1)
			.attr('y', -1)
			.attr('width', 6)
			.attr('height', 6)
			.attr('fill', 'white')
			.attr('stroke', 'none');
		pattern.append('path')
			.attr('d', 'M-1,1 l2,-2, M0,4 l4,-4, M3,5 l2,-2')
			.attr('stroke', 'black')
			.attr('stroke-width', 0.5);

		// draw rectangles
		const rectData = [
			{ x0: 0, x1: 1, color: 'rgb(200, 33, 39)' },
			{ x0: 1, x1: 3, color: 'rgb(247, 236, 19)' },
			{ x0: 3, x1: 5, color: 'rgb(21, 108, 55)' }
		];
		chart.selectAll('.color-bar')
			.data(rectData)
			.enter().append('rect')
				.attr('class', 'color-bar')
				.attr('x', d => x(d.x0))
				.attr('width', d => x(d.x1) - x(d.x0))
				.attr('height', height)
				.style('fill', d => d.color)
				.attr('filter', 'url(#blur)');

		// draw base and ticks
		chart.append('rect')
			.attr('class', 'base')
			.attr('width', width)
			.attr('height', height);

		// add bars
		chart.append('rect')
			.attr('class', 'bar bar-0')
			.attr('x', x(0))
			.attr('y', (height - rectHeight) / 2)
			.attr('width', x(data[0]) - x(0))
			.attr('height', rectHeight);
		chart.append('rect')
			.attr('class', 'bar bar-1')
			.attr('x', x(data[0]))
			.attr('y', (height - rectHeight) / 2)
			.attr('width', x(data[1]) - x(data[0]))
			.attr('height', rectHeight)
			.style('fill', 'url(#diagonalHatch)');

		// add markers
		chart.append('circle')
			.attr('class', 'marker marker-0')
			.attr('cx', x(data[0]))
			.attr('cy', height / 2)
			.attr('r', circleRadius);
		chart.append('circle')
			.attr('class', 'marker marker-1')
			.attr('cx', x(data[1]))
			.attr('cy', height / 2)
			.attr('r', circleRadius);

		// add labels
		chart.append('line')
			.attr('class', 'label-line')
			.attr('x1', x(data[0]))
			.attr('x2', x(data[0]))
			.attr('y1', -10)
			.attr('y2', (height / 2) - circleRadius);
		chart.append('text')
			.attr('class', 'label-text')
			.attr('x', x(data[0]))
			.attr('y', -21)
			.attr('dy', '.35em')
			.text('Old Score');
		chart.append('line')
			.attr('class', 'label-line')
			.attr('x1', x(data[1]))
			.attr('x2', x(data[1]))
			.attr('y1', height + 10)
			.attr('y2', (height / 2) + circleRadius);
		chart.append('text')
			.attr('class', 'label-text')
			.attr('x', x(data[1]))
			.attr('y', height + 21)
			.attr('dy', '.35em')
			.text('New Score')

		return chart;
	}

	Charts.buildCostChart = (selector, data, param={}) => {
		const margin = { top: 60, right: 30, bottom: 60, left: 95 };
		const width = 580;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// add clip path
		const defs = chartContainer.append('defs');
		const chartClip = defs.append('clipPath').attr('id', 'chart-clip');
		chartClip.append('rect')
			.attr('y', -margin.top)
			.attr('width', width + margin.right)
			.attr('height', height + margin.top);
		const chartBody = chart.append('g')
			.attr('clip-path', 'url(#chart-clip)');

		// define scales
		const x = d3.scaleBand()
			.domain(data.map(d => d.capId.toUpperCase()))
			.range([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);
		const bandwidth = x.bandwidth();

		// additional scales
		const colorScale = d3.scaleLinear()
			.domain([0, width])
			.range(['rgba(255,0,0,0.5)', 'rgba(0,66,118,0.5)']);
		const radiusScale = d3.scaleLinear()
			.domain([height, 0])
			.range([5, 25]);

		// define axes
		const xAxis = d3.axisBottom(x);
		const yAxis = d3.axisLeft()
			.ticks(7)
			.tickFormat((num) => {
				return (num === 0) ? '0' : d3.format(',.3s')(num);
			});

		// add axes
		chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis);
		const yAxisG = chart.append('g')
			.attr('class', 'y axis');

		// add axes labels
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', height + 50)
			.text('Capacity ID');
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('transform', 'rotate(-90)')
			.attr('x', -height / 2)
			.attr('y', -80)
			.text(`Startup Cost (in ${App.whoAmI.currency_iso})`);


		// update function
		chart.updateData = (newData) => {
			// define scales
			y.domain([0, 1.1 * d3.max(newData, d => d.startupCost)]);
			yAxis.scale(y);
			yAxisG.call(yAxis);

			// add a circle for each indicator
			const indBlobs = chartBody.selectAll('.indicator-blob')
				.data(newData);
			indBlobs.exit().remove();
			indBlobs.enter().append('circle')
				.attr('class', 'indicator-blob')
				.attr('r', d => radiusScale(y(d.startupCost)))
				.each(function() {
					$(this).tooltipster({ maxWidth: 400, content: '' });
				})
				.merge(indBlobs).transition()
					.attr('cx', (d) => {
						const xVal = x(d.capId.toUpperCase()) + bandwidth / 2;
						const jitter = (bandwidth / 2) * (Math.random() - 0.5);
						return xVal + jitter;
					})
					.attr('cy', d => y(d.startupCost))
					.style('fill', d => colorScale(x(d.capId.toUpperCase())))
					.each(function(d, i) {
						const capacity = App.getCapacity(d.capId);
						$(this).tooltipster('content',
							'<div class="cc-tooltip">' +
								`<div class="cc-tooltip-title">${capacity.name}</div>` +
								`<div class="cc-tooltip-subtitle">${d.name}</div>` +
								'<div class="cc-tooltip-block">' +
									`<div>${App.moneyFormat(d.startupCost)}</div>` +
									`<div>Startup Cost</div>` +
								'</div>' +
								'<div class="cc-tooltip-block">' +
									`<div>${App.moneyFormat(d.capitalCost)}</div>` +
									`<div>Capital Cost</div>` +
								'</div>' +
								'<div class="cc-tooltip-block">' +
									`<div>${App.moneyFormat(d.recurringCost)}/yr</div>` +
									`<div>Recurring Cost</div>` +
								'</div>' +
							'</div>');
					});
		};

		chart.updateData(data);
		return chart;
	}

	Charts.buildBubblePack = (selector, data, param={}) => {
		// setup svg
		const margin = { top: 60, right: 30, bottom: 60, left: 95 };
		const width = 580;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// Based loosely from this D3 bubble graph https://bl.ocks.org/mbostock/4063269
	// And this Forced directed diagram https://bl.ocks.org/mbostock/4062045
	/*eslint-disable indent*/
	data = [{
		cat: 'library', name: 'D3', value: 30,
		icon: 'img/d3.svg',
		desc: `
			D3.js (or just D3 for Data-Driven Documents) is a JavaScript library for
			producing dynamic, interactive data visualizations in web browsers.
			It makes use of the widely implemented SVG, HTML5, and CSS standards.<br>
			This infographic you are viewing is made with D3.
		`
	}, {
		cat: 'library', name: 'Raphaël', value: 10,
		icon: 'img/raphael.svg',
		desc: `
			Raphaël is a cross-browser JavaScript library that draws Vector graphics for web sites.
			It will use SVG for most browsers, but will use VML for older versions of Internet Explorer.
		`
	}, {
		cat: 'library', name: 'Relay', value: 70,
		icon: 'img/relay.svg',
		desc: `
			A JavaScript framework for building data-driven React applications.
			It uses GraphQL as the query language to exchange data between app and server efficiently.
			Queries live next to the views that rely on them, so you can easily reason
			about your app. Relay aggregates queries into efficient network requests to fetch only what you need.
		`
	}, {
		cat: 'library', name: 'Three.js', value: 40,
		icon: 'img/threejs.png',
		desc: `
			Three.js allows the creation of GPU-accelerated 3D animations using
			the JavaScript language as part of a website without relying on
			proprietary browser plugins. This is possible thanks to the advent of WebGL.
		`
	}, {
		cat: 'library sub', name: 'Lodash', value: 30,
		icon: 'img/lodash.svg',
		desc: `
			Lodash is a JavaScript library which provides <strong>utility functions</strong> for
			common programming tasks using the functional programming paradigm.`
	}, {
		cat: 'library sub', name: 'Moment JS', value: 30,
		icon: 'img/momentjs.png',
		desc: `
			Handy and resourceful JavaScript library to parse, validate, manipulate, and display dates and times.
		`
	}, {
		cat: 'library sub', name: 'Numeral.js', value: 20,
		icon: 'Numeral.js',
		desc: `
			A javascript library for formatting and manipulating numbers.
		`
	}, {
		cat: 'library sub', name: 'Redux', value: 80,
		icon: 'img/redux.svg',
		desc: `
			Redux is an open-source JavaScript library designed for managing
			application state. It is primarily used together with React for building user interfaces.
			Redux is inspired by Facebook’s Flux and influenced by functional programming language Elm.
		`
	}, {
		cat: 'framework', name: 'Angular 2.0', value: 30,
		icon: 'img/angular2.svg',
		desc: `
			Angular (commonly referred to as 'Angular 2+' or 'Angular 2') is a TypeScript-based
			open-source front-end web application platform led by the Angular Team at Google and
			by a community of individuals and corporations to address all of the parts of the
			developer's workflow while building complex web applications.
		`
	}, /*{
		cat: 'framework', name: 'Trails.JS', value: 10,
		icon: '',
	},*/
	{
		cat: 'framework', name: 'Bootstrap CSS', value: 50,
		icon: 'img/bootstrap.svg',
		desc: `
			Bootstrap is a free and open-source front-end web framework for designing websites
			and web applications. It contains HTML-and CSS-based design templates for typography,
			forms, buttons, navigation and other interface components, as well as optional JavaScript extensions.
		`
		}, {
			cat: 'framework', name: 'Ember JS', value: 10,
			icon: 'img/ember.png',
			desc: `
			Ember.js is an open-source JavaScript web framework, based on the Model–view–viewmodel
			(MVVM) pattern. It allows developers to create scalable single-page web applications by
			incorporating common idioms and best practices into the framework.
		`
		}, {
			cat: 'framework', name: 'ExpressJS', value: 30,
			icon: 'img/expressjs.png',
			desc: `
			Express.js, or simply Express, is a JavaScript framework designed for building web applications and APIs.
			It is the de facto server framework for Node.js.
		`
		}, /*{
		cat: 'framework', name: 'Foundation', value: 10,
		icon: '',
	},*/										{
			cat: 'framework', name: 'Hexo', value: 50,
			icon: 'img/hexo.png',
			desc: `
			A fast, simple & powerful blog-aware <strong>static website</strong> generator, powered by Node.js.
		`
		}, {
			cat: 'framework', name: 'ReactJS', value: 100,
			icon: 'img/react.png',
			desc: `
			React (sometimes written React.js or ReactJS) is an open-source JavaScript framework maintained by Facebook for building user interfaces.
			React processes only user interface in applications and can be used in combination with other JavaScript libraries
			or frameworks such as Redux, Flux, Backbone...
		`
		}, /*{
		cat: 'framework', name: 'SenchaTouch', value: 10,
		icon: '',
	},*/ 										{
			cat: 'tooling', name: 'Atom', value: 10,
			icon: 'img/atom.png',
			desc: `
			Atom is a free and open-source text and source code editor for macOS, Linux, and Windows with support
			for plug-ins written in Node.js, and embedded Git Control, developed by GitHub.
			Atom is a desktop application built using web technologies.
		`
		}, {
			cat: 'tooling', name: 'Google Chrome & Devtool', value: 70,
			icon: 'img/chrome-devtools.svg',
			desc: `
			<strong>Web development tools (devtool)</strong> allow web developers to test and debug their code.
			At Nau, we use the one come with Google Chrome to debug our apps. It is one the the most powerful
			and sophisticated devtool available.
		`
		}, {
			cat: 'tooling', name: 'Jenkins CI', value: 30,
			icon: 'img/jenkins.png',
			desc: `
			Jenkins is an open source automation server. Jenkins helps to automate the non-human part of
			the whole software development process, with now common things like continuous integration,
			but by further empowering teams to implement the technical part of a Continuous Delivery.
		`
		}, {
			cat: 'tooling', name: 'Sublime Text 3', value: 100,
			icon: 'img/sublimetext.png',
			desc: `
			Sublime Text 3 is a powerful and cross-platform source code editor. It is well-known for
			introducing the concept of multi-cursor and lots of text editing command. Besides, its
			plugin ecosystem is very rich which allows enhancing productivity to the fullest.
		`
		}, {
			cat: 'tooling', name: 'Visual Studio Code', value: 50,
			icon: 'img/vscode.png',
			desc: `
			Visual Studio Code is a cross-platform source code editor developed by Microsoft.
			It includes support for debugging, embedded Git control, syntax highlighting,
			intelligent code completion, snippets, and code refactoring. Its extensions eco system is
			growing quickly and it is becoming the best Front End editors out there.
		`
		}, {
			cat: 'tooling', name: 'Performance Tooling', value: 30,
			icon: 'Performance;Tooling',
			desc: `
			At Nau, web performance is our top priority when development web sites and applications.
			We're practicing code optimization and Front End delivery optimization from day 1.
			To measure the resuslts, we use several tools to audit and benchmark our applications,
			including (but not limit to): Chrome devtool timeline & audit, Google PageSpeed Insights, Web Page Test, Website Grader...
		`
		}, {
			cat: 'tooling', name: 'Yeoman generator for Nau Workflow', value: 20,
			icon: 'img/yeoman.png',
			desc: `
			Yeoman is an open source, command-line interface set of tools mainly used to generate
			structure and scaffolding for new projects, especially in JavaScript and Node.js.
			At Nau, we have developed a Yeoman generator that help quickly set up new projects aligned with
			Nau's conventions and standards.
		`
		}, {
			cat: 'tooling', name: 'live-server', value: 30,
			icon: 'live-server',
			desc: `
			A Node.js-based developer web server for quickly test apps and web pages with some
			magic of 'auto-reload' on the browser.
		`
		}, {
			cat: 'tooling', name: 'PostCSS', value: 30,
			icon: 'img/postcss.svg',
			desc: `
			PostCSS is a software development tool that uses JavaScript-based plugins to automate routine CSS operations.<br>
			We use PostCSS mainly for auto-vendor-prefixing, but very soon we'll use it for NextCSS compilation.
		`
		}, {
			cat: 'backend', name: 'Elastic Search', value: 10,
			icon: 'Elastic;Search',
			desc: `
			A specialized database software for high performance search queries.
		`
		}, {
		cat: 'backend', name: 'Keystone CMS', value: 50,
		icon: 'img/keystonejs.png',
		desc: `
			The de-facto CMS system for website built with Node.js. It can be compared with
			Wordpress of PHP language.
		`
		}, {
			cat: 'backend', name: 'KoaJS', value: 10,
			icon: 'img/koajs.png',
			desc: `
				The advanced and improved version of ExpressJS, with leaner middlewares architecture
				thanks to the avent of ES6 generators.
			`
		}, {
			cat: 'backend', name: 'Loopback', value: 30,
			icon: 'img/loopback.svg',
			desc: `
				Powerful API-focused web framework built for Node.js. It feature easy to use configurations
				and auto API documentation page.
			`
		}, {
			cat: 'backend', name: 'Restify', value: 20,
			icon: 'img/restify.png',
			desc: `
				High performance API development framework, built for Node.js. It has some convenient wrapper
				to automatically generate admin backoffice site and API documentation page.
			`
		}, {
			cat: 'backend', name: 'MongoDB', value: 70,
			icon: 'img/mongodb.png',
			desc: `
				The de-facto Database solution for JavaScript and Node.js applications. It is a light weight,
				high performance NoSQL database and can be used for small and large websites.
			`
		}, {
			cat: 'backend', name: 'NodeJS', value: 100,
			icon: 'img/nodejs.svg',
			desc: `
				Node.js is a cross-platform JavaScript runtime environment.
				Node.js allows creation of high performance and high concurrency websites with smaller footprint compared to
				other server-side solution. Node.js ecosystem is growing very fast and is trusted by a lot of big companies who
				are adopting it to enhance current products as well as for new ones.
			`
		}, {
			cat: 'platform', name: 'Docker Platform', value: 10,
			icon: 'img/docker.svg',
			desc: `
				Docker is an open-source project that automates the deployment of applications inside software containers.
				At Nau, we're still learning this technology to later facilitate easy web app deployments.
			`
		}, {
			cat: 'platform', name: 'MeteorJS', value: 80,
			icon: 'img/meteor.svg',
			desc: `
				MeteorJS is a free and open-source JavaScript web framework written using Node.js.
				Meteor allows for rapid prototyping and produces cross-platform (Android, iOS, Web) code.
				It integrates with MongoDB and uses the Distributed Data Protocol and a publish–subscribe
				pattern to automatically propagate data changes to clients without requiring the developer
				to write any synchronization code.
			`
		}, {
			cat: 'platform', name: 'Phonegap', value: 50,
			icon: 'img/phonegap.png',
			desc: `
				A platform, library and tool for building hybrid mobile app.
			`
		}, {
			cat: 'platform', name: 'Reaction Commerce', value: 20,
			icon: 'img/reactioncommerce.png',
			desc: `
				Reaction Commerce is the first open source, real-time platform to
				combine the flexibility developers and designers want with the stability
				and support businesses need. ReactionCommerce is based on MeteorJS platform.
			`
		}, {
			cat: 'platform', name: 'ReactNative', value: 10,
			icon: 'img/reactnative.png',
			desc: `
				React Native lets you build mobile apps using only JavaScript.
				It uses the same design as React, letting us compose a rich
				mobile UI from declarative components.
			`
		}, {
			cat: 'platform', name: 'SquareSpace', value: 30,
			icon: 'img/squarespace.svg',
			desc: `
				Squarespace is a SaaS-based content management system-integrated ecommerce-aware website builder and blogging platform.
				At Nau, we have built a website for Squarespace using their low-level API which allowed fully customization
				of the interface and other Front End functionalities.
			`
		}, {
			cat: 'language', name: 'HTML5 & CSS3', value: 100,
			icon: 'img/html5-css3.png',
			desc: `
				The languages of the Web Front End. At Nau, they are in our blood and with them we can build
				world-class websites with any kind of visual effects or designs requested.
			`
		}, {
			cat: 'language', name: 'JavaScript', value: 100,
			icon: 'img/javascript.png',
			desc: `
				JavaScript is the heart of modern Web front end development and essential element of any Single Page
				Applications. In Nau, we invest a good deal in training developers to have good control of this universal language
				and now caplable of developing full stack websites with only JavaScript.
			`
		}, {
			cat: 'language', name: 'CSS Next', value: 10,
			icon: 'img/cssnext.png',
			desc: `
				The CSS language specs of the future but with the help of PostCSS (like Babel for ES6),
				we can use CSS Next today.
			`
		}, {
			cat: 'language', name: 'GraphQL', value: 50,
			icon: 'img/graphql.svg',
			desc: `
				GraphQL is a data query language developed by Facebook publicly released in 2015.
				It provides an alternative to REST and ad-hoc webservice architectures. In combination
				with RelayJS, this combo help us reduce the time to develop web apps for weeks.
			`
		}, {
			cat: 'language', name: 'LESS CSS', value: 20,
			icon: 'img/less.svg',
			desc: `
				A preprocessor language to be compiled to CSS. This language is not as popular nowadays and we
				only use them when requested.
			`
		}, {
			cat: 'language', name: 'SASS (SCSS flavor)', value: 70,
			icon: 'img/sass.png',
			desc: `
				This is our main CSS preprocessor language helping us lay structured foundation to CSS as well
				as assisting on writing more convenient BEM anotations.
			`
		}, {
			cat: 'language', name: 'TypeScript 2', value: 30,
			icon: 'img/typescript.png',
			desc: `
				The strict-typing flavor of ECMAScript, always requires a compiler to compile to vanilla JavaScript
				but the type checking and other syntactical sugar are exceptional. Right now, we only use it for
				Angular 2 projects when needed.
			`
		}, {
			cat: 'workflow', name: 'code.naustud.io', value: 100,
			icon: 'img/naustudio.svg',
			desc: `
				A set of guidelines, presets, configs and stadard documentation for Nau developers.
				Please visit the document site at: <a href='http://code.naustud.io' target='_blank'>code.naustud.io</a>
			`
		}, {
			cat: 'workflow', name: 'Mobile First', value: 100,
			icon: 'Mobile First',
			desc: `
				This is one of our most important principle for web and mobile development.
				More details will be discussed in blog later.
			`
		}, {
			cat: 'workflow', name: 'BabelJS', value: 50,
			icon: 'img/babel.png',
			desc: `
				The de-facto tool to work with ECMAScript 6 and ReactJS nowadays.
			`
		}, /*{
			cat: 'workflow', name: 'Browserify', value: 10,
			icon: '',
		},*/ 										{
			cat: 'workflow', name: 'CSS BEM Notation', value: 70,
			icon: 'CSS BEM Notation',
			desc: `
			Our naming standard for CSS, which enhance collaboration, documentation and reusability of
			CSS rules.
		`
		}, {
			cat: 'workflow', name: 'Front End Code Guide', value: 30,
			icon: 'Front End;Code Guide',
			desc: `
			Based on an existing best practice document for HTML and CSS. We're adopting it as our standards
			and guideline.
		`
		}, {
			cat: 'workflow', name: 'ESLint', value: 20,
			icon: 'img/eslint.svg',
			desc: `
			The tool to check and validate JavaScript code when we develop and prevent potential issues with code.
		`
		}, {
			cat: 'workflow', name: 'Gitflow Workflow', value: 70,
			icon: 'img/gitflow.png',
			desc: `
			Our code version control tool is Git, and Gitflow is one of its workflow standard which
			ensure good collaboration and avoid conflict-resolving efforts. For more info, visit: code.naustud.io
		`
		}, {
			cat: 'workflow', name: 'GulpJS', value: 50,
			icon: 'img/gulp.png',
			desc: `
			GulpJS is a task automation tools written for Node.js. It is among the most popular
			Front End and Node project automation tools nowadays
		`
		}, {
			cat: 'workflow', name: 'Nau Code Styles', value: 50,
			icon: 'Nau Code Styles',
			desc: `
			Based on AirBnB's well-defined JavaScript code styles. Our derivation has some different standards such as
			TAB indentation. This code style has an accompanied ESLint config.
		`
		}, {
			cat: 'workflow', name: 'Stylelint', value: 50,
			icon: 'img/stylelint.svg',
			desc: `
			Our on-stop tool to validate both CSS and SCSS with a set of conventions and guidelines from our best practice.
		`
		}, {
			cat: 'workflow', name: 'SystemJS', value: 20,
			icon: 'SystemJS',
			desc: `
			A module loader library that come along Angular 2. Its use is scarce, however.
		`
		}, {
			cat: 'workflow', name: 'Webpack', value: 30,
			icon: 'img/webpack.svg',
			desc: `
			A module bundler library that is becoming de-facto tool to use in ReactJS or SPA apps nowadays.
		`
		}, {
			cat: 'legacy', name: 'AngularJS 1', value: 10,
			icon: 'img/angular1.png',
			desc: `
			Angular 1. Deprecated
		`
		}, {
		cat: 'legacy', name: 'Backbone', value: 30,
		icon: 'img/backbone.png',
		desc: `
			A Model-View library. Deprecated
		`
		}, {
			cat: 'legacy', name: 'Grunt & Automation Stack', value: 30,
			icon: 'img/grunt.svg',
			desc: `
				Grunt task automation tool. Deprecated
			`
		}, {
			cat: 'legacy', name: 'jQuery', value: 50,
			icon: 'img/jquery.png',
			desc: `
				Deprecated, because <a href='http://youmightnotneedjquery.com/' target='_blank'>youmightnotneedjquery.com</a>
			`
		}, {
			cat: 'legacy', name: 'RequireJS & AMD', value: 30,
			icon: 'img/requirejs.svg',
			desc: `
				AMD module loader. Deprecated and replaced by ES module and Webpack.
			`
		}, {
			cat: 'legacy tooling', name: 'Browser Sync', value: 40,
			icon: 'Browser Sync',
			desc: `
				Web development server popular among gulp/grunt web apps. No deprecated and replaced by live-server
				or webpackDevServer.
			`
		}, {
			cat: 'legacy tooling', name: 'Git Pre-commit', value: 30,
			icon: 'Git;Pre-commit',
			desc: `
				Pre-commit hook for git, now deprecated due to slow commit time. Code validation should be done
				in the code editor.
			`
		}, {
			cat: 'legacy tooling', name: 'http-server', value: 20,
			icon: 'http-server',
			desc: `
				A quick test web server based on Node.js, deprecated and replaced by live-server.
			`
		}, {
			cat: 'legacy tooling', name: 'LiveReload', value: 20,
			icon: 'Live;Reload',
			desc: `
				A propritery auto-reload solution for web developers, now deprecated in favor of live-server and
				hot module reload in Webpack.
			`
		}];
	/*eslint-enable indent*/
	/*global d3*/
	let svg = chart;
	// let width = svg.property('clientWidth'); // get width in pixels
	// let height = +svg.attr('height');
	let centerX = width * 0.5;
	let centerY = height * 0.5;
	let strength = 0.05;
	let focusedNode;

	let format = d3.format(',d');

	let scaleColor = d3.scaleOrdinal(d3.schemeCategory20);

	// use pack to calculate radius of the circle
	let pack = d3.pack()
		.size([width, height ])
		.padding(1.5);

	let forceCollide = d3.forceCollide(d => d.r + 1);

	// use the force
	let simulation = d3.forceSimulation()
		.force('charge', d3.forceManyBody())
		.force('collide', forceCollide)
		.force('x', d3.forceX(centerX ).strength(strength))
		.force('y', d3.forceY(centerY ).strength(strength));

	let root = d3.hierarchy({ children: data })
		.sum(d => d.value);

	// we use pack() to automatically calculate radius conveniently only
	// and get only the leaves
	let nodes = pack(root).leaves().map(node => {
		const data = node.data;
		return {
			x: centerX + (node.x - centerX) * 3, // magnify start position to have transition to center movement
			y: centerY + (node.y - centerY) * 3,
			r: 0, // for tweening
			radius: node.r, //original radius
			id: data.cat + '.' + (data.name.replace(/\s/g, '-')),
			cat: data.cat,
			name: data.name,
			value: data.value,
			icon: data.icon,
			desc: data.desc,
		};
	});
	simulation.nodes(nodes).on('tick', ticked);

	svg.style('background-color', '#eee');
	let node = svg.selectAll('.node')
		.data(nodes)
		.enter().append('g')
		.attr('class', 'node')
		.call(d3.drag()
			.on('start', (d) => {
				if (!d3.event.active) { simulation.alphaTarget(0.2).restart(); }
				d.fx = d.x;
				d.fy = d.y;
			})
			.on('drag', (d) => {
				d.fx = d3.event.x;
				d.fy = d3.event.y;
			})
			.on('end', (d) => {
				if (!d3.event.active) { simulation.alphaTarget(0); }
				d.fx = null;
				d.fy = null;
			}));

	node.append('circle')
		.attr('id', d => d.id)
		.attr('r', 0)
		.style('fill', d => scaleColor(d.cat))
		.transition().duration(2000).ease(d3.easeElasticOut)
			.tween('circleIn', (d) => {
				let i = d3.interpolateNumber(0, d.radius);
				return (t) => {
					d.r = i(t);
					simulation.force('collide', forceCollide);
				};
			});

	node.append('clipPath')
		.attr('id', d => `clip-${d.id}`)
		.append('use')
		.attr('xlink:href', d => `#${d.id}`);

	// display text as circle icon
	node.filter(d => !String(d.icon).includes('img/'))
		.append('text')
		.classed('node-icon', true)
		.attr('clip-path', d => `url(#clip-${d.id})`)
		.selectAll('tspan')
		.data(d => d.icon.split(';'))
		.enter()
			.append('tspan')
			.attr('x', 0)
			.attr('y', (d, i, nodes) => (13 + (i - nodes.length / 2 - 0.5) * 10))
			.text(name => name);

	// display image as circle icon
	node.filter(d => String(d.icon).includes('img/'))
		.append('image')
		.classed('node-icon', true)
		.attr('clip-path', d => `url(#clip-${d.id})`)
		.attr('xlink:href', d => d.icon)
		.attr('x', d => -d.radius * 0.7)
		.attr('y', d => -d.radius * 0.7)
		.attr('height', d => d.radius * 2 * 0.7)
		.attr('width', d => d.radius * 2 * 0.7);

	node.append('title')
		.text(d => (d.cat + '::' + d.name + '\n' + format(d.value)));

	let infoBox = node.append('foreignObject')
		.classed('circle-overlay hidden', true)
		.attr('x', -350 * 0.5 * 0.8)
		.attr('y', -350 * 0.5 * 0.8)
		.attr('height', 350 * 0.8)
		.attr('width', 350 * 0.8)
			.append('xhtml:div')
			.classed('circle-overlay__inner', true);

	infoBox.append('h2')
		.classed('circle-overlay__title', true)
		.text(d => d.name);

	infoBox.append('p')
		.classed('circle-overlay__body', true)
		.html(d => d.desc);


	node.on('click', (currentNode) => {
		d3.event.stopPropagation();
		console.log('currentNode', currentNode);
		let currentTarget = d3.event.currentTarget; // the <g> el

		if (currentNode === focusedNode) {
			// no focusedNode or same focused node is clicked
			return;
		}
		let lastNode = focusedNode;
		focusedNode = currentNode;

		simulation.alphaTarget(0.2).restart();
		// hide all circle-overlay
		d3.selectAll('.circle-overlay').classed('hidden', true);
		d3.selectAll('.node-icon').classed('node-icon--faded', false);

		// don't fix last node to center anymore
		if (lastNode) {
			lastNode.fx = null;
			lastNode.fy = null;
			node.filter((d, i) => i === lastNode.index)
				.transition().duration(2000).ease(d3.easePolyOut)
				.tween('circleOut', () => {
					let irl = d3.interpolateNumber(lastNode.r, lastNode.radius);
					return (t) => {
						lastNode.r = irl(t);
					};
				})
				.on('interrupt', () => {
					lastNode.r = lastNode.radius;
				});
		}

		// if (!d3.event.active) simulation.alphaTarget(0.5).restart();

		d3.transition().duration(2000).ease(d3.easePolyOut)
			.tween('moveIn', () => {
				console.log('tweenMoveIn', currentNode);
				let ix = d3.interpolateNumber(currentNode.x, centerX);
				let iy = d3.interpolateNumber(currentNode.y, centerY);
				let ir = d3.interpolateNumber(currentNode.r, centerY * 0.5);
				return function (t) {
					// console.log('i', ix(t), iy(t));
					currentNode.fx = ix(t);
					currentNode.fy = iy(t);
					currentNode.r = ir(t);
					simulation.force('collide', forceCollide);
				};
			})
			.on('end', () => {
				simulation.alphaTarget(0);
				let $currentGroup = d3.select(currentTarget);
				$currentGroup.select('.circle-overlay')
					.classed('hidden', false);
				$currentGroup.select('.node-icon')
					.classed('node-icon--faded', true);

			})
			.on('interrupt', () => {
				console.log('move interrupt', currentNode);
				currentNode.fx = null;
				currentNode.fy = null;
				simulation.alphaTarget(0);
			});

	});

	// blur
	d3.select(document).on('click', () => {
		let target = d3.event.target;
		// check if click on document but not on the circle overlay
		if (!target.closest('#circle-overlay') && focusedNode) {
			focusedNode.fx = null;
			focusedNode.fy = null;
			simulation.alphaTarget(0.2).restart();
			d3.transition().duration(2000).ease(d3.easePolyOut)
				.tween('moveOut', function () {
					console.log('tweenMoveOut', focusedNode);
					let ir = d3.interpolateNumber(focusedNode.r, focusedNode.radius);
					return function (t) {
						focusedNode.r = ir(t);
						simulation.force('collide', forceCollide);
					};
				})
				.on('end', () => {
					focusedNode = null;
					simulation.alphaTarget(0);
				})
				.on('interrupt', () => {
					simulation.alphaTarget(0);
				});

			// hide all circle-overlay
			d3.selectAll('.circle-overlay').classed('hidden', true);
			d3.selectAll('.node-icon').classed('node-icon--faded', false);
		}
	});

	function ticked() {
		node
			.attr('transform', d => `translate(${d.x},${d.y})`)
			.select('circle')
				.attr('r', d => d.r);
	}


	};
})();
