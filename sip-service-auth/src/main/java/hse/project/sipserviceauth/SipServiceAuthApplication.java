package hse.project.sipserviceauth;

import hse.project.sipserviceauth.model.domain.Order;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.io.IOException;

@SpringBootApplication
@EnableJpaRepositories
public class SipServiceAuthApplication {

	public static void main(String[] args) {
		SpringApplication.run(SipServiceAuthApplication.class, args);

//		MyQueue.addOrder(new Order());
//
//		while (true) {
//			Integer s = MyQueue.getQueue().size();
//			if (s != 0) {
//				MyQueue.removeQueue();
//				try {
//					ProcessBuilder pb = new ProcessBuilder("python", "D:\\\\Education\\\\SoftwareEngineering\\\\PROJECTS\\\\SatelliteImageryProcessing\\\\sip-service\\\\sip-service-auth\\\\src\\\\main\\\\python\\\\main.py");
//					pb.redirectErrorStream(true);
//					Process p = pb.start();
//					p.waitFor();
//					System.out.println("WOW");
//				} catch (IOException | InterruptedException e) {
//					e.printStackTrace();
//				}
//			}
//		}
	}
}
