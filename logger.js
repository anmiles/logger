const fs = require('fs');
const path = require('path');
const colorette = require('colorette');
const moment = require('moment');
require('../prototypes');

function Logger() {
    var logger = this;
    var logDir;
    var logFile;
    var extension = "log";
    logger.showDebug = false;

    function log(data, { modifier, stack, debug } = {}) {
        const prefix = logger.time() + '\t';
        const suffix = stack
            ? '\n' + Error.prototype.constructor.call(Error, '').stack.split('\n').filter(s => s.startsWith('    at ')).join('\n')
            : '';

        data = data.map(obj => beautify(obj));
        modifier = modifier || (str => str);

        if (logger.showDebug || !debug) console.log(prefix + modifier(data.join(' ')) + suffix);

        if (!logDir) {
            logger.dir('./logs');
        }

        fs.ensureDirectory(logDir);
        fs.appendFileSync(logFile, prefix + data.join(' ') + suffix + '\r\n');
    }

    function beautify(data) {
        return typeof(data) !== "object" || Object.prototype.toString.apply(data) === "[object RegExp]" ? data : JSON.stringify(data, null, '    ');
    }

    logger.dir = function(logPath, groupByDate) {
        var callerFile = fs.getFileName(fs.getCallerFile());
        logPath = logPath.replace(/\/$/, '');

        if (groupByDate) {
            logDir = `${logPath}/${moment().format('YYYY/MM/DD')}`;
            logFile = `${logDir}/${callerFile}.${moment().format('HH.mm.ss.SSS')}.${extension}`;
        } else {
            logDir = logPath;
            logFile = `${logDir}/${callerFile}.${logger.time(true)}.${extension}`;
        }

        process.on('uncaughtException', function(err) {
            /* istanbul ignore next */
            logger.error(err);
        });
    };

    logger.log = function(...data) {
        log(data);
    };

    logger.debug = function(...data) {
        log(data, { debug: true });
    };

    logger.trace = function(...data) {
        log(data, { debug: true, stack: true });
    };

    logger.info = function(...data) {
        log(data, { modifier: colorette.greenBright });
    };

    logger.warn = function(...data) {
        log(data, { modifier: colorette.yellowBright });
    };

    logger.error = function(...data) {
        log(data, { modifier: colorette.redBright, stack: true });
    };

    logger.time = function(safe) {
        return moment().format(safe ? 'YYYY.MM.DD_HH.mm.ss.SSS' : 'YYYY-MM-DD HH:mm:ss.SSS');
    };

    logger.clear = function() {
        fs.deleteFolderRecursive(logDir);
    };
}

module.exports = new Logger();
