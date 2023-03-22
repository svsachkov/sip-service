package hse.project.sipserviceauth.services.orders;

import hse.project.sipserviceauth.models.requests.OrderRequest;
import hse.project.sipserviceauth.models.responses.OrderResponse;

import java.io.IOException;

public class OrderService {
    public OrderResponse create(OrderRequest orderRequest) throws IOException {
        Process p = Runtime.getRuntime().exec("python C:\\Users\\stepa\\Downloads\\sip-service\\untitled\\src\\main.py a b model_name");
        return null;
    }
}
