package hse.project.sipserviceauth.api.v1;

import hse.project.sipserviceauth.model.request.AuthRequest;
import hse.project.sipserviceauth.model.request.RegisterRequest;
import hse.project.sipserviceauth.model.response.AuthResponse;
import hse.project.sipserviceauth.model.response.RegisterResponse;
import hse.project.sipserviceauth.service.auth.AuthService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(service.login(request));
    }
}
