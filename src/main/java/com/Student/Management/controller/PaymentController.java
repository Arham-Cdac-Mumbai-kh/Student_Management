package com.Student.Management.controller;

import com.Student.Management.entity.Order;
import com.Student.Management.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-order")
    public Order createOrder(
            @RequestParam Long studentId,
            @RequestParam Long courseId,
            @RequestParam Double amount) throws Exception {

        return paymentService.createOrder(
                studentId,
                courseId,
                amount
        );
    }

    @PostMapping("/verify")
    public String verifyPayment(
            @RequestParam String razorpayOrderId,
            @RequestParam String razorpayPaymentId,
            @RequestParam String razorpaySignature) {

        return paymentService.verifyPayment(
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
        );
    }
}