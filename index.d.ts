import { APIOptions } from "./public/RapixCore";
interface rapixReturns {
    onSuccess: (response?: any) => rapixReturns;
    onError: (error?: any) => rapixReturns;
    always: (response?: any) => rapixReturns;
    abort: () => {};
    then: (onSuccess?: (response?: any) => any, onError?: (error?: any) => any) => rapixReturns;
}
declare const rapix: (props: APIOptions) => {
    [key: string]: (props?: any) => rapixReturns;
};
export default rapix;
