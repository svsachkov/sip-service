package hse.project.sipserviceauth.models.domains;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID user_id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "A_id", referencedColumnName = "id")
    private A kek;

    private Timestamp createdAt;
    private Timestamp finishedAt;

}
