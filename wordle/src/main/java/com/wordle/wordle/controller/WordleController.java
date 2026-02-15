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
        String mode  = request.getMode() != null ? request.getMode() : "normal";

        if (guess.length() != 5) {
            return ResponseEntity.badRequest().build();
        }

        char[] result = service.evaluateGuess(guess, mode);
        return ResponseEntity.ok(result);
    }

    // reveal-word now accepts optional mode param
    @GetMapping("/reveal-word")
    public ResponseEntity<Map<String, String>> revealWord(
            @RequestParam(defaultValue = "normal") String mode) {

        Map<String, String> response = new HashMap<>();
        String word = service.getWordForMode(mode);

        response.put("word", word);
        response.put("definition", getDefinition(word));
        response.put("trivia", getTrivia(word));
        response.put("example", getExample(word));

        return ResponseEntity.ok(response);
    }

    private String getDefinition(String word) {
        Map<String, String> d = new HashMap<>();
        d.put("HELLO", "A greeting or expression of goodwill used when meeting someone.");
        d.put("CRANE", "A large long-necked bird, or a machine for lifting heavy objects.");
        d.put("SLATE", "A fine-grained grey metamorphic rock easily split into flat pieces.");
        d.put("ADIEU", "A French word meaning goodbye or farewell.");
        d.put("STARE", "To look fixedly at someone or something with wide open eyes.");
        d.put("TRAIN", "A series of railroad cars pulled by a locomotive.");
        d.put("WORLD", "The earth together with all its countries and peoples.");
        d.put("PRIZE", "A reward given to the winner of a competition.");
        d.put("BREAK", "To separate into pieces as a result of a blow or strain.");
        d.put("LIGHT", "The natural agent that stimulates sight and makes things visible.");
        d.put("CRANE", "A large, tall machine used for moving heavy objects by suspending them.");
        d.put("BRAVE", "Ready to face and endure danger or pain; showing courage.");
        d.put("FROST", "A deposit of small white ice crystals formed on a cold surface.");
        d.put("GLOOM", "Darkness or dimness; a state of depression or despondency.");
        d.put("STONE", "The hard solid non-metallic mineral matter of which rock is made.");
        d.put("DRINK", "To take liquid into the mouth and swallow it.");
        d.put("FLOAT", "To rest or move on the surface of a liquid without sinking.");
        d.put("JOKER", "A person who makes jokes; or a playing card used as a wild card.");
        d.put("KNACK", "An acquired skill at performing a task; a natural talent.");
        d.put("NOBLE", "Belonging to a hereditary class with high social status.");
        return d.getOrDefault(word, "A five-letter word used in Wordle.");
    }

    private String getTrivia(String word) {
        Map<String, String> t = new HashMap<>();
        t.put("HELLO", "The word hello became popular as a telephone greeting suggested by Thomas Edison in 1877!");
        t.put("CRANE", "Cranes can live up to 60 years and are known for their elaborate courtship dances.");
        t.put("SLATE", "Slate was commonly used for roofing and school writing tablets in the 19th century.");
        t.put("ADIEU", "ADIEU is one of the best Wordle starting words because it contains 4 vowels!");
        t.put("STARE", "The average person blinks 15-20 times per minute, but staring reduces it to 3-4 times.");
        t.put("TRAIN", "The first passenger railway opened in 1825 between Stockton and Darlington, England.");
        t.put("WORLD", "The word world comes from Old English weorold, meaning age of man.");
        t.put("PRIZE", "The Nobel Prize was established by Alfred Nobel's will in 1895 and first awarded in 1901.");
        t.put("BREAK", "The word break has over 50 different meanings in English, one of the most versatile words!");
        t.put("LIGHT", "Light travels at approximately 299,792,458 metres per second in a vacuum.");
        t.put("BRAVE", "The word brave entered English from Spanish bravo, meaning bold or courageous.");
        t.put("FROST", "Robert Frost is one of the most celebrated American poets, famous for nature-themed works.");
        t.put("STONE", "The Stone Age lasted roughly 3.4 million years and ended around 3,000 BCE.");
        t.put("DRINK", "Humans can survive approximately 3 days without water.");
        t.put("FLOAT", "Dead Sea water is so salty that people naturally float without effort.");
        t.put("JOKER", "The Joker card was added to the standard deck around 1860 for the game of Euchre.");
        t.put("KNACK", "The word knack originally meant a cunning trick before it came to mean a skill.");
        t.put("NOBLE", "Noble gases were called inert gases before scientists discovered they can form compounds.");
        return t.getOrDefault(word, "This word was carefully selected for today's puzzle!");
    }

    private String getExample(String word) {
        Map<String, String> e = new HashMap<>();
        e.put("HELLO", "Hello! It is so nice to finally meet you in person.");
        e.put("CRANE", "The construction crane lifted the heavy steel beams with ease.");
        e.put("SLATE", "The teacher wrote the assignment on the slate board.");
        e.put("ADIEU", "She bid him adieu and boarded the train for Paris.");
        e.put("STARE", "It is rude to stare at people in public places.");
        e.put("TRAIN", "We took the morning train to visit our grandparents.");
        e.put("WORLD", "She dreamed of traveling around the world one day.");
        e.put("PRIZE", "He won first prize at the science fair this year.");
        e.put("BREAK", "Let us take a short break before we continue working.");
        e.put("LIGHT", "The morning light streamed beautifully through the window.");
        e.put("BRAVE", "It was brave of her to speak the truth in front of everyone.");
        e.put("FROST", "A thick frost covered the grass on the cold winter morning.");
        e.put("STONE", "He skipped a flat stone across the calm surface of the lake.");
        e.put("DRINK", "She poured herself a cool drink of water after the long run.");
        e.put("FLOAT", "The children loved to float on their backs in the swimming pool.");
        e.put("JOKER", "He was always the joker of the group, making everyone laugh.");
        e.put("KNACK", "She had a real knack for solving complex puzzles quickly.");
        e.put("NOBLE", "It was a noble gesture to donate all the prize money to charity.");
        return e.getOrDefault(word, "Can you use " + word + " in a sentence today?");
    }
}