package com.intellcap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IntellcapApplication {
    public static void main(String[] args) {
        SpringApplication.run(IntellcapApplication.class, args);
    }
}
