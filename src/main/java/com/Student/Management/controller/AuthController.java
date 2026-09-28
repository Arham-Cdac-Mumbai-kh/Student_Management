package com.Student.Management.controller;


import com.Student.Management.entity.User;
import com.Student.Management.service.JwtService;
import com.Student.Management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.registredUser(user);
    }

    @PostMapping("/login")
    public String login(@RequestBody User user) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken
                (user.getEmail(), user.getPassword()));
        return jwtService.generateToken(user.getEmail());

    }

    @PostMapping("/logout")
    public org.springframework.http.ResponseEntity<String> logout(jakarta.servlet.http.HttpServletRequest request) {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        return org.springframework.http.ResponseEntity.ok("Logged out successfully");
    }
}
