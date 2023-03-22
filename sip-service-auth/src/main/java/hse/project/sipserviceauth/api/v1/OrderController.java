package hse.project.sipserviceauth.api.v1;

import hse.project.sipserviceauth.services.orders.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {

    private OrderService orderService;

    @GetMapping("/hello")
    public String hello() {
        return ;
    }
}
