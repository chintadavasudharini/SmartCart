package com.klu.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.klu.dto.PaymentVerifyRequest;
import com.klu.model.Order;
import com.klu.model.Payment;
import com.klu.repository.OrderRepository;
import com.klu.repository.PaymentRepository;
import com.razorpay.RazorpayClient;

@Service
public class PaymentService {
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Value("${razorpay.key.id}")
    private String keyId;
    @Value("${razorpay.key.secret}")
    private String keySecret;
    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final BackgroundJobService backgroundJobService;

    public PaymentService(OrderRepository orderRepository,
                          PaymentRepository paymentRepository,
                          BackgroundJobService backgroundJobService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.backgroundJobService = backgroundJobService;
    }

    public Map<String, Object> createRazorpayOrder(Long orderId) throws Exception {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);
        long amountInPaise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();

        JSONObject options = new JSONObject();
        options.put("amount", amountInPaise);
        options.put("currency", "INR");
        options.put("receipt", "order_" + orderId);

        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);

        Payment payment = paymentRepository.findByOrderOrderId(orderId)
                .orElseGet(Payment::new);
        payment.setOrder(order);
        payment.setRazorpayOrderId(razorpayOrder.get("id"));
        payment.setAmount(order.getTotalAmount());
        payment.setStatus("CREATED");
        paymentRepository.save(payment);

        logger.info("Created Razorpay order {} for Order #{}", razorpayOrder.get("id"), orderId);

        Map<String, Object> response = new HashMap<>();
        response.put("keyId", keyId);
        response.put("orderId", orderId);
        response.put("razorpayOrderId", razorpayOrder.get("id"));
        response.put("amount", amountInPaise);
        response.put("currency", "INR");
        return response;
    }

    @Transactional
    public boolean verifyPayment(PaymentVerifyRequest request) throws Exception {
        Payment payment = paymentRepository.findByOrderOrderId(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Payment not found for order #" + request.getOrderId()));

        String generatedSignature = hmacSha256(
                request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(), keySecret);

        if (!MessageDigest.isEqual(
                generatedSignature.getBytes(StandardCharsets.UTF_8),
                request.getRazorpaySignature().getBytes(StandardCharsets.UTF_8))) {
            logger.warn("Razorpay signature verification failed for Order #{}", request.getOrderId());
            return false;
        }

        payment.setRazorpayOrderId(request.getRazorpayOrderId());
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus("PAID");
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setStatus("PAID");
        orderRepository.save(order);

        logger.info("Payment verified successfully for Order #{}, Payment ID: {}", order.getOrderId(), payment.getPaymentId());

        // Trigger post-payment background jobs (EMAIL, INVOICE, NOTIFICATION) asynchronously and idempotently
        backgroundJobService.createJobsForOrder(order);

        return true;
    }

    @Transactional
    public void processWebhook(String payload, String signature) throws Exception {
        String generatedSignature = hmacSha256(payload, webhookSecret);
        if (!MessageDigest.isEqual(
                generatedSignature.getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {
            logger.warn("Invalid webhook signature received");
            throw new RuntimeException("Invalid webhook signature");
        }

        JSONObject json = new JSONObject(payload);
        String event = json.getString("event");
        logger.info("Processing Razorpay webhook event: {}", event);

        if ("payment.captured".equals(event)) {
            JSONObject paymentEntity = json.getJSONObject("payload")
                    .getJSONObject("payment").getJSONObject("entity");
            String razorpayPaymentId = paymentEntity.getString("id");
            String razorpayOrderId = paymentEntity.getString("order_id");

            Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
            if (payment == null) {
                logger.warn("Webhook payment not found for razorpayOrderId: {}", razorpayOrderId);
                return;
            }

            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setStatus("PAID");
            paymentRepository.save(payment);

            Order order = payment.getOrder();
            if (!"PAID".equals(order.getStatus())) {
                order.setStatus("PAID");
                orderRepository.save(order);
            }

            logger.info("Webhook marked Order #{} as PAID", order.getOrderId());

            // Trigger background jobs idempotently
            backgroundJobService.createJobsForOrder(order);
        }
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder result = new StringBuilder();
        for (byte b : hash) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}