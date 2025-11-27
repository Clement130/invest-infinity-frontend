import { supabase } from '../lib/supabaseClient';

export type StoreItemType = 'theme' | 'booster' | 'freeze_pass' | 'avatar';

export interface StoreItem {
  id: string;
  name: string;
  description?: string | null;
  type: StoreItemType;
  cost: number;
  metadata: Record<string, unknown>;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: StoreItemType;
  quantity: number;
  equipped: boolean;
  metadata: Record<string, unknown>;
  acquiredAt: string;
  themeKey?: string;
}

export interface Wallet {
  focusCoins: number;
  totalEarned: number;
}

export interface EconomyEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
export async function grantFocusCoins(userId: string, delta: number): Promise<number> {
  if (!userId || delta === 0) {
    return 0;
  }

  const { data, error } = await supabase.rpc('adjust_focus_coins', {
    p_user_id: userId,
    p_delta: delta,
  });

  if (error) {
    console.error('[grantFocusCoins] error', error);
    throw error;
  }

  return data ?? 0;
}

export async function getUserWallet(userId: string): Promise<Wallet> {
  if (!userId) {
    return { focusCoins: 0, totalEarned: 0 };
  }

  const { data, error } = await supabase
    .from('user_wallets')
    .select('focus_coins, total_earned')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[getUserWallet] error', error);
  }

  return {
    focusCoins: data?.focus_coins ?? 0,
    totalEarned: data?.total_earned ?? 0,
  };
}

export async function getStoreItems(): Promise<StoreItem[]> {
  const { data, error } = await supabase
    .from('store_items')
    .select('*')
    .eq('is_active', true)
    .order('cost', { ascending: true });

  if (error) {
    console.error('[getStoreItems] error', error);
    return [];
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    cost: item.cost,
    metadata: item.metadata ?? {},
    isActive: item.is_active,
  }));
}

export async function getUserInventory(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_inventory')
    .select(
      `
        id,
        user_id,
        item_id,
        quantity,
        equipped,
        metadata,
        acquired_at,
        store_items (
          name,
          type,
          metadata
        )
      `,
    )
    .eq('user_id', userId)
    .order('acquired_at', { ascending: false });

  if (error) {
    console.error('[getUserInventory] error', error);
    return [];
  }

  return (data ?? []).map((entry) => {
    const mergedMetadata = {
      ...(entry.store_items?.metadata ?? {}),
      ...(entry.metadata ?? {}),
    } as Record<string, unknown>;
    return {
      id: entry.id,
      itemId: entry.item_id,
      name: entry.store_items?.name ?? 'Item',
      type: entry.store_items?.type ?? 'theme',
      quantity: entry.quantity ?? 1,
      equipped: entry.equipped ?? false,
      metadata: mergedMetadata,
      acquiredAt: entry.acquired_at,
      themeKey: mergedMetadata.themeKey as string | undefined,
    };
  });
}

export async function purchaseStoreItem(userId: string, itemId: string) {
  if (!userId || !itemId) throw new Error('missing user or item');

  const { data, error } = await supabase.rpc('purchase_store_item', {
    p_user_id: userId,
    p_item_id: itemId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function equipInventoryItem(inventoryId: string, equipped: boolean) {
  const { error } = await supabase
    .from('user_inventory')
    .update({ equipped })
    .eq('id', inventoryId);

  if (error) {
    throw error;
  }
}

export async function toggleThemeItem({
  inventoryId,
  userId,
  equipped,
  themeKey,
}: {
  inventoryId: string | null;
  userId: string;
  equipped: boolean;
  themeKey?: string;
}) {
  if (!userId) throw new Error('Utilisateur manquant');

  const { error } = await supabase.rpc('set_active_theme', {
    p_user_id: userId,
    p_inventory_id: equipped ? inventoryId : null,
    p_theme: equipped ? themeKey ?? 'aurora' : 'default',
  });

  if (error) {
    throw error;
  }
}

export async function activateBoosterItem({
  inventoryId,
  userId,
  multiplier,
  durationMinutes,
}: {
  inventoryId: string;
  userId: string;
  multiplier: number;
  durationMinutes: number;
}) {
  if (!userId) throw new Error('Utilisateur manquant');
  const { error } = await supabase.rpc('activate_booster', {
    p_user_id: userId,
    p_inventory_id: inventoryId,
    p_multiplier: multiplier,
    p_duration_minutes: durationMinutes,
  });

  if (error) {
    throw error;
  }
}

export async function getEconomyEvents(userId: string, limit = 25): Promise<EconomyEvent[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_economy_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getEconomyEvents] error', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.event_type,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  }));
}

