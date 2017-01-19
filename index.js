'use strict';

const request = require('request');
const promise = require('./promise');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const url = require('url');

const redis = require('./redis')(process.env.REDIS_URL, 'allegro');

const DAY = 60 * 60 * 24;

promise(null, request)({
  url: process.env.REQUEST_URL,
})
.then((response) => {
  const doc = new Dom({ errorHandler: () => false }).parseFromString(response.body);
  return Promise.all(xpath.select('//*[@class="offer-title"]/@href', doc).map((item) => {
    const itemUrl = url.parse(item.value);
    const key = itemUrl.path.replace(/\.html$/, '');
    return redis.get(key)
    .then((result) => {
      if (result) {
        return Promise.resolve();
      }
      return redis.set(key, true, DAY * 7)
      .then(() => item.value)
    });
  }))
  .then(result => result.filter(item => item));
})
.then(console.log)
.catch(console.error);
