package com.wordle.wordle.controller;

import com.wordle.wordle.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public String register(@RequestBody Map<String, String> body) {
        return service.register(
                body.get("username"),
                body.get("password")
        );
    }

    @PostMapping("/login")
    public String login(@RequestBody Map<String, String> body) {
        return service.login(
                body.get("username"),
                body.get("password")
        );
    }
}
