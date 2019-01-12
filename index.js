const loadSnippet = require('./loadSnippet');
const url = require('url');
const http = require('http');
const fs = require('fs');

const path = require('path');
const chokidar = require('chokidar');
const find = require('find');

const DIR_PROJECT =  __dirname + '/project';

nodes = [];

function initFileStructure () {
	find.file(/\.md|\.hbs|\.json$/, DIR_PROJECT, function(files) {

		files.forEach(function (file) {
		  createNode(file);
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

	// console.log('node created/updated:', node);
  }

const app = http.createServer(page);

function page (request, response) {
	var html;
	var path = url.parse(request.url, true).path.split('/');
	path.shift();

	var stuff = path.pop();

	console.log('Request:', stuff, nodes[stuff]);

	if (path) {
		html = loadSnippet(stuff);
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(html.string);
		response.end();
	}
}

console.log('Starting server');

function onListening() {
	var addr = app.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;

	console.log('Listening on ' + bind);
}

initFileStructure();

app.listen(3000);
app.on('listening', onListening);

// One-liner for current directory, ignores .dotfiles and node_modules
chokidar.watch('.', {ignoreInitial: true, ignored: /(^|[\/\\])\..|node_modules/}).on('all', (event, path) => {
	if (event == 'addDir') {
	  return
	}

	console.log('-------------');
	console.log(event, path);
	createNode(path, event === 'unlink', event === 'unlinkDir');
	console.log('-------------');
	console.log(nodes);
  });
