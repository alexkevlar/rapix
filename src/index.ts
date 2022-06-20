import {API_class, APIOptions, APIOptionsDefaults} from "./public/RapixCore";

interface rapixReturns {
  onSuccess: (response?: any) => rapixReturns,
  onError: (error?: any) => rapixReturns,
  always: (response?: any) => rapixReturns,
  abort: () => {},
  then: (onSuccess?: (response?: any) => any, onError?: (error?: any) => any) => rapixReturns
}

function rapix<O extends APIOptions> (props: O): { [K in keyof O["collection"]]: (props?: any ) => rapixReturns } {
  return new API_class({...APIOptionsDefaults, ...props}).collection;
}


export function cascade(props: Array<(prevCallResponse?: any) => rapixReturns>, callbacks?: [(success: any, error?: any) => void]):Promise<any> {
  
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
