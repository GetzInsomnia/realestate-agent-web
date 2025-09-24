import type { SWRConfiguration } from 'swr';

export const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  shouldRetryOnError: false,
  dedupingInterval: 60_000,
  fetcher: async (key: string) => {
    const response = await fetch(key);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
  },
};

export function createStaticKey(namespace: string, id?: string) {
  return id ? `${namespace}:${id}` : namespace;
}
