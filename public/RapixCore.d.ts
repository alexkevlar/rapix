interface failOption {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    [key: string]: any;
}
interface endpointOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: {
        [key: string]: any;
    };
    body?: {
        [key: string]: any;
    } | string;
    cacheToClearAfter?: Array<string> | string;
    onSuccess?: (responseData?: any, response?: any) => void;
    retryIf?: (responseData?: any, response?: any) => boolean;
    test?: (data: any) => boolean;
    always?: (responseData?: any, response?: any) => void;
    onError?: (error?: any, response?: any) => void;
    mock?: {
        success?: {
            status?: number;
            [key: string]: any;
        };
        fail?: failOption;
        forceFail?: boolean;
        ping?: [number, number?] | number;
    };
    transformResponse?: (response: any) => any;
    cacheTime?: number;
    timeout?: number;
}
interface configOptions {
    baseURL: string;
    fetchRemote?: boolean;
    headers?: object;
    debug?: boolean;
    cache?: boolean;
    cacheTime?: number;
    validateStatus?: (status: number) => boolean;
    transformResponse?: (r: any) => any;
    timeout?: number;
}
export interface APIOptions {
    settings: (params?: any) => configOptions;
    collection: {
        [key: string]: (props?: any) => endpointOptions;
    };
}
export declare class API_class {
    readonly collection: any;
    private readonly call;
    private readonly fetchAPI;
    private readonly pendingPromise;
    constructor(props: {
        settings: any;
        collection: any;
    });
}
export declare const APIOptionsDefaults: APIOptions;
export {};
