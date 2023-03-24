package hse.project.sipserviceauth.service.orders;

import hse.project.sipserviceauth.exception.ApiRequestException;
import hse.project.sipserviceauth.model.domain.Order;
import hse.project.sipserviceauth.model.domain.User;
import hse.project.sipserviceauth.model.request.OrderRequest;
import hse.project.sipserviceauth.model.response.OrderResponse;
import hse.project.sipserviceauth.repository.OrderRepository;
import hse.project.sipserviceauth.repository.UserRepository;
import hse.project.sipserviceauth.service.CrudService;

import hse.project.sipserviceauth.utils.AuthorizedUser;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService implements CrudService<Order, OrderRequest> {
    private final OrderRepository orderRepository;

    private final UserRepository userRepository;

    public OrderResponse createOrder(OrderRequest request) {
        var order = Order.builder()
                .url(request.getUrl())
                .modelName(request.getModelName())
                .createdAt(new Date())
                .finishedAt(null)
                .user(AuthorizedUser.getUser())
                .build();

        orderRepository.save(order);

        return OrderResponse.builder()
                .kek("OK")
                .build();
    }

    @Override
    public void create(OrderRequest entity) throws ApiRequestException {

    }

    @Override
    public List<Order> readAll() {
        return null;
    }

    @Override
    public Order read(Integer id) {
        return null;
    }

    @Override
    public boolean update(Integer id, Order updated) throws ApiRequestException {
        return false;
    }

    @Override
    public boolean delete(Integer id) {
        return false;
    }
}
