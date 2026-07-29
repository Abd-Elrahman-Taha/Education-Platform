/**
 * Generic Fake REST API Client with simulated network latency (500–1000ms).
 * Easily replaceable by a real fetch/axios client in the future without changing feature code.
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export async function fakeApiCall<T>(
  dataFetcher: () => T,
  delayMs?: number
): Promise<ApiResponse<T>> {
  const actualDelay = delayMs ?? Math.floor(Math.random() * 500) + 500; // 500-1000ms

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = dataFetcher();
        resolve({
          data: result,
          status: 200,
          message: 'Success',
        });
      } catch (err: any) {
        reject({
          data: null,
          status: 500,
          message: err?.message || 'Internal Server Error',
        });
      }
    }, actualDelay);
  });
}
