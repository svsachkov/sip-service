package hse.project.sipserviceauth.services.orders;

import hse.project.sipserviceauth.Role;
import hse.project.sipserviceauth.auth.RegisterRequest;
import hse.project.sipserviceauth.auth.RegisterResponse;
import hse.project.sipserviceauth.models.domains.Order;
import hse.project.sipserviceauth.models.domains.User;
import hse.project.sipserviceauth.models.requests.OrderRequest;
import hse.project.sipserviceauth.models.responses.OrderResponse;
import hse.project.sipserviceauth.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.Time;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;

//    public OrderResponse create(OrderRequest orderRequest) throws IOException {
//        Process p = Runtime.getRuntime().exec("python C:\\Users\\stepa\\Downloads\\sip-service\\untitled\\src\\main.py a b model_name");
//        return null;
//    }

    public OrderResponse createOrder(OrderRequest request) {
        var order = Order.builder()
                .url(request.getUrl())
                .modelName(request.getModelName())
                .createdAt(new Date())
                .finishedAt(null)
                .build();

        orderRepository.save(order);

        return OrderResponse.builder()
                .kek("OK")
                .build();
    }

}
