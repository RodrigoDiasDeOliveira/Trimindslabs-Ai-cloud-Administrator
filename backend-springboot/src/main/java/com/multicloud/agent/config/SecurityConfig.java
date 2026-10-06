package com.multicloud.agent.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        java.util.List<UserDetails> users = new java.util.ArrayList<>();
        addUser(users, "ADMIN_USERNAME", "ADMIN_PASSWORD_BCRYPT", "ADMIN");
        addUser(users, "DEV_USERNAME", "DEV_PASSWORD_BCRYPT", "DEV");
        addUser(users, "OBSERVER_USERNAME", "OBSERVER_PASSWORD_BCRYPT", "OBSERVER");
        if ("true".equalsIgnoreCase(System.getenv("DEMO_MODE"))) {
            users.add(User.builder()
                    .username("demo")
                    .password("{noop}demo")
                    .roles("OBSERVER")
                    .build());
        }
        return new InMemoryUserDetailsManager(users);
    }

    private void addUser(java.util.List<UserDetails> users, String usernameKey, String passwordKey, String role) {
        String username = System.getenv(usernameKey);
        String passwordHash = System.getenv(passwordKey);
        if (username != null && !username.isBlank() && passwordHash != null && !passwordHash.isBlank()) {
            users.add(User.builder().username(username).password(passwordHash).roles(role).build());
        }
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/v1/providers/**", "/api/v1/resources/**", "/api/v1/agent/**").authenticated()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:8080"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
