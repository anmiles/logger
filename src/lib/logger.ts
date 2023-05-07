import fs from 'fs';
import path from 'path';
import colorette from 'colorette';
import moment from 'moment';

export class Logger {
	private root?: string;
	private filename?: string;
	private dirname?: string;
	private showDebug: boolean;
	private extension: string;

	constructor({ root, groupByDate = false, showDebug = false, extension = 'log' }: {root?: string, groupByDate?: boolean, showDebug?: boolean, extension?: string} = {}) {
		this.root      = root?.replace(/\/$/, '');
		this.showDebug = showDebug;
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
		const prefix = `${Logger.timestamp({ date : true, time : true })}\t`;

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

const defaultLogger = new Logger();

export const log = defaultLogger.log;
export const debug = defaultLogger.debug;
export const trace = defaultLogger.trace;
export const info = defaultLogger.info;
export const warn = defaultLogger.warn;
export const error = defaultLogger.error;
