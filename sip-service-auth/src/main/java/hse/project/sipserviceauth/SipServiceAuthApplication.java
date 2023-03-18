package hse.project.sipserviceauth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class SipServiceAuthApplication {
	public static void main(String[] args) {
		SpringApplication.run(SipServiceAuthApplication.class, args);
	}
}
