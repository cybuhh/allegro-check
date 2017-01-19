'use strict';

const redis = require('redis');
const promise = require('./promise');

/**
 *
 * @param {string} url
 * @param {string} prefix
 * @returns {{set: (function(): Promise.<*>), client}}
 */
module.exports = (url, prefix) => {
  const client = redis.createClient({ url, prefix: `${prefix}:` });

  /**
   * @parma {string} key
   * @return {Promise}
   */
  const get = key => (promise(client, client.get)(key));

  /**
   * @parma {string} key
   * @parma {number} ttl
   * @return {Promise}
   */
  const expire = (key, ttl) => (promise(client, client.expire)(key, ttl));

  /**
   *
   * @param {string} key
   * @param {string} value
   * @param {number} [ttl]
   * @returns {Promise}
   */
  const set = (key, value, ttl) => {
    if (!ttl) {
      return promise(client, client.set)(key, value);
    }

    return set(key, value)
    .then(() => expire(key, ttl));
  };

  return {
    get,
    expire,
    set,
  };
};
