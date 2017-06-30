let _AmpedSocket = null,
	_io = null,
	_config = null,
	_socket = null,
	_params = null;

const libs = {};

module.exports.setup = function (config,io, params) {

	if ( typeof params !== 'undefined' && _params === null )
		_params = params;

	if ( typeof config !== 'undefined' && _config === null ) {
		_config = config;
		libs.AmpedSocket = require('./utils/AmpedSocket')(_config);
		libs.AmpedModel = require('./models/AmpedModel')(_config);
		libs.AmpedAcl = require('./utils/AmpedAcl')(_config);
		libs.AmpedActivityLog = require('./utils/AmpedActivityLog')(_socket, _params, _config);
		libs.AmpedAuthorization = require('./utils/AmpedAuthorization')(_config);
		libs.AmpedConnector = require('./utils/AmpedConnector')(_config);
		libs.AmpedEmailer = require('./utils/AmpedEmailer')(_config);
		libs.AmpedFeedback = require('./utils/AmpedFeedback')(_config);
		libs.AmpedMiddleware = require('./utils/AmpedMiddleware')(_config);
		libs.AmpedPassport = require('./utils/AmpedPassport')(_config);
		libs.AmpedUploads = require('./utils/AmpedUploads')(_config);
		libs.AmpedUtil = require('./utils/AmpedUtil')(_config);
		libs.AmpedValidator = require('./utils/AmpedValidator')(_config);
		libs.AmpedFileUtil = require('./utils/AmpedFileUtil')(_config);
		
	}
	if ( typeof io !== 'undefined' && _io === null ) {
		_io = io;
		_socket = new libs.AmpedSocket(_io);
	}
	
	return {
		AmpedModel: libs.AmpedModel,
		AmpedAcl: libs.AmpedAcl,
		AmpedActivityLog: libs.AmpedActivityLog,
		AmpedAuthorization: libs.AmpedAuthorization,
		AmpedConnector: libs.AmpedConnector,
		AmpedEmailer: libs.AmpedEmailer,
		AmpedFeedback: libs.AmpedFeedback,
		AmpedMiddleware: libs.AmpedMiddleware,
		AmpedPassport: libs.AmpedPassport,
		AmpedUploads: libs.AmpedUploads,
		AmpedUtil: libs.AmpedUtil,
		AmpedValidator: libs.AmpedValidator,
		AmpedFileUtil: libs.AmpedFileUtil,
		socket : _socket
	}
}

module.exports.get = (modelName) => {
	if ( typeof libs[modelName] === 'undefined' )
		throw new Error('You need to run setup before you can call `get`. In your main app file is a good place to do this.')
	else
		return libs[modelName];
};

module.exports.getConfig = () => _config;


