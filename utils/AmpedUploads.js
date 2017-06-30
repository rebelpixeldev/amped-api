// @TODO replace promises with generators
'use strict';

const
  fs = require('fs'),
  gm = require('gm'),
  http = require('http'),
  https = require('https'),
  path = require('path'),
  request = require('request'),
  url = require('url');


module.exports = function(config) {

	const
		fileUtil    = require('./AmpedFileUtil')(config),
		util        = require('./AmpedUtil')(config);

	class AmpedUploads {

		/**
		 * Gets the image info
		 *
		 * @param {string} filepath  - The filepath that you want to fetch the image info from
		 *
		 * @returns {Promise} - Will resolve with the info that is pulled from the filepath
		 */
		static getFileInfo(filepath) {
			return new Promise((resolve, reject) => {
				gm(filepath).identify((err, info) => {
					if (err) reject(err);
					else resolve(info)
				})
			})
		}

		/**
		 * Saves an image to the location that is specified in the config.
		 *
		 * @param {object} req          - Express request object
		 * @param {string} tmpFilePath  - The filepath of where the image currently is.
		 */
		static saveImage(req, tmpFilePath) {
			console.log('SAVING ImAGE');
			return new Promise((resolve, reject) => {
				AmpedUploads.getFileInfo(tmpFilePath)
					.then((info) => {


						console.log('INFO', info);

						const
							filename = tmpFilePath.split('/').pop().split('|').pop().split('?')[0],
							extension = tmpFilePath.split('.').pop().split('?')[0];
						req.db.uploads.create({
							amp_account_id: req.user.account_id,
							amp_user_id: req.user.id,
							title: filename.replace('.' + extension, ''),
							mime: fileUtil.extensionToMime(extension),
							filename: filename,
							extension: extension,
							filesize: parseFloat(info.Filesize),
							width: info.size.width,
							height: info.size.height
						})
							.then((upload) => {
								const
									info = upload.get({plain: true}),
									filename = `${info.id}.${info.extension}`,
									srcPath = path.join(config.uploads.sourceDir, filename),
									thumbPath = path.join(config.uploads.thumbDir, filename);
								// resolve(upload.get({plain : true}))

								info.filepath = `${config.uploads.sourcefilePath}/${filename}`;

								Promise.all([
									AmpedUploads.moveImage(tmpFilePath, srcPath),
									AmpedUploads.createThumb(thumbPath, tmpFilePath)
								]).then(() => {
									AmpedUploads.removeImage(tmpFilePath)
										.then(resolve.bind(this, info))
										.catch(err => reject(err));
								}).catch(err => reject(err));
							})
							.catch(err => reject(err))
					}).catch(err => reject(err))
			})
		}

		/**
		 * Moves an image from one location to another
		 *
		 * @param {string} originalPath   - The source path of an image
		 * @param {string} destPath       - The destination path of an image
		 *
		 * @returns {Promise}             - Resolves with the originalPath as the parameter
		 */
		static moveImage(originalPath, destPath) {
			return new Promise((resolve, reject) => {
				fs.readFile(originalPath, (err, data) => {
					if (err) reject(err);
					else
						fs.writeFile(destPath, data, (err) => {
							if (err) reject(err);
							else resolve(originalPath);
						});
				});
			})
		}

		/**
		 * Removes an image from a filepath
		 *
		 * @param {string} filepath  - Filepath that should be removed
		 *
		 * @returns {Promise} - Resolves with filepath as the parameter
		 */
		static removeImage(filepath) {
			return new Promise((resolve, reject) => {
				fs.unlink(filepath, function (err) {
					if (err) reject(err);
					else resolve(filepath);
				})
			})
		}

		/**
		 * Creates a thumbnail of a specific image
		 *
		 * @param {string} thumbPath  - The path where the new thumbnail should be saved
		 * @param {string} srcPath  - Path to the source image which the thumbnail should be created from
		 *
		 * @returns {Promise} - Resolves with the thumbpath in the parameter
		 */
		static createThumb(thumbPath, srcPath) {
			return new Promise((resolve, reject) => {

				gm(srcPath)
				// .autoOrient()
					.resize(config.uploads.thumb.width, config.uploads.thumb.height, '^')
					.gravity('Center')
					.crop(config.uploads.thumb.width, config.uploads.thumb.height)
					.write(thumbPath, function (err) {
						if (err) reject(err);
						else resolve(thumbPath);
					});

			})
		}

		/**
		 * Downloads a remote image and saves it locally
		 *
		 * @param {string} remoteUrl  - The remote url that you want to download
		 *
		 * @returns {Promise} - Resolves with the filepath where the image has been saved
		 */
		static downloadRemote(remoteUrl) {
			return new Promise((resolve, reject) => {
				const
					filename = remoteUrl.split('/').pop(),
					dest = path.join(config.uploads.tempDir, util.getTempName(filename)),
					file = fs.createWriteStream(dest),
					getFunc = url.parse(remoteUrl).protocol === 'https' ? https : http;

				request.head(remoteUrl, function (err, res, body) {
					request(remoteUrl).pipe(fs.createWriteStream(dest))
						.on('close', resolve.bind(this, dest))
						.on('error', reject);
				});
			});
		}

	}
	return AmpedUploads;
}