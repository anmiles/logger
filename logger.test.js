const fs = require('fs');
const logger = require('./logger');
const colorette = require('colorette');
const moment = require('moment');

jest.useFakeTimers();

jest.mock('fs', () => ({
    appendFileSync : jest.fn(),
    getFileName : jest.fn().mockImplementation((filename) => `file://${filename}`),
    getCallerFile : jest.fn().mockImplementation(() => callerFile),
}));

const ensureDirectorySpy = jest.spyOn(fs, 'ensureDirectory').mockImplementation();
const deleteFolderRecursiveSpy = jest.spyOn(fs, 'deleteFolderRecursive').mockImplementation();

jest.mock('colorette', () => ({
    greenBright : jest.fn().mockImplementation((text) => `<green>${text}</green>`),
    yellowBright : jest.fn().mockImplementation((text) => `<yellow>${text}</yellow>`),
    redBright : jest.fn().mockImplementation((text) => `<red>${text}</red>`),
    cyanBright : jest.fn().mockImplementation((text) => `<cyan>${text}</cyan>`),
}));

const originalConsole = global.console;
global.console.log    = jest.fn();

const mockDate = new Date(2012, 11, 26, 7, 40, 0);
const callerFile = 'callerFile';
let setLogDir;
let errorOriginalConstructor;

beforeAll(() => {
    jest.setSystemTime(mockDate);
    errorOriginalConstructor = Error.prototype.constructor;
    Error.prototype.constructor = (message) => ({
        message,
        stack: `Error: ${message}\n    at test.js:1:1\n    at index.js:1:1`
    });
});

beforeEach(() => {
    logger.showDebug = true;

    if (setLogDir) {
        logger.dir('./test-logs');
    }
});

afterAll(() => {
    global.console = originalConsole;
    ensureDirectorySpy.mockRestore();
    jest.setSystemTime(new Date());
    Error.prototype.constructor = errorOriginalConstructor;
});

describe('logger', () => {
    describe('dir', () => {
        beforeAll(() => {
            setLogDir = false;
        });

        it('should write into default log file', () => {
            logger.log('test string');
            expect(fs.ensureDirectory).toBeCalledWith('./logs');
            expect(fs.appendFileSync.mock.calls[0][0]).toEqual('./logs/logger.test.js.2012.12.26_07.40.00.000.log');
        });

        it('should write into custom log file', () => {
            logger.dir('custom/log/dir');
            logger.log('test string');
            expect(fs.ensureDirectory).toBeCalledWith('custom/log/dir');
            expect(fs.appendFileSync.mock.calls[0][0]).toEqual('custom/log/dir/logger.test.js.2012.12.26_07.40.00.000.log');
        });

        it('should write into custom log file with group by date', () => {
            logger.dir('custom/log/dir', true);
            logger.log('test string');
            expect(fs.ensureDirectory).toBeCalledWith('custom/log/dir/2012/12/26');
            expect(fs.appendFileSync.mock.calls[0][0]).toEqual('custom/log/dir/2012/12/26/logger.test.js.07.40.00.000.log');
        });
    });

    describe('log', () => {
        beforeAll(() => {
            setLogDir = true;
        });

        it('should log string', () => {
            logger.log('test string');
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });

        it('should log two strings', () => {
            logger.log('test1', 'test2');
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });

        it('should log object', () => {
            logger.log({ a: 1, 'second key': { date: new Date().toLocaleString('ru') }});
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });

        it('should log string, regex and object', () => {
            logger.log('test1', /^\d+$/, { b: 2 });
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });
    });

    describe('debug', () => {
        beforeAll(() => {
            setLogDir = true;
        });

        it('should show log if showDebug is true', () => {
            logger.showDebug = true;
            logger.debug('test string');
            expect(global.console.log).toBeCalledTimes(1);
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });

        it('should not show log if showDebug is false', () => {
            logger.showDebug = false;
            logger.debug('test string');
            expect(global.console.log).not.toBeCalled();
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });
    });

    describe('trace', () => {
        beforeAll(() => {
            setLogDir = true;
        });

        it('should append stack and show log if showDebug is true', () => {
            logger.showDebug = true;
            logger.trace('test string');
            expect(global.console.log).toBeCalledTimes(1);
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });

        it('should append stack and not show log if showDebug is false', () => {
            logger.showDebug = false;
            logger.trace('test string');
            expect(global.console.log).not.toBeCalled();
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });
    });

    describe('info', () => {
        beforeAll(() => {
            setLogDir = true;
        });

        it('should apply green bright color to console', () => {
            logger.info('test1', /^\d+$/, { b: 2 });
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });
    });

    describe('warn', () => {
        beforeAll(() => {
            setLogDir = true;
        });

        it('should apply yellow bright color to console', () => {
            logger.warn('test1', /^\d+$/, { b: 2 });
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });
    });

    describe('error', () => {
        beforeAll(() => {
            setLogDir = true;
        });

        it('should apply red bright color to console', () => {
            logger.error('test1', /^\d+$/, { b: 2 });
            expect(global.console.log.mock.calls).toMatchSnapshot();
            expect(fs.appendFileSync.mock.calls).toMatchSnapshot();
        });
    });

    describe('clear', () => {
        beforeAll(() => {
            setLogDir = true;
        });

        it('should clear log directory', () => {
            logger.clear();
            expect(deleteFolderRecursiveSpy).toBeCalledWith('./test-logs');
        })
    });
});
