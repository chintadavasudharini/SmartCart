import apiClient from "./apiClient";

export interface PaymentResponse {
    keyId: string;
    orderId: number;
    razorpayOrderId: string;
    amount: number;
    currency: string;
}

export const createOrder = async (items: { productId: number; quantity: number }[]) => {
    const response = await apiClient.post("/orders", { items });
    return response.data;
};

export const createPayment = async (orderId: number): Promise<PaymentResponse> => {
    const response = await apiClient.post<PaymentResponse>(`/payment/create/${orderId}`, {});
    return response.data;
};

export const verifyPayment = async (data: {
    orderId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}) => {
    const response = await apiClient.post("/payment/verify", data);
    return response.data;
};