package hse.project.sipserviceauth.api.v1;

import hse.project.sipserviceauth.api.CrudController;
import hse.project.sipserviceauth.model.request.OrderRequest;
import hse.project.sipserviceauth.model.response.OrderResponse;
import hse.project.sipserviceauth.service.orders.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class OrderController implements CrudController<OrderRequest, OrderResponse> {

    private final OrderService orderService;

    @Override
    @PostMapping("/order")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<OrderResponse> create(OrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @Override
    public ResponseEntity<List<OrderResponse>> read() {
        return null;
    }

    @Override
    public ResponseEntity<OrderResponse> read(Integer id) {
        return null;
    }

    @Override
    public ResponseEntity<?> update(Integer id, OrderRequest orderRequest) {
        return null;
    }

    @Override
    public ResponseEntity<?> delete(Integer id) {
        return null;
    }
}
