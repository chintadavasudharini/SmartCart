import apiClient from "./apiClient";
import type { Product } from "../types/product";

export const getProducts = async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>("/products");
    return response.data;
};

export const addProduct = async (product: Omit<Product, "productId">): Promise<Product> => {
    const response = await apiClient.post<Product>("/products", product);
    return response.data;
};

export const updateProduct = async (
    productId: number,
    product: Omit<Product, "productId">
): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${productId}`, product);
    return response.data;
};

export const deleteProduct = async (productId: number): Promise<void> => {
    await apiClient.delete(`/products/${productId}`);
};