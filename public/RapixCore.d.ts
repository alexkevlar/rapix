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
    };
    cacheToClearAfter?: Array<string> | string;
    onSuccess?: (responseData?: object, response?: any) => void;
    retryIf?: (responseData?: object, response?: any) => boolean;
    test?: (data: object) => void;
    always?: (responseData?: object, response?: any) => void;
    onError?: (error?: object, response?: any) => void;
    mock?: {
        success: {
            status?: number;
            [key: string]: any;
        };
        fail?: failOption;
        forceFail?: boolean;
        ping?: [number, number?] | number;
    };
    transformResponse?: (response: {
        [key: string]: any;
    }) => object;
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
    transformResponse?: (r: any) => {};
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
