import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../data.js';

/*
 * Sends a POST request to the Gartic Hands API.
 *
 * Keeping API requests in one helper makes the individual scenarios
 * easier to read and means the base URL can be changed without
 * modifying every test.
 */
export function post(path, body, tags = {}) {
    return http.post(
        `${BASE_URL}${path}`,
        JSON.stringify(body),
        {
            headers: {
                'Content-Type': 'application/json',
            },
            tags,
        },
    );
}

/*
 * Sends a GET request to the Gartic Hands API.
 */
export function get(path, tags = {}) {
    return http.get(
        `${BASE_URL}${path}`,
        {
            tags,
        },
    );
}

/*
 * Sends a PATCH request to the Gartic Hands API.
 */
export function patch(path, body, tags = {}) {
    return http.patch(
        `${BASE_URL}${path}`,
        JSON.stringify(body),
        {
            headers: {
                'Content-Type': 'application/json',
            },
            tags,
        },
    );
}

/*
 * Checks whether an API request completed successfully.
 *
 * k6's built-in HTTP metrics will still record the request even when
 * this check fails. This check simply makes the failure visible in
 * the test output.
 */
export function checkSuccess(response, description) {
    check(response, {
        [`${description}: status is 2xx`]: (r) =>
            r.status >= 200 && r.status < 300,
    });

    return response.status >= 200 && response.status < 300;
}