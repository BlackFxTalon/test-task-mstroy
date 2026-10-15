import type { ITreeItem } from '../store/TreeStore';

export const LOAD_DELAY_MS = 2000;

export const BASE_URL = `${import.meta.env.BASE_URL}items.json`;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function loadItems(url = BASE_URL, delayMs = LOAD_DELAY_MS): Promise<ITreeItem[]> {
  await sleep(delayMs);
  const response = await fetch(url);
  return (await response.json()) as ITreeItem[];
}
