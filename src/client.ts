import * as rp from 'request-promise'
import * as SocketIo from 'socket.io-client'
import * as SailsIo from 'sails.io.js'
import { URL } from 'url'

import * as fs from 'fs'
import * as path from 'path'
import * as mimeTypes from 'mime-types'

export default class SailsClient {

	debug: boolean
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
		url?: string
		protocol?: string
		auth?: any
		token?: string
		debug?: boolean
	}) {
		this.debug = args.debug || false
		this.url = new URL(args.url || 'http://localhost:1337/api/')
		if (this.url.protocol === null) {
			throw new Error('Invalid url')
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
		this.reconnect = true
		this.listeners = []
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

	async get(endpoint: string, params: object) {
		const response = await this.request({
			uri: this.url.href + endpoint,
			method: 'GET',
			body: params,
			json: true
		})
		return response.body
	}
	
	async post(endpoint: string, params: object) {
		console.log('post')
		let formData = {}
		let body = {}
		for (let param in params) {
			if (typeof params[param] == 'string' && params[param].substr(0,6) === 'file:/') {
				const file = params[param].substr(6, params[param].length)
				if (fs.existsSync(file) === false) {
					throw new Error(`File not found ${file}`)
				}
				formData[param] = {
					value: fs.createReadStream(file),
					options: {
						filename: path.basename(file)
					}
				}
			} else {
				body[param] = params[param]
			}
		}
		if (Object.keys(formData).length > 0) {
			formData = Object.assign(formData, body)
			body = undefined
		} else {
			formData = undefined
		}
		const response = await this.request({
			uri: this.url.href + endpoint,
			method: 'POST',
			body,
			formData,
			json: true
		})
		return response.body
	}
	optionsFormdata(options) {
		const out = {}
		if (options.files) {
			for (let x in options.files) {
				let fieldname = 'uploaded'
				const file = options.files[x]
				const fileOut:{
					value?: any
					options?: {
						filename: string
						contentType?: string
					}
				} = {}
				if (typeof file === 'string') {
					fileOut.options = {
						filename: path.basename(file)
					}
					fileOut.value = fs.createReadStream(file)
				} else if (typeof file === 'object') {
					fileOut.value = fs.createReadStream(file.file)
					fileOut.options = {
						filename: file.filename || path.basename(file.file)
					}
				}
				if (options.fieldname) {
					fieldname = options.fieldname
					delete options.fieldname
				}
				out[fieldname] = fileOut
			}
			console.log(out)
		}
		return out
	}
	async put(endpoint: string, params: object) {
		const response = await this.request({
			uri: this.url.href + endpoint,
			method: 'PUT',
			body: params,
			json: true
		})
		return response.body
	}

	async patch(endpoint: string, params: object) {
		const response = await this.request({
			uri: this.url.href + endpoint,
			method: 'PATCH',
			body: params,
			json: true
		})
		return response.body
	}

	async delete(endpoint: string, params: object) {
		const response = await this.request({
			uri: this.url.href + endpoint,
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
			throw new Error(`[${response.statusCode}] ${response.body}`)
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
		this.io.sails.autoConnect = false
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
				const requestParams = {
					method: params.method || 'GET',
					url: params.uri,
					data: params.body,
					headers: params.headers
				}
				this.debuglog("============================== SOCKET REQUEST\n", requestParams)
				this.socket.request(requestParams, function (body, jwr) {
					this.debuglog("============================== SOCKET REQUEST RESULT\n", requestParams)
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
		this.debuglog("============================== XHR REQUEST\n", params)
		const result = await rp(params)
		this.debuglog("============================== XHR REQUEST RESULT\n", params)
		return result
	}

	private debuglog(...args:any[]) {
		if (this.debug) {
			console.log(...args)
		}
	}
}
