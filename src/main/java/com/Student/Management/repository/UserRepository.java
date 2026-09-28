package com.Student.Management.repository;

import com.Student.Management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.crypto.spec.OAEPParameterSpec;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
