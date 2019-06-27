/*
  This file defines a constructor for a logger object. The constructor takes
  two arguments, the first of which is a name for the logger, and the second 
  of which is a function that defines how to print a string. Its 
  default value is to print to the console (str => console.log(str)).
  
  This object stores a debug level threshold value, and each printing method 
  of this object takes a level argument. The message is printed if the level
  argument is at least as large as the currently set threshold. 

  The simplest and most useful method of this object is print(level, message), 
  which simply prints the message if level is at least as big as the threshold. 
  when(), unless(), and error() are convenience methods that call print. See
  the details.
  
  The invocation(lvl) method prints the currently running 
  function as it was invoked with default lvl = DEBUG. 
  For example, given the following code:

  function foo(A, B) {
      log.invocation(log.level.INFO);
  }
  let x = {bar: 'baz'};
  foo(3, x);

  The string "foo(3, {bar: 'baz'})" will be printed if the current threshold
  of the logger is set to log.level.DEBUG or log.level.INFO. The invocation
  function will not work in strict mode, so it is automatically disabled in 
  that case. Alternative, invocation can be manually disabled by setting 
  LOGGER.STRICT = true.
*/

let strictMode = (function() {return !this;})();

let LOGGER = {
    STRICT: strictMode,
    ASSERT: false,
    assert: function (str) {
        throw {
            message: str
        };
    },
    level: {
        NONE: 4,
        ERROR: 3,
        WARN: 2,
        INFO: 1,
        DEBUG: 0,
        toString: function toString(lvl) {
            switch (lvl) {
            case 0:
                return 'DEBUG';
            case 1:
                return 'INFO';
            case 2:
                return 'WARN';
            case 3:
                return 'ERROR';
            case 4:
                return 'NONE';
            default:
                return 'Invalid debug level';
            }
        }
    }
};

LOGGER.createLogger = function createLogger(name, printer) {
    if (!printer) {
        printer = str => {console.log(str);};
    }

    const setPrinter = function setPrinter(p) {
        printer = p;
    },
          logName = name,
          level = LOGGER.level;

    // The default.
    let DEBUG_THRESHOLD;
    let setDebugLevel = function setDebugLevel(lvl) {
        DEBUG_THRESHOLD = lvl;
    };
    setDebugLevel(level.WARN);

    const print = function print(lvl, message) {
        if (DEBUG_THRESHOLD <= lvl) {
            message = `${name} [${level.toString(lvl)}]: ${message}`;
            if (LOGGER.ASSERT && lvl === level.ERROR) {
                LOGGER.assert(message);
            } else {
                printer(message);
            }
        }
    },
          when = function when(condition, level, message) {
              if (condition) {
                  print(level, message);
              }
          },

          unless = function unless(condition, level, message) {
              when(!condition, level, message);
          },
          
          functionName = function functionName(fn) {
              if (typeof fn === 'function') {
                  return fn.toString().match()[1];
              } else {
                  return undefined;
              }
          },
          
          doInvocation = function invocation(lvl) {
              if (lvl === undefined) {
                  lvl = level.DEBUG;
              }
              
              if (lvl < DEBUG_THRESHOLD) {
                  return;
              }
              
              const out = functionName(arguments.callee.caller),
                    
                    argArray = Array.from(
                        arguments.callee.caller.arguments, function (obj) {
                            if (typeof obj === 'function') {
                                return functionName(obj);
                            } else if (obj === undefined) {
                                return typeof obj;
                            } else {
                                return JSON.stringify(obj) || obj.name || typeof obj;
                            }
                        });
              
              out += `(${argArray.join(', ')})`;
              print(lvl, out);
          },

          invocation = LOGGER.STRICT? function () {}: doInvocation,

          error = function error(message) {
              print(level.ERROR, message);
          },

          warn = function warn(message) {
              print(level.WARN, message);
          },

          info = function info(message) {
              print(level.INFO, message);
          },

          debug = function debug(message) {
              print(level.DEBUG, message);
          };

    return {
        setPrinter,
        level,
        setDebugLevel,
        print,
        error,
        warn,
        info,
        debug,
        when,
        unless,
        invocation
    };
};
