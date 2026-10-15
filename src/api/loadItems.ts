import type { TreeItem } from '../store/TreeStore';

export const LOAD_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Imitates a server request: the data is fetched at runtime after an artificial delay. */
export async function loadItems(url = `${import.meta.env.BASE_URL}items.json`, delayMs = LOAD_DELAY_MS): Promise<TreeItem[]> {
  await sleep(delayMs);
  const response = await fetch(url);
  return (await response.json()) as TreeItem[];
}
