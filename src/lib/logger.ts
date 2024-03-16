import fs from 'fs';
import path from 'path';
import * as colorette from 'colorette';
import moment from 'moment';

const methods = [ 'log', 'debug', 'trace', 'info', 'warn', 'error' ] as const;

type LoggerMethods = {
	[K in typeof methods[number]]: (...data: unknown[]) => void;
};

class Logger implements LoggerMethods {
	private readonly root?     : string;
	private readonly filename? : string;
	private readonly dirname?  : string;
	private readonly showDebug : boolean;
	private readonly showTime  : boolean;
	private readonly extension : string;

	constructor({ root, groupByDate = false, showDebug = false, showTime = false, extension = 'log' }: { root? : string; groupByDate? : boolean; showDebug? : boolean; showTime? : boolean; extension? : string } = {}) {
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

	static timestamp({ date = false, time = false, safe = false }: { date? : boolean; time? : boolean; safe? : boolean } = {}): string {
		const formats = [];

		if (!date && !time) {
			throw new Error('Expected date and/or time to be requested');
		}

		if (date) {
			formats.push(safe ? 'YYYY.MM.DD' : 'YYYY-MM-DD');
		}

		if (time) {
			formats.push(safe ? 'HH.mm.ss.SSS' : 'HH:mm:ss.SSS');
		}

		return moment().format(formats.join(safe ? '_' : ' '));
	}

	/* istanbul ignore next */
	static getStackTrace(): string | undefined {
		return new Error().stack;
	}

	log(...data: unknown[]): void {
		this.process(console.log, data);
	}

	debug(...data: unknown[]): void {
		this.process(console.debug, data, { debug : true });
	}

	trace(...data: unknown[]): void {
		this.process(console.debug, data, { debug : true, stack : true });
	}

	info(...data: unknown[]): void {
		this.process(console.info, data, { modifier : colorette.greenBright });
	}

	warn(...data: unknown[]): void {
		this.process(console.warn, data, { modifier : colorette.yellowBright });
	}

	error(...data: unknown[]): void {
		this.process(console.error, data, { modifier : colorette.redBright, stack : true });
	}

	clear(): void {
		if (this.dirname) {
			fs.rmSync(this.dirname, { force : true, recursive : true });
		}
	}

	private process(
		consoleFunc: (message?: unknown, ...optionalParams: unknown[]) => void,
		data: unknown[], {
			modifier = (text: number | string) => text.toString(), stack, debug }: { modifier? : (text: number | string) => string;
			stack?                                                                             : boolean;
			debug?                                                                             : boolean;
		} = {},
	): void {
		const prefix = this.showTime
			? `${Logger.timestamp({ date : true, time : true })}\t`
			: '';

		let suffix = '';

		if (stack) {
			const errorStack = (data[0] instanceof Error ? data[0].stack : Logger.getStackTrace()) ?? '';

			suffix = errorStack
				? `\n${errorStack.split('\n').filter((s: string) => s.startsWith('    at ')).join('\n')}`
				: '';
		}

		const stringifiedData = data[0] instanceof Error
			? data[0].message
			: data.map((obj: unknown) => this.stringify(obj)).join(' ');

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

	private stringify(data: unknown): RegExp | string {
		if (typeof data !== 'object') {
			return String(data);
		}

		return data instanceof RegExp
			? data
			: JSON.stringify(data, null, '	');
	}
}

const defaultLogger = new Logger({ showDebug : true });

const log   = defaultLogger.log.bind(defaultLogger);
const debug = defaultLogger.debug.bind(defaultLogger);
const trace = defaultLogger.trace.bind(defaultLogger);
const info  = defaultLogger.info.bind(defaultLogger);
const warn  = defaultLogger.warn.bind(defaultLogger);
const error = defaultLogger.error.bind(defaultLogger);

export { Logger, log, debug, trace, info, warn, error, methods };
export default { Logger, log, debug, trace, info, warn, error, methods };
