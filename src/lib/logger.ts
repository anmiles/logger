import fs from 'fs';
import path from 'path';
import * as colorette from 'colorette';
import moment from 'moment';

export const methods = [ 'log', 'debug', 'trace', 'info', 'warn', 'error' ] as const;

type LoggerMethods = {
	[K in typeof methods[number]]: (...data: any[]) => void;
}

export class Logger implements LoggerMethods {
	private root?: string;
	private filename?: string;
	private dirname?: string;
	private showDebug: boolean;
	private showTime: boolean;
	private extension: string;

	constructor({ root, groupByDate = false, showDebug = false, showTime = false, extension = 'log' }: {root?: string, groupByDate?: boolean, showDebug?: boolean, showTime?: boolean, extension?: string} = {}) {
		this.root      = root?.replace(/\/$/, '');
		this.showDebug = showDebug;
		this.showTime  = showTime;
		this.extension = extension.replace(/^\./, '');

		if (this.root) {
			const parts = groupByDate
				? [
					root,
					Logger.timestamp({ safe : true, date : true }),
					Logger.timestamp({ safe : true, time : true }),
				]
				: [
					root,
					Logger.timestamp({ safe : true, date : true, time : true }),
				];

			this.filename = `${parts.join('/')}.${this.extension}`;
			this.dirname  = path.dirname(this.filename);
		}

		((logger) => {
			process.on('uncaughtException', function(err: Error) {
				logger.error(err);
			});
		})(this);
	}

	/* istanbul ignore next */
	static getStackTrace() {
		return new Error().stack;
	}

	private process(consoleFunc: (message?: any, ...optionalParams: any[]) => void, data: any[], { modifier = ((str: string) => str), stack, debug }: {modifier?: (text: string | number) => string, stack?: boolean, debug?: boolean} = {}): void {
		const prefix = this.showTime
			? `${Logger.timestamp({ date : true, time : true })}\t`
			: '';

		let suffix = '';

		if (stack) {
			const errorStack = ((data[0] instanceof Error ? data[0].stack : Logger.getStackTrace()) || '');

			suffix = errorStack
				? `\n${errorStack.split('\n').filter((s: string) => s.startsWith('    at ')).join('\n')}`
				: '';
		}

		const stringifiedData = data[0] instanceof Error
			? data[0].message
			: data.map((obj: any) => this.stringify(obj)).join(' ');

		if (!debug || this.showDebug) {
			consoleFunc(prefix + modifier(stringifiedData) + suffix);
		}

		if (this.dirname) {
			if (!fs.existsSync(this.dirname)) {
				fs.mkdirSync(this.dirname, { recursive : true });
			}
		}

		if (this.filename) {
			fs.appendFileSync(this.filename, `${prefix + stringifiedData + suffix}\n`);
		}
	}

	private stringify(data: any): string {
		return typeof (data) !== 'object' || Object.prototype.toString.apply(data) === '[object RegExp]' ? data : JSON.stringify(data, null, '	');
	}

	log(...data: any[]): void {
		this.process(console.log, data);
	}

	debug(...data: any[]): void {
		this.process(console.debug, data, { debug : true });
	}

	trace(...data: any[]): void {
		this.process(console.debug, data, { debug : true, stack : true });
	}

	info(...data: any[]): void {
		this.process(console.info, data, { modifier : colorette.greenBright });
	}

	warn(...data: any[]): void {
		this.process(console.warn, data, { modifier : colorette.yellowBright });
	}

	error(...data: any[]): void {
		this.process(console.error, data, { modifier : colorette.redBright, stack : true });
	}

	static timestamp({ date = false, time = false, safe = false }: {date?: boolean, time? : boolean, safe?: boolean} = {}): string {
		const formats = [];

		if (!date && !time) {
			throw 'Expected date and/or time to be requested';
		}

		if (date) {
			formats.push(safe ? 'YYYY.MM.DD' : 'YYYY-MM-DD');
		}

		if (time) {
			formats.push(safe ? 'HH.mm.ss.SSS' : 'HH:mm:ss.SSS');
		}

		return moment().format(formats.join(safe ? '_' : ' '));
	}

	clear(): void {
		if (this.dirname) {
			fs.rmSync(this.dirname, { force : true, recursive : true });
		}
	}
}

const defaultLogger = new Logger({ showDebug : true });

export const log = defaultLogger.log.bind(defaultLogger);
export const debug = defaultLogger.debug.bind(defaultLogger);
export const trace = defaultLogger.trace.bind(defaultLogger);
export const info = defaultLogger.info.bind(defaultLogger);
export const warn = defaultLogger.warn.bind(defaultLogger);
export const error = defaultLogger.error.bind(defaultLogger);

export default { Logger, log, debug, trace, info, warn, error, methods };
