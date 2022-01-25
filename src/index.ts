import {API_class, APIOptions, APIOptionsDefaults} from "./public/RapixCore";

interface rapixReturns {
  onSuccess: (response?: any) => rapixReturns,
  onError: (error?: any) => rapixReturns,
  always: (response?: any) => rapixReturns,
  abort: () => {},
  then: (onSuccess?: (response?: any) => any, onError?: (error?: any) => any) => rapixReturns
}

const rapix = (props: APIOptions): { [key: string]: (props?:any) => rapixReturns } => {
  return new API_class({...APIOptionsDefaults, ...props}).collection;
}

export default rapix;
