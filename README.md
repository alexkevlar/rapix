# RAPIX

Javascript API consumer

### Features

- Centralize API fetch methods
- Make XMLHttpRequests from the browser
- Transform response data
- Cancel requests
- Caching response data
- Prevent multiple request
- Mock response data

<br/><br/>

## Available Scripts

In the project directory, you can run:

```
npm i rapix
```
or
```
yarn add rapix
```

<br/>

### How to use Rapix

<br/>

Step 1)<br/>Import library:

```javascript
import rapix from "rapix";
```

<br/>

Step 2)<br/>Init configuration <strong>settings</strong> and APIs <strong>collection</strong>:
```javascript
const APIs = rapix({

    settings: () => ({
        baseURL: 'http://127.0.0.1:8000' // required
    }),

    collection: ({
        login: (payload = {username: '', password: ''}) => ({
            url: '/api/v1/signin', // required
            method: "POST",        // default is GET ('GET'|'POST'|'PUT'|'DELETE'|'PATCH')
            body: payload,
            onSuccess: (response) => {
                // do something
            },
            onError: (error) => {
                // do something
            }
        })
    })

})
```

<br/>

Step 3)<br/>Call a declared method:

```javascript
APIs.login({username: 'example@email.com', password: 'sil3nce1sG0lden'});
```

<br/>
Step 4)<br/>Enjoy.

<br/><br/><br/>

## Settings configuration

```javascript
({
    // `baseURL` is the server URL that will be used for the request
    baseURL: 'http://127.0.0.1:8000', // required
    
    // `fetchRemote` indicates whether or not the fetch should be to remote address.
    // If false the repsonse will be taken from the local mock
    fetchRemote: true, // default

    // `headers` are custom headers to be sent
    headers: {
        'Content-Type': 'application/json' // default
    },

    // `debug` indicates whether or not to log outcoming and incoming data in console
    debug: false, // default

    // `cache` indicates if response data must be kept in cache for a time
    // Only applicable for GET request method
    cache: false, // default

    // `cacheTime` indicates the number of seconds before each call will respond with the data in cache
    // If `cache` is false, cacheTime will be ignored.
    cacheTime: 300, // default

    // `validateStatus` defines whether to resolve or reject the promise for a given
    // HTTP response status code. If `validateStatus` returns `true` the promise will be resolved;
    // otherwise, the promise will be rejected.
    validateStatus: (status:number) => {
        return status >= 200 && status < 300; // default
    },

    // `transformResponse` allows changes to the response data to be made before
    // it is passed to then/catch
    transformResponse: r => r.result,
    
    // `timeout` specifies the number of milliseconds before the request times out.
    // If the request takes longer than `timeout`, the request will be aborted.
    timeout: 0 // default is `0` (no timeout)
})
```

<br/>

## Collection configuration


```javascript
({
    example: (payload = {foo: '', bar: ''}) => ({
        
        // `url` is the endpoint that will be used for the request
        // `baseURL` in settings will be prepended to `url` unless `url` is absolute.
        url: '/api/v1/signin', // required

        // `method` is the request method to be used when making the request
        //  Supported options are: 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
        method: "POST", // default is GET 

        // `body` is the data to be sent as the request body
        // Only applicable for request methods 'PUT', 'POST', 'DELETE , and 'PATCH'
        body: payload,

        // `test` defines whether to make a call after test is passed.
        // If `test` returns `true` the call will start;
        // otherwise, the call will be stopped.
        test: () => {
            return 'foo'.length > 1;
        },
        
        // `onSuccess` is the callback that will run after a success call
        onSuccess: (response) => {
            // do something
        },

        // `onError` is the callback that will run after a failing call
        onError: (error) => {
            // do something
        },

        // `always` is the callback that will run after any response
        always: (error) => {
            // do something
        },

        // `retryIf` defines whether to retry a call.
        // If `retryIf` returns `true` the same call will be repeated;
        retryIf: (data, response) => {
            return response.status === 503
        },
      
        // `cacheTime` indicates the number of seconds before each call will respond with the data in cache.
        // Set cacheTime to 0 if you don't want to cache the response.
        cacheTime: 300, // default is setted in settings configuration

        // `timeout` specifies the number of milliseconds before the request times out.
        // If the request takes longer than `timeout`, the request will be aborted.
        timeout: 0, // default is setted in settings configuration

        // `transformResponse` allows changes to the response data to be made before
        // it is passed to then/catch
        transformResponse: (response) => {
            // Example of capitalizing a string
            response.name = response.name.toLowerCase().replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase());
            return response;
        },
			
        // `mock` defines the mock rules.
        // The mock response will be used if `fetchRemote` parameter
        // in settings will be setted to false
        mock: {
            
            // `success` defines the content of a successful simulated response.
            success: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InBpcHBvQGdtYWlsLmNvbSIsImp0aSI6IllvTjhRZ2RrOUciLCJpYXQiOjE2MjY2Mzk5NDZ9.V825IGia8hhKC5p7kGFr16WKnczxxdphtOb3dbNAy1Y"
            },

            // `fail` defines the content of a failing simulated response.
            fail: {
                type: "Simulating error", // default is BadRequest
                title: "Server error", // default is an empty string
                status: 500, // default is 400
                detail: "No details", // default is an empty string
                instance: "" // default is the `url` value
            },

            // `forceFail` defines whether to force an error simulation.
            forceFail: false, // default is false

            // `ping` defines a range of latency simulation.
            // It must be an Array of two values or an int Number.
            // It can be setted to 0 to avoid the laggy response.
            ping: [400, 600] // default is [350, 500]
            
        }
        
    })
})
```

<br/> 

## Examples

#### Configure settings

```javascript
import { v4 as uuid } from 'uuid';

const APIs = rapix({

    settings: () => ({
        baseURL: 'https://api.yourdomain.com', // required
        'x-correlation-id': uuid(),
        'Authorization': `Bearer ${getToken()}`,
    }),

    collection: ({
        // Put your methods here
    })
    
})
```

<br/>

#### Using mock responses and ping parameter to simulate the server latency

```javascript
// Configure your collection
getUsers: () => ({
    url: "/api/v1/users",
    mock: {
        success: [
            { firstname: 'Jason', age: 33 },
            { firstname: 'Mark', age: 27 },
            { firstname: 'Carl', age: 42 }
        ],
        ping: [400, 600] // we can simulate laggy server response
    }
})

// Call the method wherever you want
APIs.getUsers().then((response) => {
    console.log(response);
}, (error) => {
    console.error(error);
});

// or

APIs.getUsers()
    .onSuccess((response) => {
        console.log(response);
    })
    .onError((error) => {
        console.error(error);
    });
```


Output:
```
[
    { firstname: 'Jason', age: 33 },
    { firstname: 'Mark', age: 27 },
    { firstname: 'Carl', age: 42 }
]
```

<br/><br/>

#### Simulate a request KO

```javascript
getUsers: () => ({
    url: "/api/v1/users",
    mock: {
        success: [
            { firstname: 'Jason', age: 33 },
            { firstname: 'Mark', age: 27 },
            { firstname: 'Carl', age: 42 }
        ],
        fail: {
            detail: 'Simulated error'
        },
        forceFail: true,
        ping: [400, 600]
    }
})

APIs.getUsers()
    .onSuccess((response) => {
        console.log(response);
    })
    .onError((error) => {
        console.error(error);
    });
```

Output:
```
{
    "type": "Bad Request",
    "title": "",
    "status": 400,
    "detail": "Simulated error",
    "instance": "/api/v1/users"
}
```

<br/>

### Notes:

Each response will be provided with additional information such as:

```javascript
__cached: false // indicates whether the response was taken from the cache
__ping: 640 // indicates the time between the start and the end of the call
__reqTime: 1643138102348 // is the timestamp of the request
__resTime: 1643138102989// is the timestamp of the response
```

or


```javascript
__cached: true
__cacheExp: 1643138501495
__ping: 0
__reqTime: 1643138502422
__resTime: 1643138502422
```

<br/>

### Abort request

Cancel a request is very easy

```javascript
let myRequest = APIs.getUsers();
```
```javascript
myRequest.abort();
```
