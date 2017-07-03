'use strict';

module.exports = function(config) {

	const
		AmpedAuthorization = require('./AmpedAuthorization')(config);

	class AmpedSocket {

		constructor(io) {
			this.io = io;
			this.sockets = {};
			this.allConnectedUserSockets = {};
			this.setup();
		}

		/**
		 * @TODO should only be allowed to be created once
		 * @TODO break disconnect out to its own function
		 * @TODO group the sockets by account id
		 *
		 * Sets up the the main connection listener for the sockets
		 */
		setup() {
			this.io.on('connection', (socket) => {

				AmpedAuthorization.getUserByJWT(socket.request._query.authorization)
					.then((user) => {

						if (typeof this.sockets[user.account_id] === 'undefined')
							this.sockets[user.account_id] = {};
						socket.user = user;
						this.sockets[user.account_id][user.id] = socket;
						this.allConnectedUserSockets[user.id] = socket;

						socket.on('disconnect', () => {
							delete this.sockets[user.account_id][user.id];
							delete this.allConnectedUserSockets[user.id];
						});
					});
			})
		}

		/**
		 * @param {string} evt   - The event that should be sent
		 * @param {any} data     - The data that will be sent with the socket event
		 * @param {object} req   - Express request object
		 * @param {function} customEmitCallback - A callback to override the default socket functionality
		 */
		sendSocket(evt, data, user, customEmitCallback) {


			if (typeof data === 'undefined')
				data = {};

			if ( typeof customEmitCallback === 'function') {
				customEmitCallback(this.allConnectedUserSockets, evt, data, user);
			} else {
				// if (typeof toUser === 'undefined') {
				if (typeof this.sockets[user.account_id] !== 'undefined')
					Object.keys(this.sockets[user.account_id]).forEach((sk) => {
						this.sockets[user.account_id][sk].emit(evt, data)
					});
			}

			// } else
			// 	this.sockets[toUser.account_id][toUser.id].emit(evt, data);
			// this.sockets.forEach((socket) => {
			//   socket.emit(evt, data)
			// });
		}
	}

	return AmpedSocket;
}