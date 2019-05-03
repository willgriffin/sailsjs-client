import "@babel/polyfill";
import request from 'request'
import SocketIo from 'socket.io-client'
import SailsIo from 'sails.io.js'
import { URL } from 'url';

class SailsClient {
	
	constructor(args) {
		this.url = new URL(args.url || 'http://localhost:1337/api/')
		if (this.url.protocol === null) {
			throw new Error('Invalid url');
		}
		if (args.auth) {
			this.auth = {
				username: args.auth.username,
				password: args.auth.password,
				endpoint: args.auth.endpoint || 'auth/token',
				usernameField: args.auth.usernameField || 'email',
				passwordField: args.auth.passwordField || 'password'
			}
		}
		this.reconnect = true;
		this.listeners = [];
	}
	
	async init() {
		await this.getCookie()
		await this.socketInit()
		await this.connect()
		if (this.auth) {
			await this.authenticate()
		}
	}
	
	on(event, method) {
		this.listeners.push({
			event, method
		})
		if (this.isConnected() === true) {
			this.socket.on(event, method)
		}
	}

	async getCookie() {
		const response = await this.request({
			uri: this.url.origin + '/__getcookie',
			method: 'GET'
		})
		this.cookies = response.headers['set-cookie']
	}

	async authenticate(auth) {
		const response = await this.post(auth.endpoint, {
			[auth.usernameField]: auth.username,
			[auth.passwordField]: auth.password
		})
		auth.response = response
		return auth
	}

	async get(path, params) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'GET',
			body: params,
			json: true
		})
		return response.body
	}
	
	async post(path, params) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'POST',
			body: params,
			json: true
		})
		return response.body
	}

	async put(path, params) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'PUT',
			body: params,
			json: true
		})
		return response.body
	}

	async patch(path, params) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'PATCH',
			body: params,
			json: true
		})
		return response.body
	}

	async delete(path, params) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'DELETE',
			body: params,
			json: true
		})
		return response.body
	}

	async request(params) {
		let response
		if (this.isConnected() === true) {
			response = await this.socketRequest(params)
		} else {
			response = await this.xhrRequest(params)
		}
		if (response.statusCode !== 200) {
			throw new Error(`[${response.statusCode}] ${response.body}`);
		}
		return response
	}

	async socketInit() {
		this.io = new SailsIo(SocketIo)
		this.io.sails.initialConnectionHeaders = {
			'cookie': this.cookies,
			//'Authorization': this.auth && this.auth.token
		}
		this.io.sails.url = this.url.origin
		this.io.sails.autoConnect = false;
		this.io.sails.reconnection = this.reconnect
	}

	isConnected() {
		if (typeof this.socket === 'undefined') {
			return false
		} else {
			return this.socket.isConnected()
		}
	}

	async connect() {
		if (this.isConnected() === false) {
			return new Promise((resolve, reject) => {
				this.socket = this.io.sails.connect()
				for (const listener of this.listeners) {
					this.socket.on(listener.event, listener.method)
				}
				this.socket.on('connect', (data) => {
					resolve(true)
				})
			})
		} else {
			console.warn('Already connected')
		}
	}

	async disconnect() {
		if (this.isConnected() === true) {
			return new Promise((resolve, reject) => {
				this.socket.on('disconnect', async (data) => {
					resolve(true)
				})
				this.socket.disconnect()
			})
		} else {
			console.warn('already disconnected')
		}
	}

	socketRequest(params) {
		return new Promise((resolve, reject) => {
			if (typeof params.headers === 'undefined') {
				params.headers = {}
			}
			try {
				this.socket.request({
					method: params.method || 'GET',
					url: params.uri,
					data: params.body,
					headers: params.headers
				}, function (body, jwr) {
					return resolve(jwr)
				})
			} catch (err) {
				return reject(err)
			}
		})
	}

	xhrRequest(params) {
		return new Promise((resolve, reject) => {
			request(params, function (err, response, body) {
				if (err)
					return reject(err)
				else {
					return resolve(response)
				}
			})
		})
	}
}

export default SailsClient