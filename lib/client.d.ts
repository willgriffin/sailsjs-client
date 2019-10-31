/// <reference types="node" />
import { URL } from 'url';
export default class SailsClient {
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
    constructor(args: any);
    init(): Promise<void>;
    on(event: any, method: any): void;
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
    get(path: string, params: object): Promise<any>;
    post(path: string, params: object): Promise<any>;
    put(path: string, params: object): Promise<any>;
    patch(path: string, params: object): Promise<any>;
    delete(path: string, params: object): Promise<any>;
    request(params: any): Promise<any>;
    socketInit(): Promise<void>;
    isConnected(): any;
    connect(): Promise<unknown>;
    disconnect(): Promise<unknown>;
    socketRequest(params: any): Promise<unknown>;
    xhrRequest(params: any): Promise<unknown>;
}
