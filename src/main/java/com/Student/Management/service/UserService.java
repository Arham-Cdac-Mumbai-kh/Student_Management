package com.Student.Management.service;


import com.Student.Management.entity.User;
import com.Student.Management.repository.UserRepository;
import jakarta.persistence.Access;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {

   @Autowired
    private  UserRepository userRepository;

@Autowired
    private  PasswordEncoder passwordEncoder;


        public User registredUser(User user){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole("USER");
            return  userRepository.save(user);
        }


}

