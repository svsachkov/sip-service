package hse.project.sipserviceauth.models.requests;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequest {
    private String coords;
    private String bbox;
    private String layer;
    private String maxcc;
    private String width;
    private String height;
    private String image_format;
}
