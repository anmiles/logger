import fs from 'fs';
import emitter from 'event-emitter';
import { Logger, log, debug, trace, info, warn, error } from '../logger';

jest.useFakeTimers();

jest.mock('fs', () => ({
	appendFileSync : jest.fn(),
	existsSync     : jest.fn().mockImplementation(() => exists),
	mkdirSync      : jest.fn(),
	rmSync         : jest.fn(),
}));

jest.mock('colorette', () => ({
	greenBright  : jest.fn().mockImplementation((text) => `<green>${text}</green>`),
	yellowBright : jest.fn().mockImplementation((text) => `<yellow>${text}</yellow>`),
	redBright    : jest.fn().mockImplementation((text) => `<red>${text}</red>`),
	cyanBright   : jest.fn().mockImplementation((text) => `<cyan>${text}</cyan>`),
}));

const mockFunctions   = [ 'log', 'debug', 'info', 'warn', 'error' ] as const;
const originalConsole = {} as typeof global.console;
const consoleSpy      = {} as Record<typeof mockFunctions[number], jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>>;

mockFunctions.forEach((func) => {
	originalConsole[func] = global.console[func];
	global.console[func]  = jest.fn();
	consoleSpy[func]      = jest.spyOn(global.console, func).mockImplementation();
});

const mockProcess = emitter(process);

const root     = '/log/root';
const mockDate = new Date(2012, 11, 26, 7, 40, 0, 25);
const stack    = 'Error\n    at test.js:1:1\n    at index.js:1:1';

let logger: Logger;
let exists: boolean;
let appendFileSyncSpy: jest.SpyInstance;
let getStackTraceSpy: jest.SpyInstance;

beforeAll(() => {
	appendFileSyncSpy = jest.spyOn(fs, 'appendFileSync');
	getStackTraceSpy  = jest.spyOn(Logger, 'getStackTrace');
	jest.setSystemTime(mockDate);
});

beforeEach(() => {
	appendFileSyncSpy.mockImplementation();
	getStackTraceSpy.mockReturnValue(stack);
});

afterAll(() => {
	appendFileSyncSpy.mockRestore();
	getStackTraceSpy.mockRestore();
	jest.setSystemTime(new Date());
	global.console = originalConsole;
});

describe('src/lib/logger', () => {
	describe('constructor', () => {
		describe('root', () => {
			it('should not be set by default', () => {
				logger = new Logger();
				expect(logger['root']).toBeUndefined();
			});

			it('should be set if specified', () => {
				logger = new Logger({ root : '/log/app' });
				expect(logger['root']).toEqual('/log/app');
			});

			it('should strip trailing slash', () => {
				logger = new Logger({ root : '/log/app/' });
				expect(logger['root']).toEqual('/log/app');
			});

			it('should forward uncaught exception to console.error', () => {
				logger         = new Logger();
				const errorSpy = jest.spyOn(logger, 'error').mockImplementation();
				const error    = new Error('test exception');
				mockProcess.emit('uncaughtException', error);
				expect(errorSpy).toHaveBeenCalledWith(error);
				errorSpy.mockRestore();
			});
		});
		describe('showDebug', () => {
			it('should be set to false by default', () => {
				logger = new Logger();
				expect(logger['showDebug']).toEqual(false);
			});

			[
				{ argument : true, property : true },
				{ argument : false, property : false },
				{ argument : undefined, property : false },
			].forEach(({ argument, property }: { argument: boolean | undefined, property: boolean }) => {
				it(`should be set to ${property} if specified ${argument}`, () => {
					logger = new Logger({ showDebug : argument });
					expect(logger['showDebug']).toEqual(property);
				});
			});
		});
	});

	describe('extension', () => {
		it('should be "log" by default', () => {
			logger = new Logger();
			expect(logger['extension']).toEqual('log');
		});

		it('should be set if specified', () => {
			logger = new Logger({ extension : 'txt' });
			expect(logger['extension']).toEqual('txt');
		});

		it('should strip leading dot from custom extension', () => {
			logger = new Logger({ extension : '.txt' });
			expect(logger['extension']).toEqual('txt');
		});
	});

	describe('filename', () => {
		it('should be undefined by default', () => {
			logger = new Logger();
			expect(logger['filename']).toBeUndefined();
		});

		it('should be set if root is specified', () => {
			logger = new Logger({ root });
			expect(logger['filename']).toEqual('/log/root/2012.12.26_07.40.00.025.log');
		});

		it('should be grouped by date', () => {
			logger = new Logger({ root, groupByDate : true });
			expect(logger['filename']).toEqual('/log/root/2012.12.26/07.40.00.025.log');
		});

		it('should be set using custom extension', () => {
			logger = new Logger({ root, extension : '.txt' });
			expect(logger['filename']).toEqual('/log/root/2012.12.26_07.40.00.025.txt');
		});
	});

	describe('dirname', () => {
		it('should be undefined by default', () => {
			logger = new Logger();
			expect(logger['dirname']).toBeUndefined();
		});

		it('should be set if root is specified', () => {
			logger = new Logger({ root });
			expect(logger['dirname']).toEqual('/log/root');
		});

		it('should be grouped by date', () => {
			logger = new Logger({ root, groupByDate : true });
			expect(logger['dirname']).toEqual('/log/root/2012.12.26');
		});
	});

	describe('log', () => {
		it('should not write into log file if root is not specified', () => {
			logger = new Logger();
			logger.log('test string');
			expect(fs.existsSync).not.toHaveBeenCalled();
			expect(fs.mkdirSync).not.toHaveBeenCalled();
			expect(fs.appendFileSync).not.toHaveBeenCalled();
		});

		it('should check log directory', () => {
			logger = new Logger({ root });
			logger.log('test string');
			expect(fs.existsSync).toHaveBeenCalledWith('/log/root');
		});

		it('should create log directory if does not exist', () => {
			exists = false;
			logger = new Logger({ root });
			logger.log('test string');
			expect(fs.mkdirSync).toHaveBeenCalledWith('/log/root', { recursive : true });
		});

		it('should not create log directory if exists', () => {
			exists = true;
			logger = new Logger({ root });
			logger.log('test string');
			expect(fs.mkdirSync).not.toHaveBeenCalled();
		});

		it('should log string', () => {
			logger = new Logger({ root });
			logger.log('test string');
			expect(consoleSpy.log.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		it('should log two strings', () => {
			logger = new Logger({ root });
			logger.log('test1', 'test2');
			expect(consoleSpy.log.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		it('should log object', () => {
			logger = new Logger({ root });
			logger.log({ 'a' : 1, 'second key' : { date : new Date().toLocaleString('ru') } });
			expect(consoleSpy.log.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		it('should log string, regex and object', () => {
			logger = new Logger({ root });
			logger.log('test1', /^\d+$/, { b : 2 });
			expect(consoleSpy.log.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		describe('exported', () => {
			it('should not write to file', () => {
				log('test string');
				expect(appendFileSyncSpy).not.toHaveBeenCalled();
			});

			it('should call console.log', () => {
				log('test string');
				expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			});

			it('should call console.log the same way as the method of default Logger', () => {
				log('test string');
				logger = new Logger({ root });
				logger.log('test string');
				expect(consoleSpy.log.mock.calls[0]).toEqual(consoleSpy.log.mock.calls[1]);
			});
		});
	});

	describe('debug', () => {
		it('should not show log by default', () => {
			logger = new Logger({ root });
			logger.debug('test string');
			expect(consoleSpy.debug).not.toHaveBeenCalled();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		it('should show log if showDebug is true', () => {
			logger = new Logger({ root, showDebug : true });
			logger.debug('test string');
			expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
			expect(consoleSpy.debug.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		describe('exported', () => {
			it('should not write to file', () => {
				debug('test string');
				expect(appendFileSyncSpy).not.toHaveBeenCalled();
			});

			it('should call console.debug', () => {
				debug('test string');
				expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
			});

			it('should call console.debug the same way as the method of default Logger with showDebug always set', () => {
				debug('test string');
				logger = new Logger({ root, showDebug : true });
				logger.debug('test string');
				expect(consoleSpy.debug.mock.calls[0]).toEqual(consoleSpy.debug.mock.calls[1]);
			});
		});
	});

	describe('trace', () => {
		it('should append stack and not show log if showDebug is false', () => {
			logger = new Logger({ root });
			logger.trace('test string');
			expect(consoleSpy.debug).not.toHaveBeenCalled();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		it('should append stack and show log if showDebug is true', () => {
			logger = new Logger({ root, showDebug : true });
			logger.trace('test string');
			expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
			expect(consoleSpy.debug.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		describe('exported', () => {
			it('should not write to file', () => {
				trace('test string');
				expect(appendFileSyncSpy).not.toHaveBeenCalled();
			});

			it('should call console.debug', () => {
				trace('test string');
				expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
			});

			it('should call console.debug the same way as the method of default Logger with showDebug always set', () => {
				trace('test string');
				logger = new Logger({ root, showDebug : true });
				logger.trace('test string');
				expect(consoleSpy.debug.mock.calls[0]).toEqual(consoleSpy.debug.mock.calls[1]);
			});
		});
	});

	describe('info', () => {
		it('should apply green bright color to console', () => {
			logger = new Logger({ root });
			logger.info('test1', /^\d+$/, { b : 2 });
			expect(consoleSpy.info.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		describe('exported', () => {
			it('should not write to file', () => {
				info('test string');
				expect(appendFileSyncSpy).not.toHaveBeenCalled();
			});

			it('should call console.info', () => {
				info('test string');
				expect(consoleSpy.info).toHaveBeenCalledTimes(1);
			});

			it('should call console.info the same way as the method of default Logger', () => {
				info('test string');
				logger = new Logger({ root });
				logger.info('test string');
				expect(consoleSpy.info.mock.calls[0]).toEqual(consoleSpy.info.mock.calls[1]);
			});
		});
	});

	describe('warn', () => {
		it('should apply yellow bright color to console', () => {
			logger = new Logger({ root });
			logger.warn('test1', /^\d+$/, { b : 2 });
			expect(consoleSpy.warn.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		describe('exported', () => {
			it('should not write to file', () => {
				warn('test string');
				expect(appendFileSyncSpy).not.toHaveBeenCalled();
			});

			it('should call console.warn', () => {
				warn('test string');
				expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
			});

			it('should call console.warn the same way as the method of default Logger', () => {
				warn('test string');
				logger = new Logger({ root });
				logger.warn('test string');
				expect(consoleSpy.warn.mock.calls[0]).toEqual(consoleSpy.warn.mock.calls[1]);
			});
		});
	});

	describe('error', () => {
		it('should apply red bright color to console', () => {
			logger = new Logger({ root });
			logger.error('test1', /^\d+$/, { b : 2 });
			expect(consoleSpy.error.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		it('should log error with stack', () => {
			logger      = new Logger({ root });
			const error = new Error('test exception');
			error.stack = 'Error\n    at error.js:1:1';
			logger.error(error);
			expect(consoleSpy.error.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		it('should log error without stack', () => {
			logger      = new Logger({ root });
			const error = new Error('test exception');
			delete error.stack;
			logger.error(error);
			expect(consoleSpy.error.mock.calls).toMatchSnapshot();
			expect(appendFileSyncSpy.mock.calls).toMatchSnapshot();
		});

		describe('exported', () => {
			it('should not write to file', () => {
				error('test string');
				expect(appendFileSyncSpy).not.toHaveBeenCalled();
			});

			it('should call console.error', () => {
				error('test string');
				expect(consoleSpy.error).toHaveBeenCalledTimes(1);
			});

			it('should call console.error the same way as the method of default Logger', () => {
				error('test string');
				logger = new Logger({ root });
				logger.error('test string');
				expect(consoleSpy.error.mock.calls[0]).toEqual(consoleSpy.error.mock.calls[1]);
			});
		});
	});

	describe('timestamp', () => {
		it('should throw if neither date nor time requested', () => {
			expect(() => Logger.timestamp()).toThrow('Expected date and/or time to be requested');
		});

		describe('default', () => {
			it('should return date', () => {
				expect(Logger.timestamp({ date : true })).toEqual('2012-12-26');
			});

			it('should return time', () => {
				expect(Logger.timestamp({ time : true })).toEqual('07:40:00.025');
			});

			it('should return date and time', () => {
				expect(Logger.timestamp({ date : true, time : true })).toEqual('2012-12-26 07:40:00.025');
			});
		});

		describe('safe', () => {
			it('should return date', () => {
				expect(Logger.timestamp({ safe : true, date : true })).toEqual('2012.12.26');
			});

			it('should return time', () => {
				expect(Logger.timestamp({ safe : true, time : true })).toEqual('07.40.00.025');
			});

			it('should return date and time', () => {
				expect(Logger.timestamp({ safe : true, date : true, time : true })).toEqual('2012.12.26_07.40.00.025');
			});
		});
	});

	describe('clear', () => {
		it('should not do anything if log directory if specified', () => {
			new Logger().clear();
			expect(fs.rmSync).not.toHaveBeenCalled();
		});

		it('should clear log directory if specified', () => {
			new Logger({ root }).clear();
			expect(fs.rmSync).toHaveBeenCalledWith(root, { recursive : true, force : true });
		});
	});
});
