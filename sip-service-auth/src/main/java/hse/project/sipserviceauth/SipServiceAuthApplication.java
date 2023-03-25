package hse.project.sipserviceauth;

import hse.project.sipserviceauth.model.domain.Order;

import hse.project.sipserviceauth.utils.AuthorizedUser;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Date;
import java.util.LinkedList;
import java.util.Queue;
import java.util.UUID;

@SpringBootApplication
@EnableJpaRepositories
public class SipServiceAuthApplication {

    public static Queue<Order> orders = new LinkedList<>();

    public static void main(String[] args) {
        SpringApplication.run(SipServiceAuthApplication.class, args);

        try {
            String url = "jdbc:postgresql://localhost:5432/data";
            Connection conn = DriverManager.getConnection(url,"postgres","3172");
            Statement stmt = conn.createStatement();
            ResultSet rs;

            rs = stmt.executeQuery("SELECT * FROM orders WHERE status = false");
            while ( rs.next() ) {
                Order order = Order.builder()
                        .id((UUID) rs.getObject("id"))
                        .url(rs.getString("url"))
                        .modelName(rs.getString("model_name"))
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
                try {
                    //String param_url = "\"http://services.sentinel-hub.com/ogc/wms/cbe156b7-660c-4640-a5a1-ea774aecf9ce?SERVICE=WMS&REQUEST=GetMap&CRS=EPSG:3857&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/tiff&TIME=2018-03-29/2018-05-29&GEOMETRY=POLYGON((1089372.5680352768 3990882.3458559057,1155769.285697225 3990882.3458559057,1155769.285697225 4066966.6497494457,1089372.5680352768 4066966.6497494457,1089372.5680352768 3990882.3458559057))\"";
                    String param_url = "\"" + order_url + "\"";

                    ProcessBuilder pb = new ProcessBuilder(
                            "python",
                            "D:\\sip-service\\sip-service-auth\\src\\main\\python\\main.py",
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
