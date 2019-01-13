const url = require('url');
// const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const find = require('find');
const styleguide = require('./lib/loadSnippet');
const handlebars = require('handlebars');
const chalk = require('chalk');

const DIR_PROJECT =  __dirname + '/project';
const DIR_STYLEGUIDE = __dirname + '/styleguide';

const PORT = 3000;

nodes = [];

function initFileStructure () {
	find.file(/\.md|\.hbs|\.json$/, DIR_PROJECT, function(files) {

		files.forEach(function (file) {
		  createNode(file);
		});
	});

	find.file(/\.hbs/, DIR_STYLEGUIDE + '/templates/snippets', function (files) {
		files.forEach(function (file) {
			handlebars.registerPartial(
				path.basename(file, '.hbs'),
				fs.readFileSync(file).toString('utf-8')
			);
		});
	});
}

function createNode (file, remove, removeNode) {
	let name = path.basename(file, path.extname(file));
	let node = (nodes[name]) ? nodes[name] : { name: name, path: path.dirname(file)};

	if (removeNode) {
	  nodes[name] = null;
	}
	else {
	  switch (path.extname(file)) {
		case '.md':
		  node.documentation = (remove) ? null : file;
		break;

		case '.json':
		  node.data = (remove) ? null : file;
		break;

		case '.hbs':
		  node.template = (remove) ? null : file;

		break;
	  }

	  nodes[name] = node;
	}

	return node;
  }

const app = express();

function page (request, response) {
	var html;
	var path = url.parse(request.url, true).path.split('/');
	path.shift();

	var stuff = path.pop();

	if (stuff !== 'favicon.ico') {
		if (stuff) {
			if (path[0] === 'page') {
				console.log('Requested PAGE of:', stuff);
				html = styleguide.loadPage(stuff, {nodes: toObject(nodes)});
			}
			else {
				console.log('Requested MODULE of:', stuff);
				html = styleguide.loadSnippet(stuff, {nodes: toObject(nodes)});
			}
		}
		else {
			html = styleguide.loadStyleguidePage('styleguide/templates/start.hbs', {nodes: toObject(nodes)});
		}

		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(html.string);
	}
	else {
		console.log('For now we ignore favicon.ico');
	}

	response.end();
}

function toObject (array) {
	var obj = {};

	for (let key in nodes) {
		obj[key] = nodes[key]
	}

	return obj;
}

// Assets used by the styleguide.
app.use('/styleguide/static', express.static(path.join(__dirname, 'styleguide/assets')));

app.get('/', function (request, response) {
	html = styleguide.loadStyleguidePage('styleguide/templates/start.hbs', {nodes: toObject(nodes)});
	response.send(html.string);
});

// Sends page with documentation and component example.
app.get('/:page', function (request, response) {
	console.time('[Page] ' + request.params.page);
	var html = styleguide.loadPage(request.params.page, {nodes: toObject(nodes)});
	response.send(html.string);
	console.timeEnd('[Page] ' + request.params.page);
});

// Sends only the component
app.get('/component/:name', function (request, response) {
	console.time('[Component] ' + request.params.name);
	var html = styleguide.loadSnippet(request.params.name, {nodes: toObject(nodes)});
	response.send(html.string);
	console.timeEnd('[Component] ' + request.params.name);
});

initFileStructure();

console.log(chalk.bold('\nStarting styleguide…'));
app.listen(PORT, () => console.log(chalk.green('Styleguide is running at http://localhost:' + PORT), '\n'));

// One-liner for current directory, ignores .dotfiles and node_modules
chokidar.watch('./project', {ignoreInitial: true, ignored: /(^|[\/\\])\..|node_modules/}).on('all', (event, path) => {
	if (event == 'addDir') {
	  return;
	}

	var node = createNode(path, event === 'unlink', event === 'unlinkDir');

	console.log('\n------------------------------------------');
	console.log(chalk.yellow('[' + event + ']'), chalk.italic(path), '\n');
	for (let key in node) {
		console.log(chalk.bold(key) + ':', node[key]);
	}
	console.log('------------------------------------------');
  });
