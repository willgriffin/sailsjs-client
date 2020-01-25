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
const fs = require("fs");
const path = require("path");
class SailsClient {
    constructor(args) {
        this.debug = args.debug || false;
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
    get(endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + endpoint,
                method: 'GET',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    post(endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let formData = {};
            let body = {};
            for (let param in params) {
                if (typeof params[param] == 'string' && params[param].substr(0, 6) === 'file:/') {
                    const file = params[param].substr(6, params[param].length);
                    if (fs.existsSync(file) === false) {
                        throw new Error(`File not found ${file}`);
                    }
                    formData[param] = {
                        value: fs.createReadStream(file),
                        options: {
                            filename: path.basename(file)
                        }
                    };
                }
                else {
                    body[param] = params[param];
                }
            }
            if (Object.keys(formData).length > 0) {
                formData = Object.assign(formData, body);
                body = undefined;
            }
            else {
                formData = undefined;
            }
            const response = yield this.request({
                uri: this.url.href + endpoint,
                method: 'POST',
                body,
                formData,
                json: true
            });
            return response.body;
        });
    }
    optionsFormdata(options) {
        const out = {};
        if (options.files) {
            for (let x in options.files) {
                let fieldname = 'uploaded';
                const file = options.files[x];
                const fileOut = {};
                if (typeof file === 'string') {
                    fileOut.options = {
                        filename: path.basename(file)
                    };
                    fileOut.value = fs.createReadStream(file);
                }
                else if (typeof file === 'object') {
                    fileOut.value = fs.createReadStream(file.file);
                    fileOut.options = {
                        filename: file.filename || path.basename(file.file)
                    };
                }
                if (options.fieldname) {
                    fieldname = options.fieldname;
                    delete options.fieldname;
                }
                out[fieldname] = fileOut;
            }
        }
        return out;
    }
    put(endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + endpoint,
                method: 'PUT',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    patch(endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + endpoint,
                method: 'PATCH',
                body: params,
                json: true
            });
            return response.body;
        });
    }
    delete(endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                uri: this.url.href + endpoint,
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
            if (SocketIo.sails) {
                this.io = SocketIo
            } else {
                this.io = SailsIo(SocketIo);
            }

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
        return new Promise((resolve, reject) => {
            if (typeof params.headers === 'undefined') {
                params.headers = {};
            }
            const token = this.getToken();
            if (typeof token !== 'undefined') {
                //params.headers['Authorization'] = token
                params.body.token = token;
            }
            try {
                const requestParams = {
                    method: params.method || 'GET',
                    url: params.uri,
                    data: params.body,
                    headers: params.headers
                };
                this.debuglog("============================== SOCKET REQUEST\n", requestParams);
                const self = this;
                this.socket.request(requestParams, function (body, jwr) {
                    self.debuglog("============================== SOCKET REQUEST RESULT\n", requestParams);
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
            if (typeof params.headers == 'undefined') {
                params.headers = {};
            }
            const token = this.getToken();
            if (typeof token !== 'undefined') {
                params.headers['Authorization'] = `Bearer ${token}`;
            }
            if (params.method.toLowerCase() === 'get') {
                params.qs = params.body;
                delete (params.body);
            }
            params.resolveWithFullResponse = true;
            this.debuglog("============================== XHR REQUEST\n", params);
            const result = yield rp(params);
            this.debuglog("============================== XHR REQUEST RESULT\n", params);
            return result;
        });
    }
    debuglog(...args) {
        if (this.debug) {
            console.log(...args);
        }
    }
}
exports.default = SailsClient;
