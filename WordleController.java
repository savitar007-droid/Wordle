package com.wordle.wordle.controller;

import com.wordle.wordle.model.GuessRequest;
import com.wordle.wordle.service.WordleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class WordleController {

    private final WordleService service;

    public WordleController(WordleService service) {
        this.service = service;
    }

    @PostMapping("/guess")
    public ResponseEntity<char[]> guess(@RequestBody GuessRequest request) {

        if (request == null || request.getGuess() == null) {
            return ResponseEntity.badRequest().build();
        }

        String guess = request.getGuess().trim().toUpperCase();

        if (guess.length() != 5) {
            return ResponseEntity.badRequest().build();
        }

        char[] result = service.evaluateGuess(guess);
        return ResponseEntity.ok(result);
    }
}
