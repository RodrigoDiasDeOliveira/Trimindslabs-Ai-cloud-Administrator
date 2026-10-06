package com.multicloud.agent.controller;

import com.multicloud.agent.dto.AuthRequestDto;
import com.multicloud.agent.dto.AuthResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserDetailsService users;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, AuthResponseDto> sessions = new ConcurrentHashMap<>();

    public AuthController(UserDetailsService users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequestDto request) {
        if ("true".equalsIgnoreCase(System.getenv("DEMO_MODE"))
                && "demo".equalsIgnoreCase(request.getUsername())
                && "demo".equals(request.getPassword())) {
            AuthResponseDto demo = new AuthResponseDto(
                    "spring-demo-" + UUID.randomUUID(),
                    "demo",
                    "Demonstration Operator",
                    "ROLE_OBSERVER",
                    List.of("READ", "VIEW_AUDIT")
            );
            sessions.put(demo.getToken(), demo);
            return ResponseEntity.ok(demo);
        }

        try {
            UserDetails details = users.loadUserByUsername(request.getUsername());
            String storedPassword = details.getPassword();
            if (storedPassword.startsWith("{bcrypt}")) storedPassword = storedPassword.substring(8);
            if (!passwordEncoder.matches(request.getPassword(), storedPassword)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciais inválidas"));
            }

            String role = details.getAuthorities().stream().findFirst()
                    .map(a -> "ROLE_" + a.getAuthority().replace("ROLE_", ""))
                    .orElse("ROLE_OBSERVER");

            List<String> permissions = switch (role) {
                case "ROLE_ADMIN" -> List.of("READ", "WRITE", "EXECUTE_CRITICAL", "BLAST_RADIUS_APPROVE", "MANAGE_CLOUDS", "EXPORT_AUDIT");
                case "ROLE_DEV" -> List.of("READ", "WRITE", "EXECUTE_STANDARD", "REQUEST_ACTION");
                default -> List.of("READ", "VIEW_AUDIT");
            };

            AuthResponseDto response = new AuthResponseDto(
                    "spring-" + UUID.randomUUID(),
                    details.getUsername(),
                    details.getUsername(),
                    role,
                    permissions
            );
            sessions.put(response.getToken(), response);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciais inválidas"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token não fornecido"));
        }
        AuthResponseDto session = sessions.get(token.substring(7));
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Sessão inválida ou expirada"));
        }
        return ResponseEntity.ok(session);
    }
}