'use strict';
// @TODO make external npm module

const
  JWT       = require('jsonwebtoken'),
  SHA1      = require('sha1'),
  url       = require('url');

let config = {};

module.exports = function(c) {

	if ( typeof c !== 'undefined' )
		config = c;


	const Util = {

		capitalize: function (str) {
			return str.charAt(0).toUpperCase() + str.slice(1);
		},

		/**
		 * Gets all params and builds a single object of them.
		 * Takes from `req.body`, `req.params` and parses the url query params
		 *
		 * @param {object} req - An Expressed request object
		 *
		 * @returns {object}
		 */
		getParams: function (req) {
			return Object.assign({}, req.body, req.fields, req.params, url.parse(req.url, true).query);
		},

		/**
		 * Converts a pascaled case string to underscore
		 *
		 * @param {string} str - A pascaled string
		 *
		 * @returns {string}
		 */
		pascalToUnderscore: function (str) {
			return Util.camelToUnderscore(str).replace(/^_/, "");
		},

		/**
		 * Converts a camelcased string to underscore
		 *
		 * @param {string} str - A camelcased string
		 *
		 * @returns {string}
		 */
		camelToUnderscore: function (str) {
			return str.replace(/([A-Z])/g, function ($1) {
				return "_" + $1.toLowerCase();
			}).replace(/^_/, "");
		},

		/**
		 * Generates a temp name based on a random hash and the current time and what else was passed as the `append` parameter
		 *
		 * @param {string} [append='']   - Anything that should be appended onto the end of the filename
		 *
		 * @returns {string}
		 */
		getTempName: function (append) {
			return Util.generatehash(24) + '-' + new Date().getTime() + '|' + (append.split('?')[0] || '');
		},

		/**
		 * Generates a random hash
		 *
		 * @param {number} length=5  - The length of the hash
		 *
		 * @returns {string} - A hash that is as long as the length that was passed
		 */
		generatehash: function (length) {
			if (typeof length === 'undefined')
				length = 5;
			let text = "";
			const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (let i = 0; i < length; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));

			return text;
		},

		generateJWT: function (data, config) {
			return JWT.sign(data, config.secret, {expiresIn: config.expires, issuer: config.issuer})
		},

		// @TODO need to get JWT.verify working
		decodeJWT: function (token) {
			return JWT.decode(token);
		},

		encodePassword: function (raw) {
			return SHA1(raw)
		},

		dotNotationToObject: function (obj) {
			return Object.keys(obj).reduce((ret, key) => {
				if (key.indexOf('.') !== -1) {

					const parts = key.split('.');

					if (typeof ret[parts[0]] === 'undefined')
						ret[parts[0]] = {};

					ret[parts[0]][parts[1]] = obj[key];
					return ret;

				} else {
					ret[key] = obj[key];
					return ret;
				}
			}, {});
		}
	}
	return Util;
}
