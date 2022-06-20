import { APIOptions } from "./public/RapixCore";
interface rapixReturns {
    onSuccess: (response?: any) => rapixReturns;
    onError: (error?: any) => rapixReturns;
    always: (response?: any) => rapixReturns;
    abort: () => {};
    then: (onSuccess?: (response?: any) => any, onError?: (error?: any) => any) => rapixReturns;
}
declare function rapix<O extends APIOptions>(props: O): {
    [K in keyof O["collection"]]: (props?: any) => rapixReturns;
};
export declare function cascade(props: Array<(prevCallResponse?: any) => rapixReturns>, callbacks?: [(success: any, error?: any) => void]): Promise<any>;
export default rapix;
