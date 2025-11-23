package com.hoanghuy04.instagrambackend.config;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class OpenAIConfig {

    @Value("classpath:templates/DefaultSystemPrompt.st")
    private Resource defaultSystemPromptResource;

    @Value("${spring.ai.openai.api-key:NOT_SET}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:https://api.openai.com}")
    private String baseUrl;

    @Value("${app.openai.model:gpt-4o-mini}")
    private String model;

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        log.info("🤖 Configuring OpenAI ChatClient");
        log.info("   Base URL: {}", baseUrl);
        log.info("   Model: {}", model);
        log.info("   API Key: {}***", apiKey.substring(0, Math.min(10, apiKey.length())));

        return builder
                .defaultSystem(promptSystemSpec -> promptSystemSpec.text(defaultSystemPromptResource))
                .build();
    }
}