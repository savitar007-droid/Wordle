package com.wordle.wordle.service;

import com.wordle.wordle.model.User;
import com.wordle.wordle.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository repo;

    public AuthService(UserRepository repo) {
        this.repo = repo;
    }

    public String register(String username, String password) {

        // 🔒 basic validation
        if (username == null || password == null ||
                username.isBlank() || password.isBlank()) {
            return "INVALID_INPUT";
        }

        // ❗ FIX: Optional check
        if (repo.findByUsername(username).isPresent()) {
            return "USER_EXISTS";
        }

        repo.save(new User(username, password));
        return "REGISTER_SUCCESS";
    }

    public String login(String username, String password) {

        if (username == null || password == null) {
            return "INVALID_INPUT";
        }

        return repo.findByUsername(username)
                .map(user -> {
                    if (user.getPassword().equals(password)) {
                        return "LOGIN_SUCCESS";
                    }
                    return "INVALID_CREDENTIALS";
                })
                .orElse("INVALID_CREDENTIALS");
    }
}
