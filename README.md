# @anmiles/logger

Logging data with timestamp into console and/or file

----

## Installation

`npm install @anmiles/logger`

## Usage

```js
import Logger from '@anmiles/logger';

const logger = new Logger({ root: '/log/app', groupByDate: true, showDebug: true });
logger.error('Error message with stack trace');
```
