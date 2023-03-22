package hse.project.sipserviceauth.api.v1;

import hse.project.sipserviceauth.models.requests.OrderRequest;
import hse.project.sipserviceauth.models.responses.OrderResponse;
import hse.project.sipserviceauth.services.orders.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class OrderController {
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest orderRequest) throws IOException {
        return ResponseEntity.ok(orderService.create(orderRequest));
    }
}
