import React, { createContext, useContext, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  notes?: string | null;
  product?: {
    id: number;
    name: string;
    price: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  addItem: (productId: number, quantity?: number, notes?: string) => Promise<void>;
  updateItem: (id: number, quantity: number, notes?: string) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: cartData, isLoading, refetch } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const addMutation = trpc.cart.add.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const updateMutation = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  const items: CartItem[] = (cartData as CartItem[] | undefined) ?? [];

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.product?.price ?? "0");
    return sum + price * item.quantity;
  }, 0);

  const addItem = useCallback(
    async (productId: number, quantity = 1, notes?: string) => {
      await addMutation.mutateAsync({ productId, quantity, notes });
    },
    [addMutation]
  );

  const updateItem = useCallback(
    async (id: number, quantity: number, notes?: string) => {
      await updateMutation.mutateAsync({ id, quantity, notes });
    },
    [updateMutation]
  );

  const removeItem = useCallback(
    async (id: number) => {
      await updateMutation.mutateAsync({ id, quantity: 0 });
    },
    [updateMutation]
  );

  const clearCart = useCallback(async () => {
    await clearMutation.mutateAsync();
  }, [clearMutation]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isLoading,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refetch,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
