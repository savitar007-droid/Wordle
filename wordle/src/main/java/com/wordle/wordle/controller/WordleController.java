package com.wordle.wordle.controller;

import com.wordle.wordle.model.GuessRequest;
import com.wordle.wordle.service.WordleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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

    // NEW: Reveal word endpoint
    @GetMapping("/reveal-word")
    public ResponseEntity<Map<String, String>> revealWord() {
        Map<String, String> response = new HashMap<>();

        // Get the actual current word from service
        String word = service.getCurrentWord();

        response.put("word", word);
        response.put("definition", getDefinition(word));
        response.put("trivia", getTrivia(word));
        response.put("example", getExample(word));

        return ResponseEntity.ok(response);
    }

    // Helper method to get definition
    private String getDefinition(String word) {
        Map<String, String> definitions = new HashMap<>();
        definitions.put("HELLO", "A greeting or expression of goodwill used when meeting or acknowledging someone.");
        definitions.put("CRANE", "A large, long-necked bird or a machine used for lifting heavy objects.");
        definitions.put("SLATE", "A fine-grained gray, green, or bluish metamorphic rock easily split into smooth, flat pieces.");
        definitions.put("ADIEU", "A French word meaning 'goodbye' or 'farewell'.");
        definitions.put("STARE", "To look fixedly or vacantly at someone or something with one's eyes wide open.");
        definitions.put("TRAIN", "A connected series of railroad cars pulled by a locomotive or a sequence of events.");
        definitions.put("WORLD", "The earth, together with all of its countries, peoples, and natural features.");
        definitions.put("PRIZE", "A thing given as a reward to the winner of a competition or race.");
        definitions.put("BREAK", "To separate into pieces as a result of a blow, shock, or strain.");
        definitions.put("LIGHT", "The natural agent that stimulates sight and makes things visible.");

        return definitions.getOrDefault(word, "A five-letter word used in Wordle.");
    }

    // Helper method to get trivia
    private String getTrivia(String word) {
        Map<String, String> trivia = new HashMap<>();
        trivia.put("HELLO", "The word 'hello' became popular as a telephone greeting, suggested by Thomas Edison in 1877!");
        trivia.put("CRANE", "Cranes can live for up to 60 years and are known for their elaborate courtship dances.");
        trivia.put("SLATE", "Slate was commonly used for roofing and writing tablets in the 19th century.");
        trivia.put("ADIEU", "ADIEU is considered one of the best starting words in Wordle because it contains 4 vowels!");
        trivia.put("STARE", "The average person blinks 15-20 times per minute, but when staring, this can reduce to 3-4 times.");
        trivia.put("TRAIN", "The first passenger railway opened in 1825 between Stockton and Darlington, England.");
        trivia.put("WORLD", "The word 'world' comes from Old English 'weorold', meaning 'age of man'.");
        trivia.put("PRIZE", "The Nobel Prize was established by Alfred Nobel's will in 1895 and first awarded in 1901.");
        trivia.put("BREAK", "The word 'break' has over 50 different meanings in English, making it one of the most versatile words!");
        trivia.put("LIGHT", "Light travels at approximately 299,792,458 meters per second in a vacuum.");

        return trivia.getOrDefault(word, "This word was carefully selected for today's puzzle!");
    }

    // Helper method to get example
    private String getExample(String word) {
        Map<String, String> examples = new HashMap<>();
        examples.put("HELLO", "\"Hello! It's nice to meet you,\" she said with a warm smile.");
        examples.put("CRANE", "\"The construction crane lifted the heavy steel beams effortlessly.\"");
        examples.put("SLATE", "\"The teacher wrote the math problem on the slate board.\"");
        examples.put("ADIEU", "\"She bid him adieu and departed on her journey.\"");
        examples.put("STARE", "\"Don't stare at strangers; it's considered rude.\"");
        examples.put("TRAIN", "\"We took the morning train to visit our grandparents.\"");
        examples.put("WORLD", "\"She dreamed of traveling around the world one day.\"");
        examples.put("PRIZE", "\"He won first prize in the science competition.\"");
        examples.put("BREAK", "\"Let's take a short break before continuing our work.\"");
        examples.put("LIGHT", "\"The morning light streamed through the window.\"");

        return examples.getOrDefault(word, "\"Can you use " + word + " in a sentence?\"");
    }
}