package hse.project.sipserviceauth;

import hse.project.sipserviceauth.model.domain.Order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedList;
import java.util.Queue;
import java.util.UUID;

@SpringBootApplication
@EnableJpaRepositories
public class SipServiceAuthApplication {

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
                        .model(rs.getString("model"))
                        .createdAt(rs.getDate("created_at"))
                        .finishedAt(rs.getDate("finished_at"))
                        .status(rs.getBoolean("status"))
                        .result(rs.getString("result"))
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
                String order_url = order.getUrl();
                String order_id = order.getId().toString();
                String param_url = "\"" + order_url + "\"";

                try {
                    ProcessBuilder pb = new ProcessBuilder(
                            "python",
                            "src/main/python/main.py",
                            param_url,
                            order_id
                    );
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
