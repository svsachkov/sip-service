package hse.project.sipserviceauth.repository;

import hse.project.sipserviceauth.model.domain.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
@Transactional(readOnly = true)
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByUrl(String url);

    Optional<List<Order>> findAllByStatusOrderByCreatedAt(boolean t);
}
