package com.multicloud.agent.dto;

import java.util.List;

public class AuthResponseDto {
    private String token;
    private String username;
    private String displayName;
    private String role; // ROLE_ADMIN, ROLE_DEV, ROLE_OBSERVER
    private List<String> permissions;

    public AuthResponseDto() {}

    public AuthResponseDto(String token, String username, String displayName, String role, List<String> permissions) {
        this.token = token;
        this.username = username;
        this.displayName = displayName;
        this.role = role;
        this.permissions = permissions;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }
}
