const childProcess = require('child_process');
const raven = require('raven');

const config = require('../../config');

for (const method of Object.keys(console)) {
  exports[method] = function log(topic, ...args) {
    // eslint-disable-next-line no-console
    console[method](new Date().toISOString(), `[${topic}]`, ...args);
  };
}

if (config.sentry) {
  exports.capture = (error, extra = {}) => {
    const event = raven.captureException(error, { extra });
    exports.log('SENTRY EXCEPTION', event);
  };

  raven.config(config.sentry, {
    release: childProcess.execSync('git rev-parse HEAD').toString().trim(),
    environment: process.env.NODE_ENV,
  }).install((err, sendErrFailed, eventId) => {
    if (sendErrFailed) exports.error('SENTRY FAIL', eventId, err.stack);
    else exports.error('SENTRY', eventId);
    process.exit(1);
  });
} else {
  exports.capture = exports.error;
}
