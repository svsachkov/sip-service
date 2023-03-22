package hse.project.sipserviceauth.models.domains;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "A")
public class A {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String bbox;
    private String layer;
    private String maxcc;
    private String width;
    private String height;
    private String image_format;
}
