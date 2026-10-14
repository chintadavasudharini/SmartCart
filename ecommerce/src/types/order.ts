import type { Product } from "./product";

export interface OrderItem {
    orderItemId: number;
    product: Product;
    quantity: number;
    price: number;
}

export interface Order {
    orderId: number;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: OrderItem[];
}
