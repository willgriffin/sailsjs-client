/// <reference types="node" />
import { URL } from 'url';
export default class SailsClient {
    debug: boolean;
    url: URL;
    auth: any;
    reconnect: boolean;
    socket: any;
    cookies: any;
    endpoint: any;
    io: any;
    listeners: Array<{
        event: string;
        method: any;
    }>;
    token: string;
    constructor(args: {
        url?: string;
        protocol?: string;
        auth?: any;
        token?: string;
        debug?: boolean;
    });
    init(): Promise<void>;
    on(event: string, method: Function): void;
    setToken(token: string): void;
    getToken(): string;
    getCookie(): Promise<void>;
    authenticate(auth?: {
        endpoint: string;
        usernameField: string;
        passwordField: string;
        username: string;
        password: string;
        response: any;
    }): Promise<{
        endpoint: string;
        usernameField: string;
        passwordField: string;
        username: string;
        password: string;
        response: any;
    }>;
    get(endpoint: string, params: object): Promise<any>;
    post(endpoint: string, params: object): Promise<any>;
    optionsFormdata(options: any): {};
    put(endpoint: string, params: object): Promise<any>;
    patch(endpoint: string, params: object): Promise<any>;
    delete(endpoint: string, params: object): Promise<any>;
    request(params: any): Promise<any>;
    socketInit(): Promise<void>;
    isConnected(): any;
    connect(): Promise<unknown>;
    disconnect(): Promise<unknown>;
    socketRequest(params: any): Promise<unknown>;
    xhrRequest(params: any): Promise<any>;
    private debuglog;
}
