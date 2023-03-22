package hse.project.sipserviceauth.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;

    @GetMapping("/hello")
    public String hello() {
        return "Hello!";
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @RequestBody RegisterRequest request
    ) {
//        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message");
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(
            @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.login(request));
    }

    @GetMapping("/user")
    public String user(@RequestHeader (name="Authorization") String token) {
        return token;
    }

//    @GetMapping("/user")
//    public ResponseEntity<UserResponse> user(HttpServletRequest request) {
//        User user = (User) request.getAttribute("user");
//
//        return ResponseEntity.ok(UserResponse.builder().a(user.getName()).build());
//    }
}
