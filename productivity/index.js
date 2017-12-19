const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const {indexDocs} = require('../indexer');

const index = 'productivity';
const type = 'log';
const dataFolder = path.resolve(__dirname, 'data');

fs.readdir(dataFolder, (err, filenames) => {
  filenames.forEach(indexFile);
});

fs.watch(dataFolder, (eventType, filename) => {
  indexFile(filename);
});

function indexFile(filename) {
  const {history} = require(path.resolve(dataFolder, filename));
  const {log, activities, apps, categories} = history;
  indexDocs(
    log.map(entry => {
      const activity = activities[entry.activity_id];
      const app = apps[activity.app_id];
      const category = categories[app.category_id];
      return Object.assign({}, entry, {activity, app, category});
    })
    .map(addTimestamp)
    .map((body, i) => ({index, type, id: i, body}))
  );
}

function addTimestamp(entry) {
  const timestamp = new Date(entry.start_time * 1000).toISOString();
  return Object.assign({}, entry, {timestamp});
}
