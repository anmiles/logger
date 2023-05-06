import fs from 'fs';
import path from 'path';
import colorette from 'colorette';
import moment from 'moment';

export default class Logger {
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

		process.on('uncaughtException', function(err: Error) {
			/* istanbul ignore next */
			this.error(err);
		});
	}

	process(data: any[], { modifier = ((str: string) => str), stack, debug }: {modifier?: (text: string | number) => string, stack?: boolean, debug?: boolean} = {}): void {
		const prefix = `${Logger.timestamp({ date : true, time : true })}\t`;

		const suffix = stack
			? `\n${Error.prototype.constructor.call(Error, '').stack.split('\n').filter((s: string) => s.startsWith('    at ')).join('\n')}`
			: '';

		const stringifiedData = data.map((obj: any) => this.stringify(obj));

		if (!debug || this.showDebug) {
			console.log(prefix + modifier(stringifiedData.join(' ')) + suffix);
		}

		if (this.dirname) {
			if (!fs.existsSync(this.dirname)) {
				fs.mkdirSync(this.dirname, { recursive : true });
			}
		}

		if (this.filename) {
			fs.appendFileSync(this.filename, `${prefix + stringifiedData.join(' ') + suffix}\n`);
		}
	}

	private stringify(data: any): string {
		return typeof (data) !== 'object' || Object.prototype.toString.apply(data) === '[object RegExp]' ? data : JSON.stringify(data, null, '	');
	}

	log(...data: any[]): void {
		this.process(data);
	}

	debug(...data: any[]): void {
		this.process(data, { debug : true });
	}

	trace(...data: any[]): void {
		this.process(data, { debug : true, stack : true });
	}

	info(...data: any[]): void {
		this.process(data, { modifier : colorette.greenBright });
	}

	warn(...data: any[]): void {
		this.process(data, { modifier : colorette.yellowBright });
	}

	error(...data: any[]): void {
		this.process(data, { modifier : colorette.redBright, stack : true });
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
