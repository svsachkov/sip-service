package hse.project.sipserviceauth;

import hse.project.sipserviceauth.model.domain.Order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedList;
import java.util.Objects;
import java.util.Queue;
import java.util.UUID;

@SpringBootApplication
@EnableJpaRepositories
public class SipServiceAuthApplication implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://127.0.0.1:5173",
                        "http://localhost:5173",
                        "https://127.0.0.1:5173",
                        "https://localhost:5173"
                )
                .allowedMethods(
                        "GET",
                        "PUT",
                        "POST",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                );
    }

    // Queue of orders that have NOT been processed yet
    public static Queue<Order> orders = new LinkedList<>();

    public static void main(String[] args) {
        SpringApplication.run(SipServiceAuthApplication.class, args);

        try {
            String url = "jdbc:postgresql://localhost:5432/data";
            Connection conn = DriverManager.getConnection(url, "postgres", "3172");
            Statement stmt = conn.createStatement();
            ResultSet rs;

            rs = stmt.executeQuery("SELECT * FROM orders WHERE status = false");
            while (rs.next()) {
                Order order = Order.builder()
                        .id((UUID) rs.getObject("id"))
                        .url(rs.getString("url"))
                        .url2(rs.getString("url2"))
                        .model(rs.getString("model"))
                        .satellite(rs.getString("satellite"))
                        .createdAt(rs.getDate("created_at"))
                        .finishedAt(rs.getDate("finished_at"))
                        .status(rs.getBoolean("status"))
                        .result(rs.getString("result"))
                        .result2(rs.getString("result2"))
                        .diff(rs.getString("diff"))
                        .build();
                orders.add(order);
            }
            conn.close();
        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        }

        while (true) {
            if (orders.size() != 0) {
                System.out.println("Start Python");

                Order order = orders.peek();

                String model = order.getModel();
                String satellite = order.getSatellite();
                String order_url = order.getUrl();
                String order_url2 = order.getUrl2();
                String order_id = order.getId().toString();
                String param_url = "\"" + order_url + "\"";
                String param_url2 = "\"" + order_url2 + "\"";

                try {
                    ProcessBuilder pb = null;
                    switch (model) {
                        case "water":
                            pb = new ProcessBuilder(
                                    "python",
                                    "src/main/python/main.py",
                                    param_url,
                                    param_url2,
                                    order_id,
                                    model
                            );
                            break;
                        case "ice":
                            if (Objects.equals(satellite, "sent-1")) {
                                pb = new ProcessBuilder(
                                        "python",
                                        "src/main/python/main.py",
                                        param_url,
                                        param_url2,
                                        order_id,
                                        model
                                );
                            } else if (Objects.equals(satellite, "sent-2")) {
                                pb = new ProcessBuilder(
                                        "python",
                                        "src/main/python/ice2.py",
                                        param_url,
                                        param_url2,
                                        order_id,
                                        model
                                );
                            } else {

                            }
                            break;
                    }

                    pb.redirectErrorStream(true);
                    Process p = pb.start();
                    p.waitFor();
                } catch (IOException | InterruptedException e) {
                    e.printStackTrace();
                }
                orders.remove();
                System.out.println("Finish Python");
            }
        }
    }
}
