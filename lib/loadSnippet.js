const Handlebars = require('handlebars');
const fs = require('fs');
const markdown = require('markdown').markdown;

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

function loadPage (nodeName, data) {
	var node = nodes[nodeName];
	var file = readFile(node.template);
	var pageFile = readFile('styleguide/templates/page.hbs');
	var doc = readFile(node.documentation);
	var json = node.data ? JSON.parse(readFile(node.data)) : {};
	var template = file ? Handlebars.compile(file) : null;

	var pageTemplate = Handlebars.compile(pageFile);

	if(data && data.hash && data.hash.data) {
		json = Object.assign(json, JSON.parse(data.hash.data) || {});
	}

	var page = {
		documentation: markdown.toHTML(doc),
		example: !!file,
		title: nodeName.replace('-', ' '),
		name: nodeName,
		data: data
	};

	return new Handlebars.SafeString(pageTemplate(page));
}

function loadStyleguidePage (name, data) {
	var file = readFile(name);
	var template = Handlebars.compile(file);

	return new Handlebars.SafeString(template({data: data} || {}));
}

return module.exports = {
	loadSnippet: loadSnippet,
	loadPage: loadPage,
	loadStyleguidePage: loadStyleguidePage
};