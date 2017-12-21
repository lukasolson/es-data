const {resolve} = require('path');
const {readdir, watch} = require('fs');
const {indexDocs} = require('../indexer');

const index = 'productivity';
const type = 'log';
const dataFolder = resolve(__dirname, 'data');

readdir(dataFolder, (err, filenames) => {
  filenames.forEach(indexFile);
});

watch(dataFolder, (eventType, filename) => {
  indexFile(filename);
});

function indexFile(filename) {
  const {history} = require(resolve(dataFolder, filename));
  const {log, activities, apps, categories} = history;
  indexDocs(
    log.map(entry => {
      const activity = activities[entry.activity_id];
      const app = apps[activity.app_id];
      const category = categories[app.category_id];
      return {...entry, activity, app, category};
    })
    .map(addTimestamp)
    .map((body, i) => ({index, type, id: i, body}))
  );
}

function addTimestamp(entry) {
  const timestamp = new Date(entry.start_time * 1000).toISOString();
  return {...entry, '@timestamp': timestamp};
}
