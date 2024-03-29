import { RapixResponse } from "../index";
export declare type methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'TRACE' | 'CONNECT';
interface FailOption {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    [key: string]: any;
}
export declare type DataTypes = Record<string, any> | any;
export declare type ResponseFullData<T> = {
    data: RapixResponse<T>;
    headers: Record<string, any>;
    request: Record<string, any>;
    status: number;
    statusText: string;
};
export interface EndpointOptions {
    url: string;
    method?: methods;
    headers?: {
        [key: string]: any;
    };
    body?: DataTypes;
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
        fail?: FailOption;
        forceFail?: boolean;
        ping?: [number, number?] | number;
    };
    transformResponse?: (original: any, response: any) => any;
    cacheTime?: number;
    timeout?: number;
    fetchRemote?: boolean;
}
export interface ConfigOptions {
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
export declare type EndpointFn = (props?: any, ...rest: any) => EndpointOptions;
export interface APIOptions {
    settings: (params?: any) => ConfigOptions;
    collection: Record<string, EndpointFn>;
}
export declare class ApiClass {
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
