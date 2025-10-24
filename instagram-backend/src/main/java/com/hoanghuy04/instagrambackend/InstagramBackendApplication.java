package com.hoanghuy04.instagrambackend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class InstagramBackendApplication {

	public static void main(String[] args) {
		// Load environment variables from .env file
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		// Set system properties from .env file
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
		});

		SpringApplication.run(InstagramBackendApplication.class, args);
	}

}
