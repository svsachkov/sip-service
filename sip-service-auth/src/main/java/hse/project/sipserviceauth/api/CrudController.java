package hse.project.sipserviceauth.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

public interface CrudController<Request, Response> {
    ResponseEntity<Response> create(@RequestBody Request request);

    ResponseEntity<List<Response>> read();

    ResponseEntity<Response> read(@PathVariable Integer id);

    ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Request request);

    ResponseEntity<?> delete(@PathVariable Integer id);
}
