package com.klu.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.klu.model.Role;
import com.klu.model.User;
import com.klu.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "admin@smartcart.com";
            User existingAdmin = userRepository.findByEmail(adminEmail).orElse(null);

            if (existingAdmin == null) {
                User admin = new User();
                admin.setName("SmartCart Administrator");
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("admin@smartcart"));
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
                System.out.println(">>> [SmartCart] Default Admin created: admin@smartcart.com / admin@smartcart");
            } else {
                existingAdmin.setRole(Role.ADMIN);
                existingAdmin.setPassword(passwordEncoder.encode("admin@smartcart"));
                userRepository.save(existingAdmin);
                System.out.println(">>> [SmartCart] Default Admin synchronized: admin@smartcart.com / admin@smartcart");
            }
        };
    }
}
