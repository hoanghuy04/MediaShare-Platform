package com.hoanghuy04.instagrambackend.config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;


/**
 * Configuration for file upload settings.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Configuration
public class FileUploadConfig {

    @Value("${file.max-size:52428800}")
    private long maxFileSize;

    /**
     * Configure multipart file upload settings.
     *
     * @return MultipartConfigElement with configured limits
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.ofBytes(maxFileSize));
        factory.setMaxRequestSize(DataSize.ofBytes(maxFileSize));
        return factory.createMultipartConfig();
    }

    /**
     * Configure multipart resolver.
     *
     * @return MultipartResolver instance
     */
    @Bean
    public MultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }
}