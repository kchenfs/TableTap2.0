'use client';
import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { APIMenuItem, MenuCategory } from '@/lib/types';
import { organizeMenuByCategory } from '@/lib/menuUtils';

const fetchMenu = async (): Promise<APIMenuItem[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL_MENU;
  if (!apiUrl) throw new Error('NEXT_PUBLIC_API_URL_MENU is not defined.');
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error('Network response was not ok');
  const data = await response.json();
  return data || [];
};

interface MenuContextType {
  isLoading: boolean;
  error: unknown;
  categories: MenuCategory[];
  MenuItems: APIMenuItem[];
  refetch: () => void;
}

const MenuContext = createContext<MenuContextType | null>(null);

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used within a MenuProvider');
  return context;
};

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading, error, refetch } = useQuery<APIMenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: fetchMenu,
  });
  const categories = useMemo(() => (data ? organizeMenuByCategory(data) : []), [data]);
  const value = { isLoading, error, categories, MenuItems: data ?? [], refetch };
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};
