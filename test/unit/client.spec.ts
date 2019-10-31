
import * as Sails from 'sails'
import * as SHSockets from 'sails-hook-sockets'
import * as jwt from 'jsonwebtoken'
import { expect } from 'chai';  // Using Expect style
import SailsClient from '../../src/client'


let api, app;

describe('client.spec.js', () => {
	
	before(() => {

		let ok = new Promise((resolve, reject) => {
			app = new Sails.constructor()
			app.lift({
				log: {
					level: 'silent'
				},
				globals: {
					sails: true,
					_: false,
					async: false,
					models: false,
					globals: false
				},
				port: 13666,
				sockets: {
					transports: ['websocket']
				},
				hooks: {
					grunt: false,
					sockets: SHSockets
				},
				session: { 
					secret: 'poopityscoop'
				}
			}, function (err) {
				if (err) {
					reject(err)
				}
				resolve(true)
			})
		})
		ok = ok.then(() => {
			const requestEndpoint = (req, res) => {
				return res.json({
					url: req.url,
					method: req.method,
					isSocket: req.isSocket,
					headers: req.headers,
				})
			}

			app.get('/api/request', requestEndpoint)
			app.post('/api/request', requestEndpoint)
			app.put('/api/request', requestEndpoint)
			app.delete('/api/request', requestEndpoint)

			app.post('/api/socket/join', (req, res) => {
				if (!req.isSocket) {
					return res.badRequest();
				}
				const roomName = req.param('room');
				// sails.sockets.join(req, roomName, (err) => {
				// 	if (err) {
				// 		return res.serverError(err);
				// 	}
				// 	return res.json({
				// 		message: 'Joined ' + roomName
				// 	});
				// });
			})

			app.post('/api/socket/blast', (req, res) => {
				app.sockets.blast('message', req.param('message'));
			})

			app.post('/api/auth/token', (req, res) => {
				if (req.param('email') === 'test@user.com' && req.param('password') === 'password123') {
					const token = jwt.sign({
						foo: 'bar'
					}, 
					'supersecurekeygoeshere', 
					{
						expiresIn: '1h'
					})
					res.json({
						token
					})
				} else {
					res.forbidden()
				}
			})
		})
		ok = ok.then(() => {
			api = new SailsClient({
				url: 'http://localhost:13666/api/'
			})
			return api.init()
		})
		return ok;
	});
	
	after(async () => {
		await api.disconnect()
		await app.lower()
	})

	it('should able to make an xhr request', async () => {
		const response = await api.xhrRequest({
			uri: 'http://localhost:13666/api/request',
			method: 'GET',
			// body: params,
			json: true
		})
		expect(!response.body.isSocket).to.equal(true)
		expect(response.body.method).to.equal('GET')
	})
	
	it('should be able to make a post request whether the socket is connected or not', async () => {

		await api.disconnect()
		const responseXhr = await api.post('request')
		expect(responseXhr.method).to.equal('POST')
		expect(!responseXhr.isSocket).to.equal(true)

		await api.connect()
		const response3 = await api.post('request')
		expect(response3.method).to.equal('POST')
		expect(response3.isSocket).to.equal(true)

	})

	it('should be able to make a get request whether the socket is connected or not', async () => {

		await api.disconnect()
		const responseXhr = await api.get('request')
		expect(responseXhr.method).to.equal('GET')
		expect(!responseXhr.isSocket).to.equal(true)

		await api.connect()
		const response3 = await api.get('request')
		expect(response3.method).to.equal('GET')
		expect(response3.isSocket).to.equal(true)

	})

	it('should be able to add event listeners to the socket', async () => {
		//disconnect so there's no socket to test it's adding events in listeners array
		await api.disconnect()
		expect(api.isConnected()).to.equal(false)
		await new Promise((resolve, reject) => {
			api.on('message', (data) => {
				expect(data).to.equal('foo')
				if (data === 'foo') {
					resolve()
				}
			})
			api.connect().then(() => {
				expect(api.isConnected()).to.equal(true)
				api.post('socket/blast', {
					message: 'foo'
				})
			})
		})
	})
})