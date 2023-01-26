import { APIOptions } from "./public/RapixCore";
export interface RapixProps {
    onSuccess: (response?: any) => RapixProps;
    onError: (error?: any) => RapixProps;
    always: (response?: any) => RapixProps;
    abort: () => {};
    then: (onSuccess?: (response?: any) => any, onError?: (error?: any) => any) => RapixProps;
}
declare function rapix<O extends APIOptions>(props: O): {
    [K in keyof O["collection"]]: (props?: any) => RapixProps;
};
export declare function cascade(props: Array<(prevCallResponse?: any) => RapixProps>, callbacks?: [(success: any, error?: any) => void]): Promise<any>;
export default rapix;
