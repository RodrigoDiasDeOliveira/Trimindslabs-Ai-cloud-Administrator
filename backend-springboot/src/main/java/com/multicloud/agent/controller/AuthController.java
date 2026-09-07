package com.multicloud.agent.controller;

import com.multicloud.agent.dto.AuthRequestDto;
import com.multicloud.agent.dto.AuthResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequestDto request) {
        String username = request.getUsername();
        String password = request.getPassword();

        if ("admin".equalsIgnoreCase(username) && "admin123".equals(password)) {
            return ResponseEntity.ok(new AuthResponseDto(
                "jwt-" + UUID.randomUUID(),
                "admin",
                "Rodrigo Dias (Administrador Cloud)",
                "ROLE_ADMIN",
                List.of("READ", "WRITE", "EXECUTE_CRITICAL", "BLAST_RADIUS_APPROVE", "MANAGE_CLOUDS", "EXPORT_AUDIT")
            ));
        } else if ("dev".equalsIgnoreCase(username) && "dev123".equals(password)) {
            return ResponseEntity.ok(new AuthResponseDto(
                "jwt-" + UUID.randomUUID(),
                "dev",
                "DevOps Engineer",
                "ROLE_DEV",
                List.of("READ", "WRITE", "EXECUTE_STANDARD", "REQUEST_ACTION")
            ));
        } else if ("observer".equalsIgnoreCase(username) && "observer123".equals(password)) {
            return ResponseEntity.ok(new AuthResponseDto(
                "jwt-" + UUID.randomUUID(),
                "observer",
                "Auditor & Observabilidade (Leitura)",
                "ROLE_OBSERVER",
                List.of("READ", "VIEW_AUDIT")
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Credenciais inválidas. Usuários disponíveis: admin, dev, observer\"}");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Token não fornecido\"}");
        }
        // Retorna o perfil ativo correspondente
        return ResponseEntity.ok(new AuthResponseDto(
            token.replace("Bearer ", ""),
            "admin",
            "Rodrigo Dias (Administrador Cloud)",
            "ROLE_ADMIN",
            List.of("READ", "WRITE", "EXECUTE_CRITICAL", "BLAST_RADIUS_APPROVE", "MANAGE_CLOUDS", "EXPORT_AUDIT")
        ));
    }
}
