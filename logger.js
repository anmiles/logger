const fs = require('fs');
const clc = require('cli-color');
const moment = require('moment');
require('../prototypes');

function Logger() {
    var logger = this;
    var logDir;
    var logFile;
    var extension = "log";
    logger.showDebug = false;

    function log(str, modifier, showStack, skipDebug) {
        if (showStack) {
            str = str && str.stack ? str.stack : new Error(beautify(str)).stack.replace(/^Error/, '');
        } else {
            str = beautify(str);
        }

        str = logger.time() + '\t' + str;
        if (logger.showDebug || !skipDebug) console.log(typeof modifier == 'function' ? modifier(str) : str);

        if (!logDir) {
            logger.dir('./logs');
        }

        fs.ensureDirectory(logDir);
        fs.appendFileSync(logFile, str + '\r\n');
    }

    function beautify(str) {
        return typeof(str) !== "object" || Object.prototype.toString.apply(str) === "[object RegExp]" ? str : JSON.stringify(str, null, '    ');
    }

    logger.dir = function(logPath, groupByDate) {
        var callerfile = fs.getFileName(fs.getCallerFile());

        if (groupByDate) {
            logDir = logPath + moment().format('YYYY/MM/DD');
            logFile = '{0}/{1}.{2}.{3}'.format(logDir, callerfile, moment().format('HH.mm.ss.SSS'), extension);
        } else {
            logDir = logPath;
            logFile = '{0}/{1}.{2}.{3}'.format(logDir, callerfile, logger.time(true), extension);
        }

        process.on('uncaughtException', function(err) {
            logger.error(err);
        });
    };

    logger.log = function(str, showStack) {
        log(str, null, typeof showStack === 'undefined' ? false : showStack);
    };

    logger.info = function(str, showStack) {
        log(str, clc.green, typeof showStack === 'undefined' ? false : showStack);
    };

    logger.warn = function(str, showStack) {
        log(str, clc.yellow.bold, typeof showStack === 'undefined' ? false : showStack);
    };

    logger.error = function(str, showStack) {
        log(str, clc.red.bold, typeof showStack === 'undefined' ? true : showStack);
    };

    logger.stop = function(str) {
        throw str;
    }

    logger.trace = function() {
        log('', clc.cyan, true);
    };

    logger.debug = function(str, showStack) {
        log(str, null, showStack, true);
    };

    logger.time = function(safe) {
        return moment().format(safe ? 'YYYY.MM.DD_HH.mm.ss.SSS' : 'YYYY-MM-DD HH:mm:ss.SSS');
    };

    logger.clear = function() {
        fs.deleteFolderRecursive(logDir);
    };
}

module.exports = new Logger();
