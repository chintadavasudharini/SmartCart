package com.klu.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.klu.model.Order;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    public String sendOrderNotification(Order order) {
        String msg = "Order #" + order.getOrderId() + " has been successfully paid.";
        logger.info("Notification dispatched: {}", msg);
        return msg;
    }
}
