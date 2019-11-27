import * as rp from 'request-promise'
import * as SocketIo from 'socket.io-client'
import * as SailsIo from 'sails.io.js'
import { URL } from 'url';


export default class SailsClient {

	url: URL
	auth: any
	reconnect: boolean
	socket: any
	cookies: any
	endpoint: any
	io: any
	listeners: Array<{event: string, method: any}>
	token: string

	constructor(args: {
		url?: string,
		protocol?: string,
		auth?: any,
		token?: string
	}) {
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
		if (args.token) {
			this.setToken(args.token)
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
	
	on(event: string, method: Function) {
		this.listeners.push({
			event, method
		})
		if (this.isConnected() === true) {
			this.socket.on(event, method)
		}
	}
	public setToken(token: string) {
		this.token = token
	}
	public getToken() {
		return this.token
	}
	public async getCookie() {
		const response = await this.request({
			uri: this.url.origin + '/__getcookie',
			method: 'GET'
		})
		this.cookies = response.headers['set-cookie']
	}

	async authenticate(auth?: {
		endpoint: string,
		usernameField: string,
		passwordField: string,
		username: string,
		password: string,
		response: any
	}) {
		const response = await this.post(auth.endpoint, {
			[auth.usernameField]: auth.username,
			[auth.passwordField]: auth.password
		})
		auth.response = response
		return auth
	}

	async get(path: string, params: object) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'GET',
			body: params,
			json: true
		})
		return response.body
	}
	
	async post(path: string, params: object) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'POST',
			body: params,
			json: true
		})
		return response.body
	}

	async put(path: string, params: object) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'PUT',
			body: params,
			json: true
		})
		return response.body
	}

	async patch(path: string, params: object) {
		const response = await this.request({
			uri: this.url.href + path,
			method: 'PATCH',
			body: params,
			json: true
		})
		return response.body
	}

	async delete(path: string, params: object) {
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
		if (typeof params.formData === 'undefined' && this.isConnected() === true) {
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
		this.io.sails.environment = 'production'
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
			const token = this.getToken()
			if (typeof token !== 'undefined') {
				params.headers['Authorization'] = token
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

	public async xhrRequest(params:any) {
		if (typeof params.headers == 'undefined') {
			params.headers = {}
		}
		const token = this.getToken()
		if (typeof token !== 'undefined') {
			params.headers['Authorization'] = `Bearer ${token}`
		}
		if (params.method.toLowerCase() === 'get') {
			params.qs = params.body
			delete(params.body)
		}
		params.resolveWithFullResponse = true
		const result = await rp(params)
		return result
	}
}
