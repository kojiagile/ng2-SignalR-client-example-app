import { ChatMessage } from '../../models/chat-message.model';
import { Subject } from 'rxjs/Subject';
import { Injectable } from '@angular/core';
// import { Observable } from "rxjs/Observable";
// import 'rxjs/add/observable/fromPromise';
import { Observable } from 'rxjs/Rx';



declare var $: any;

export class ConnectionOptions {
    // SignalR server URL
    public url: string;
    public hubName: string;
    public withCredentials?: boolean;
    public queries?: any;
    public allowJsonp?: boolean;
    public transport?: ConnectionTransportType[];
    constructor() {}
}

export enum ConnectionTransportType {
    webSockets,
    foreverFrame,
    serverSentEvents,
    longPolling
}

export class ErrorMessages {
    public static ErrMsgNoOptions: string = 'Connection options not found. An options is required to connect to a SignalR Hub';
    public static ErrMsgNoUrl: string     = 'SignalR server URL not found.';
    public static ErrMsgNoHubName: string = 'Hub name not found.'
    public static ErrMsgNojQuery: string  = 'jQuery not found. Ng2SignalRClientService requires jQuery. Ensure that jQuery is installed and available.'
    public static ErrMsgNoSignalR: string = 'SignalR not found. Ng2SignalRClientService requires SignalR. Ensure that SignalR is installed and available.'
}

class ConnectionTransport {
    public webSockets: string = 'webSockets';
    public foreverFrame: string = 'foreverFrame';
    public serverSentEvents: string = 'serverSentEvents';
    public longPolling: string = 'longPolling';
}


@Injectable()
export class Ng2SignalRClientService {
    public connectionOptions: ConnectionOptions = null;
    public connection: Observable<any> = null;
    public hubProxy: any = null;

    // public temphubName = 'Ng2SignalRHub';
    // public tempurl = 'http://ng2-signalr-backend.azurewebsites.net/';
    public temphubName = 'SignalRExampleHub';
    public tempurl = 'http://localhost:56768'

    private connection$: any = null;
    private connectionSubject: Subject<any> = new Subject();
    private listnerSubject = new Subject();

    constructor() {
        this.connection = this.connectionSubject.asObservable();
    }

    public connect(connectionOptions?: ConnectionOptions) {
        this.validation(connectionOptions);
        if (connectionOptions != null) {
            this.connectionOptions = connectionOptions;
        }

        this.connection$ = $.hubConnection(this.connectionOptions.url);
        
        // TODO: Keep hub proxy in an array. One connection can have multiple hubs
        // Get Hub proxy for later use (invoke a server method in SignalR server)
        this.hubProxy = this.connection$.createHubProxy(this.connectionOptions.hubName);

        // At least one method (any method) needs to be listened BEFORE connection starts...
        this.hubProxy.on('dummy', (...args: any[]) => {});

        // return Observable.fromPromise(this.connection$.start()
        this.connection$.start()
            .done( (conn) => {
                console.log('connected');
                // console.log(conn);
                this.connectionSubject.next(conn);
            })
            .fail( (error) => {
                console.log(error);
                this.connectionSubject.error(error);
            });

        return this.connection;
    }

    // public listen(methodName: string, func: any) {
    //     const self = this;
    //     this.hubProxy.on(methodName, (...args: any[]) => {
    //         func(...args);
    //     });
    // }

    public listen(methodName: string) {
        // Register a method that a signalR server calls.
        // this.hubProxy.on(methodName, (...args: any[]) => {
        this.hubProxy.on(methodName, (args: ChatMessage) => {
            console.log('hey');
            console.log(args);
            // self.test(arguments);
            // self.test(...args);
            
            this.listnerSubject.next(args);
        });

        return this.listnerSubject.asObservable();
    }
    
    public test(...args: any[]) {
        console.log('heyhey');
        console.log(args);
    }

    public invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return Observable.fromPromise<T>(
            this.hubProxy
                .invoke(methodName, ...args)
                .catch( (error) => {
                    console.log("Failed to invoke " + methodName + ". Error occured. " + error);
                    throw error;
                })
            )
            .catch(error => {
                return Observable.throw(error);
            });
    }

    public disconnect() {

    }

    private validation(connectionOptions?: ConnectionOptions) {
        if (connectionOptions != null) {
            this.connectionOptions = connectionOptions;
        }

        if (this.connectionOptions == null) {
            throw new Error(ErrorMessages.ErrMsgNoOptions);
        } else if (this.connectionOptions.url == null || this.connectionOptions.url == '') {
            throw new Error(ErrorMessages.ErrMsgNoUrl);
        } else if (this.connectionOptions.hubName == null || this.connectionOptions.hubName == '') {
            throw new Error(ErrorMessages.ErrMsgNoHubName);
        } else if ($ === undefined) {
            throw new Error(ErrorMessages.ErrMsgNojQuery);
        } else if ($.hubConnection === undefined) {
            throw new Error(ErrorMessages.ErrMsgNoSignalR);
        }

    }

}

