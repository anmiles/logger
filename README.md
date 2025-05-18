# @anmiles/logger

Logging data with timestamp into console and/or file

----

## Installation

`npm install @anmiles/logger`

## Usage

### Logging to screen and file system

```js
import { Logger } from '@anmiles/logger';

const logger = new Logger({ root: '/log/app', groupByDate: true, showDebug: true });
logger.error('Error message with stack trace');
```

### Logging to screen only

```js
import { error } from '@anmiles/logger';

error('Error message with stack trace');
```

### Using default import to access to multiple log methods

```js
import logger from '@anmiles/logger';

logger.info('Info message');
logger.error('Error message with stack trace');
```
