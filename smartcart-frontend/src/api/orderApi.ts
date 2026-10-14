import apiClient from "./apiClient";
import type { Order } from "../types/order";

export const getMyOrders = async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>("/orders/my");
    return response.data;
};

export const getOrderById = async (orderId: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${orderId}`);
    return response.data;
};

export const getAllOrders = async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>("/orders");
    return response.data;
};
