'use strict';

/**
 * Return promise for given callback function
 *
 * @param {object} target
 * @param {function} func
 * @param {*} ...args
 */
const getPromise = (target, func) => (...args) => (
  new Promise((resolve, reject) => {
    func.call(target, ...args, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  })
);

module.exports = getPromise;
