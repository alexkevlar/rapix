import {
  ApiClass,
  APIOptionsDefaults,
  ConfigOptions,
  EndpointFn,
  ResponseFullData
} from "./public/RapixCore";



export type RapixRichResponse<T> = ResponseFullData<T>

export type RapixResponse<T> = {
  response: T
  __original: any,
  __reqTime: number,
  __resTime: number,
  __ping: number,
  __cached: boolean
}

export interface RapixProps<E> {
  onSuccess: (callback?: (data: RapixResponse<E>, fullResponse: RapixRichResponse<E>) => any) => RapixProps<E>,
  onError: (callback?: (data: RapixResponse<E>, fullResponse: RapixRichResponse<E>) => any) => RapixProps<E>,
  always: (response?: any) => RapixProps<E>,
  abort: () => {},
  then: (onSuccess?: (data: E, fullResponse: RapixRichResponse<E>) => any, onError?: (data: E, fullResponse: RapixRichResponse<E>) => any) => RapixProps<E>
}


type FunctionWithProps<T> = T extends (props: infer P) => any ? <T>(params?: P) => RapixProps<T> : never;

type ResponseMap<C> = {
  [F in keyof C]: FunctionWithProps<C[F]>;
};

export function rapix<C extends Record<string, EndpointFn>>(props: {
  settings: (params?: any) => ConfigOptions,
  collection: C
}): ResponseMap<C> {
  return new ApiClass({ ...APIOptionsDefaults, ...props }).collection as ResponseMap<C>;
}


export function cascade(props: Array<(prevCallResponse?: any) => RapixProps<any>>, callbacks?: [(success: any, error?: any) => void]): Promise<any> {

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
        if (typeof props[number + 1] === "function") {
          makeCall(number + 1, successResponse);
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

