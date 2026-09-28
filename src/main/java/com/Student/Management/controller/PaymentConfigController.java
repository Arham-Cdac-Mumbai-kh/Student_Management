package com.Student.Management.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentConfigController {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @GetMapping("/payment/key")
    public String getRazorpayKey() {
        return razorpayKeyId;
    }
}