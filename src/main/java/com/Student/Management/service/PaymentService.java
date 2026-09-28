package com.Student.Management.service;
import com.razorpay.Utils;
import com.Student.Management.entity.Order;
import com.Student.Management.entity.Payment;
import com.Student.Management.repository.OrderRepository;
import com.Student.Management.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    @Autowired
    private RazorpayClient razorpayClient;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Value("${razorpay.key.secret}")
    private String razorpaySecret;

    public Order createOrder(Long studentId, Long courseId, Double amount)
            throws Exception {

        int amountInPaise = (int) (amount * 100);

        JSONObject options = new JSONObject();

        options.put("amount", amountInPaise);
        options.put("currency", "INR");
        options.put(
                "receipt",
                "student_" + studentId + "_course_" + courseId
        );

        com.razorpay.Order razorpayOrder =
                razorpayClient.orders.create(options);

        Order order = new Order();

        order.setStudentId(studentId);
        order.setCourseId(courseId);
        order.setAmount(amount);
        order.setStatus("CREATED");
        order.setRazorpayOrderId(
                razorpayOrder.get("id")
        );

        Order savedOrder = orderRepository.save(order);

        Payment payment = new Payment();

        payment.setOrderId(savedOrder.getId());
        payment.setRazorpayOrderId(
                razorpayOrder.get("id")
        );
        payment.setStatus("CREATED");

        paymentRepository.save(payment);

        return savedOrder;
    }

    public String verifyPayment(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature) {

        try {

            String secret = razorpaySecret;

            String generatedSignature =
                    Utils.getHash(
                            razorpayOrderId + "|" + razorpayPaymentId,
                            secret
                    );

            if (generatedSignature.equals(razorpaySignature)) {

                Payment payment = paymentRepository
                        .findAll()
                        .stream()
                        .filter(p ->
                                p.getRazorpayOrderId()
                                        .equals(razorpayOrderId)
                        )
                        .findFirst()
                        .orElseThrow();

                payment.setRazorpayPaymentId(razorpayPaymentId);
                payment.setRazorpaySignature(razorpaySignature);
                payment.setStatus("SUCCESS");

                paymentRepository.save(payment);

                Order order = orderRepository
                        .findById(payment.getOrderId())
                        .orElseThrow();

                order.setStatus("PAID");

                orderRepository.save(order);

                return "Payment verified successfully";
            }

            return "Invalid payment signature";

        } catch (Exception e) {
            return "Payment verification failed: " + e.getMessage();
        }
    }
}