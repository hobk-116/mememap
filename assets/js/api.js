/* Shared JSON transport. UI modules own messages; adapters own authentication navigation. */
(() => {
  class ApiError extends Error {
    constructor(code, status = 0, data = {}) {
      super(code);
      this.name = 'ApiError';
      this.code = code;
      this.status = status;
      this.data = data;
    }
  }

  function createApiClient({baseUrl = '', credentials = 'same-origin', onUnauthorized} = {}) {
    async function request(path, {json, ...options} = {}) {
      const headers = new Headers(options.headers);
      if (json !== undefined) headers.set('Content-Type', 'application/json');
      let response;
      try {
        response = await fetch(baseUrl.replace(/\/$/, '') + path, {
          credentials, ...options, headers,
          ...(json !== undefined ? {body: JSON.stringify(json)} : {}),
        });
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new ApiError('network_error');
      }
      let data;
      try { data = response.status === 204 ? null : await response.json(); }
      catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new ApiError('invalid_response', response.status);
      }
      if (!response.ok) {
        const error = new ApiError(data?.error || 'request_failed', response.status, data || {});
        if (error.code === 'authentication_required') onUnauthorized?.();
        throw error;
      }
      return data;
    }
    return {request};
  }
  Object.assign(MemeMap, {ApiError, createApiClient,
    isSessionError: error => error.code === 'authentication_required'});
})();
