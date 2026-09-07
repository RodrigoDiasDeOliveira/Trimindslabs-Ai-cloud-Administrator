package com.multicloud.agent.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ProviderHealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGetProviderStatusPermitAll() throws Exception {
        mockMvc.perform(get("/api/v1/providers/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAddProviderWithAdminRole() throws Exception {
        String payload = """
                {
                    "provider": "ALIBABA",
                    "region": "ap-southeast-1",
                    "selectedServices": ["Compute ECS", "OSS Storage"]
                }
                """;

        mockMvc.perform(post("/api/v1/providers/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    @WithMockUser(username = "observer", roles = {"OBSERVER"})
    public void testAddProviderForbiddenForObserver() throws Exception {
        String payload = """
                {
                    "provider": "ILLEGAL_CLOUD",
                    "region": "global"
                }
                """;

        mockMvc.perform(post("/api/v1/providers/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isForbidden());
    }
}
