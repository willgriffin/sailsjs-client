"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rp = require("request-promise");
const SocketIo = require("socket.io-client");
const SailsIo = require("sails.io.js");
const url_1 = require("url");
class SailsClient {
    constructor(args) {
        this.url = new url_1.URL(args.url || 'http://localhost:1337/api/');
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
            };
        }
        if (args.token) {
            this.setToken(args.token);
        }
        this.reconnect = true;
        this.listeners = [];
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getCookie();
            yield this.socketInit();
            yield this.connect();
            if (this.auth) {
                yield this.authenticate();
            }
        });
    }
    on(event, method) {
        this.listeners.push({
            event, method
        });
        if (this.isConnected() === true) {
            this.socket.on(event, method);
        }
    }
    setToken(token) {
        this.token = token;
    }
    getToken() {
        return this.token;
    }
    getCookie() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.origin + '/__getcookie',
                method: 'GET'
            });
            this.cookies = response.headers['set-cookie'];
        });
    }
    authenticate(auth) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post(auth.endpoint, {
                [auth.usernameField]: auth.username,
                [auth.passwordField]: auth.password
            });
            auth.response = response;
            return auth;
        });
    }
    get(path, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + path,
                method: 'GET',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    post(path, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + path,
                method: 'POST',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    put(path, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + path,
                method: 'PUT',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    patch(path, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + path,
                method: 'PATCH',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    delete(path, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + path,
                method: 'DELETE',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    request(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            if (typeof params.formData === 'undefined' && this.isConnected() === true) {
                response = yield this.socketRequest(params);
            }
            else {
                response = yield this.xhrRequest(params);
            }
            if (response.statusCode !== 200) {
                throw new Error(`[${response.statusCode}] ${response.body}`);
            }
            return response;
        });
    }
    socketInit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.io = new SailsIo(SocketIo);
            this.io.sails.initialConnectionHeaders = {
                'cookie': this.cookies,
            };
            this.io.sails.url = this.url.origin;
            this.io.sails.autoConnect = false;
            this.io.sails.reconnection = this.reconnect;
            this.io.sails.environment = 'production';
        });
    }
    isConnected() {
        if (typeof this.socket === 'undefined') {
            return false;
        }
        else {
            return this.socket.isConnected();
        }
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected() === false) {
                return new Promise((resolve, reject) => {
                    this.socket = this.io.sails.connect();
                    for (const listener of this.listeners) {
                        this.socket.on(listener.event, listener.method);
                    }
                    this.socket.on('connect', (data) => {
                        resolve(true);
                    });
                });
            }
            else {
                console.warn('Already connected');
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected() === true) {
                return new Promise((resolve, reject) => {
                    this.socket.on('disconnect', (data) => __awaiter(this, void 0, void 0, function* () {
                        resolve(true);
                    }));
                    this.socket.disconnect();
                });
            }
            else {
                console.warn('already disconnected');
            }
        });
    }
    socketRequest(params) {
        console.log('socketRequest', params);
        return new Promise((resolve, reject) => {
            if (typeof params.headers === 'undefined') {
                params.headers = {};
            }
            const token = this.getToken();
            if (typeof token !== 'undefined') {
                params.headers['Authorization'] = token;
            }
            try {
                this.socket.request({
                    method: params.method || 'GET',
                    url: params.uri,
                    data: params.body,
                    headers: params.headers
                }, function (body, jwr) {
                    return resolve(jwr);
                });
            }
            catch (err) {
                return reject(err);
            }
        });
    }
    xhrRequest(params) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('xhrRequest', params);
            if (typeof params.headers == 'undefined') {
                params.headers = {};
            }
            const token = this.getToken();
            if (typeof token !== 'undefined') {
                params.headers['Authorization'] = `Bearer ${token}`;
            }
            params.resolveWithFullResponse = true;
            const result = yield rp(params);
            return result;
        });
    }
}
exports.default = SailsClient;
