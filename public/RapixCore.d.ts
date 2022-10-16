export declare type methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'TRACE' | 'CONNECT';
interface failOption {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    [key: string]: any;
}
declare type DataType = string | boolean | number | string[] | boolean[] | number[];
export declare type DataTypes = Record<string, DataType> | DataType;
declare type ResponseFullData = {
    data?: any;
    headers: Record<string, any>;
    request: Record<string, any>;
    status: number;
    statusText: string;
};
export interface endpointOptions {
    url: string;
    method?: methods;
    headers?: {
        [key: string]: any;
    };
    body?: DataTypes;
    cacheToClearAfter?: Array<string> | string;
    onSuccess?: (responseData?: any, response?: ResponseFullData) => void;
    retryIf?: (responseData?: any, response?: any) => boolean;
    test?: (data: any) => boolean;
    always?: (responseData?: any, response?: ResponseFullData) => void;
    onError?: (error?: any, response?: ResponseFullData) => void;
    mock?: {
        success?: {
            status?: number;
            [key: string]: any;
        };
        fail?: failOption;
        forceFail?: boolean;
        ping?: [number, number?] | number;
    };
    transformResponse?: (response: any) => DataTypes;
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
    collection: Record<string, (props?: any) => endpointOptions>;
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
