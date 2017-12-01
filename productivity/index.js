const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');
const readFile = Promise.promisify(fs.readFile);
const readDir = Promise.promisify(fs.readdir);

const index = 'productivity';
const type = 'qbserve';

const templatePromise = readFile('productivity/mappings.json', 'utf8')
.then(json => ({
  name: index,
  body: {
    template: index,
    mappings: JSON.parse(json)
  }
}));

const docsPromise = readDir('productivity/data')
.then(files => {
  return files.reduce((docs, file) => {
    const data = require('./data/' + file);
    return [...docs, ...getDocs(data)];
  }, []);
});

function getDocs(data) {
  const {history} = data;
  const {log, activities, apps, categories} = history;
  return log.map(entry => {
    const activity = activities[entry.activity_id];
    const app = apps[activity.app_id];
    const category = categories[app.category_id];
    return getBody(entry, {activity, app, category});
  })
  .map(body => ({index, type, body}));
}

function getBody(entry, metadata) {
  return Object.assign(
    addTimestamp(omitIds(entry)),
    _.mapValues(metadata, omitIds)
  );
}

function addTimestamp(entry) {
  return Object.assign(
    {'@timestamp': new Date(entry.start_time * 1000)},
    _.omit(entry, 'start_time')
  );
}

function omitIds(obj) {
  return _.omitBy(obj, (value, key) => key.endsWith('_id'));
}

module.exports = {templatePromise, docsPromise};
