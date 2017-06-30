'use strict';
// @TODO make this an external npm module
const
  url = require('url');

const defaultParams = {
  token: false
}



class AmpedActivityLog {

  constructor(params) {
    this._params = Object.assign({}, defaultParams, params);
  }

  /**
   * Logs an action
   *
   * @param {object} req            - Express request object
   * @param {AmpedSocket} socket    - AmpedSocket instance
   * @param {string} action         - The action of the activity. This is a good way to group many actions of a certain type together. For example: 'update', 'create', 'upload', etc...
   * @param {string} description     - A blurb that describes what the action is
   * @param {any} data              - Any data that you want to associate with the activity
   * @param {object} user           - User data object
   */
  log(req, socket, action, description, data, user) {

    return new Promise((resolve, reject) => {
      if (typeof user === 'undefined')
        user = req.user;

      if ( typeof user !== 'undefined' && user !== null ) {
        // @TODO figure out something to do with the log when there is no user data
        const entry = {
          user_id: typeof user === 'undefined' ? 0 : user.id,
          account_id: typeof user === 'undefined' ? 0 : user.account_id,
          action : action.toLowerCase()
        };

        if (typeof description !== 'undefined')
          entry.description = description;
        if (typeof data !== 'undefined')
          entry.data = data;

        req.db.activity.create(entry)
          .then(( val ) => {
            socket.sendSocket('ACTIVITY_CREATE', val.dataValues, user);
            return val;
          })
          .then((  ) => resolve())
          .catch((err) => {
            console.error(err);
            reject(err);
          })
      }
    })
  }


}

/**
 * Middleware that should be called from the app.js to attach the activity log to the request object.
 * When the activity log is called a socket event is emitted to inform the client that an activity has taken place
 *
 * @param {AmpedSocket} socket    - The global socket object
 * @param {object} params         - Parameters that should be passed to AmpedActivityLog.
 * @returns {function}            - Express middleware function
 */

module.exports = function(socket, params, config){
    return {
	    middleware : function (socket, params, config) {

		    const activityLog = new AmpedActivityLog(params);

		    return (req, res, next) => {
			    req.logActivity = activityLog.log.bind(activityLog, req, socket);
			    next();
		    }
	    }
    }
}
