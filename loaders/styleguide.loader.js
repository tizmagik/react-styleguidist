/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const prettyjson = require('prettyjson');
const _ = require('lodash');
const config = require('../src/utils/config');

function processComponent(filepath) {
    // If component name can’t be detected in runtime use filename or folder name (if file name is 'index')
	const filename = path.basename(filepath).replace(/\.\w+$/, '');
	const nameFallbak = filename === 'index' ? path.basename(path.dirname(filepath)) : filename;

	return '{' + [
		'filepath: ' + JSON.stringify(filepath),
		'nameFallbak: ' + JSON.stringify(nameFallbak),
		'pathLine: ' + JSON.stringify(config.getComponentPathLine(path.relative(config.configDir, filepath))),
		'module: ' + requireIt(filepath),
		'props: ' + requireIt('!!props!' + filepath),
		'examples: ' + getExamples(filepath, nameFallbak),
	].join(',') + '}';
}

function getExamples(filepath, nameFallbak) {
	const examplesFile = config.getExampleFilename(filepath);

	if (hasExamples(filepath)) {
		return requireIt('examples!' + examplesFile);
	}

	if (config.defaultExample) {
		return requireIt('examples?componentName=' + nameFallbak + '!' + config.defaultExample);
	}

	return null;
}

function hasExamples(filepath) {
	const examplesFile = config.getExampleFilename(filepath);
	return !!fs.existsSync(examplesFile);
}

function requireIt(filepath) {
	return 'require(' + JSON.stringify(filepath) + ')';
}

function processComponentsSource(components, config) {
	if (!components) {
		return null;
	}

	let componentSources;
	if (typeof components === 'function') {
		componentSources = components();
	}
	else {
		componentSources = glob.sync(path.resolve(config.configDir, components));
	}

	if (config.verbose) {
		console.log();
		console.log('Loading components:');
		console.log(prettyjson.render(componentSources));
		console.log();
	}

	if (config.skipComponentsWithoutExample) {
		componentSources = _.filter(componentSources, hasExamples);
	}

	return '[' + componentSources.map(processComponent).join(',') + ']';
}

function processSection(section, config) {
	return '{' + [
		'name: ' + JSON.stringify(section.name),
		'content: ' + (section.content ? requireIt('examples!' + section.content) : null),
		'components: ' + processComponentsSource(section.components, config),
		'sections: ' + processSectionsList(section.sections, config),
	].join(',') + '}';
}

function processSectionsList(sections, config) {
	if (!sections) {
		return null;
	}

	return '[' +
		sections.map(function(section) {
			return processSection(section, config);
		}).join(',') +
	']';
}

module.exports = function() {};
module.exports.pitch = function() {
	this.cacheable && this.cacheable(); // eslint-disable-line

	// Example usage of query options:
	// require('!!styleguide?{"configFilepath":"/path/to/config.js"}!');
	if (this.query) {
		const query = JSON.parse(this.query.substring(1)); // getting rid of '?'
		if (query.configFilepath) {
			config.initialize(query.configFilepath);
		}
	}

	const simplifiedConfig = _.pick(config, [
		'title',
		'highlightTheme',
		'showCode',
	]);

	return [
		'module.exports = {',
		'	config: ' + JSON.stringify(simplifiedConfig) + ',',
		'	components: ' + processComponentsSource(config.components, config) + ',',
		'	sections: ' + processSectionsList(config.sections, config),
		'};',
	].join('\n');
};
