// import {MODULE_SCOPE} from './src/core.js'

// Javascript files
import "./src/rotation.js"

// /**
//  * Add window listeners to catch errors so we can print out the stack trace.
//  */
// window.addEventListener('error', (event) => { s_ERROR_HANDLER(event.error); });
// window.addEventListener('unhandledrejection', (event) => { s_ERROR_HANDLER(event.reason); });
//
// /**
//  * Just a convenience to print out the full stack trace in order to be able to use NPM module stacktracify to
//  * reverse it against a private source map.
//  *
//  * @param {Error} error - An error!
//  */
// const s_ERROR_HANDLER = (error) =>
// {
//    if (typeof error.stack !== 'string') { return; }
//
//    // Only print out stack trace if it includes `demo-rollup-module`.
//    if (error.stack.includes(MODULE_SCOPE))
//    {
//       const lines = error.stack.split('\n');
//       lines.splice(0, 1);
//       console.log(lines.join('\r\n'));
//    }
// };