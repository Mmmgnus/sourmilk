const Handlebars = require('handlebars');
const fs = require('fs');

Handlebars.registerHelper('fullName', function(name) {
	return name.firstName + " " + name.lastName;
});

Handlebars.registerPartial(
	'component1',
	readFile('component1.hbs')
);

Handlebars.registerHelper(
	'snippet',
	loadSnippet
);

function readFile (file) {
	try {
		return fs.readFileSync(file).toString('utf-8');
	}
	catch (e) {
		return null;
	}
}

function loadSnippet (nodeName, data) {
	var node = nodes[nodeName];
	var file = readFile(node.template);
	var json = node.data ? JSON.parse(readFile(node.data)) : {};
	var template = Handlebars.compile(file);

	if(data && data.hash && data.hash.data) {
		json = Object.assign(json, JSON.parse(data.hash.data) || {});
	}

	return new Handlebars.SafeString(template(json));
}

function loadStyleguidePage (name) {
	var file = readFile(name);
	var template = Handlebars.compile(file);
	var items = toObject(nodes);
	console.log({test: 123, n: items});
	return new Handlebars.SafeString(template({test: 123, n: items}));
}

function toObject (array) {
	var obj = {};

	for (let key in nodes) {
		obj[key] = nodes[key]
	}

	return obj;
}

return module.exports = {
	loadSnippet: loadSnippet,
	loadStyleguidePage: loadStyleguidePage
};