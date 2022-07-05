import {API_class, APIOptions, APIOptionsDefaults} from "./public/RapixCore";

export interface RapixProps {
  onSuccess: (response?: any) => RapixProps,
  onError: (error?: any) => RapixProps,
  always: (response?: any) => RapixProps,
  abort: () => {},
  then: (onSuccess?: (response?: any) => any, onError?: (error?: any) => any) => RapixProps
}

function rapix<O extends APIOptions> (props: O): { [K in keyof O["collection"]]: (props?: any ) => RapixProps } {
  return new API_class({...APIOptionsDefaults, ...props}).collection;
}


export function cascade(props: Array<(prevCallResponse?: any) => RapixProps>, callbacks?: [(success: any, error?: any) => void]):Promise<any> {
  
  let countCalls = 0;
  let successes = 0;
  let results: any[] = [];
  
  return new Promise((resolve, reject) => {
    
    function checkResults() {
      if (countCalls === props.length) {
        if (countCalls === successes) {
          resolve(results);
        } else {
          reject(results)
        }
      }
    }
    
    function makeCall(number: number, params?: any) {
  
      let successResponse: any;
      
      props[number](params).onSuccess((r: any) => {
        if (callbacks && typeof callbacks[number] === "function") callbacks[number](r)
        successResponse = r;
        successes++;
        results.push(r);
        if (typeof props[number+1] === "function") {
          makeCall(number+1, successResponse);
        }
      }).onError((e: any) => {
        if (callbacks && typeof callbacks[number] === "function") callbacks[number](undefined, e)
        results.push(e);
        reject(results);
      }).always(() => {
        countCalls++;
        checkResults();
      });
      
    }
  
    makeCall(0);
    
  })
  
}


export default rapix;
