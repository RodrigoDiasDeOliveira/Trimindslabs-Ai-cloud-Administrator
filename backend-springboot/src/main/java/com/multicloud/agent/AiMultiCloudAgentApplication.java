package com.multicloud.agent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AiMultiCloudAgentApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiMultiCloudAgentApplication.class, args);
    }
}
