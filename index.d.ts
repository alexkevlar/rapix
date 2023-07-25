import { ConfigOptions, EndpointOptions, ResponseFullData } from "./public/RapixCore";
export declare type RapixRichResponse<T> = ResponseFullData<T>;
export declare type RapixResponse<T> = {
    response: T;
    __original: any;
    __reqTime: number;
    __resTime: number;
    __ping: number;
    __cached: boolean;
};
export interface RapixProps<E> {
    onSuccess: (callback?: (data: RapixResponse<E>, fullResponse: RapixRichResponse<E>) => any) => RapixProps<E>;
    onError: (callback?: (data: RapixResponse<E>, fullResponse: RapixRichResponse<E>) => any) => RapixProps<E>;
    always: (response?: any) => RapixProps<E>;
    abort: () => {};
    then: (onSuccess?: (data: E, fullResponse: RapixRichResponse<E>) => any, onError?: (data: E, fullResponse: RapixRichResponse<E>) => any) => RapixProps<E>;
}
declare type EndpointFn = (props?: any) => EndpointOptions;
declare type FunctionWithProps<T> = T extends (props: infer P) => any ? <T>(params?: P) => RapixProps<T> : never;
declare type ResponseMap<C> = {
    [F in keyof C]: FunctionWithProps<C[F]>;
};
export declare function rapix<C extends Record<string, EndpointFn>>(props: {
    settings: (params?: any) => ConfigOptions;
    collection: C;
}): ResponseMap<C>;
export declare function cascade(props: Array<(prevCallResponse?: any) => RapixProps<any>>, callbacks?: [(success: any, error?: any) => void]): Promise<any>;
export {};
