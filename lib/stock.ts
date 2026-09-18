import type { InventoryItem } from "./types";

export const LOW_STOCK_QTY = 50;

export function isLowStock(item: InventoryItem): boolean {
  return item.qty <= LOW_STOCK_QTY;
}

export const RESTOCK_QTY = 100;
