package com.wordle.wordle.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class WordleService {

    private static final List<String> NORMAL_WORDS = List.of(
            "CRANE", "SLATE", "TRAIN", "LIGHT", "STONE",
            "PLUMB", "GRIEF", "STAMP", "TOWER", "BLAZE",
            "CLOTH", "DRAFT", "FRAME", "GLINT", "HOVER",
            "BRAVE", "CHEST", "FIELD", "GLOBE", "HINGE"
    );

    private static final List<String> TIME_WORDS = List.of(
            "ADIEU", "STARE", "BREAK", "PRIZE", "WORLD",
            "DRINK", "FLOAT", "GRAZE", "JOUST", "KNEEL",
            "LAPSE", "MANOR", "NERVE", "ONSET", "REALM",
            "SPARK", "THRIVE", "ULTRA", "VAULT", "WRATH"
    );

    private static final List<String> SUDDEN_WORDS = List.of(
            "HELLO", "BRAVE", "FROST", "GLOOM", "HARSH",
            "INPUT", "JOKER", "KNACK", "LIVER", "MIXER",
            "NOBLE", "ORBIT", "PATSY", "QUIRK", "REACH",
            "SALVO", "TIMID", "UNDER", "VENOM", "WALTZ"
    );

    private int getDailyIndex(int listSize) {
        LocalDate today = LocalDate.now();
        int hash = today.getYear() * 10000
                + today.getMonthValue() * 100
                + today.getDayOfMonth();
        return Math.abs(hash) % listSize;
    }

    public String getWordForMode(String mode) {
        if (mode == null) mode = "normal";
        switch (mode.toLowerCase()) {
            case "time":
                return TIME_WORDS.get(getDailyIndex(TIME_WORDS.size()));
            case "sudden":
                return SUDDEN_WORDS.get(getDailyIndex(SUDDEN_WORDS.size()));
            default:
                return NORMAL_WORDS.get(getDailyIndex(NORMAL_WORDS.size()));
        }
    }

    // Called with mode from controller
    public char[] evaluateGuess(String guess, String mode) {
        String word = getWordForMode(mode);
        return evaluate(guess, word);
    }

    // Backward-compatible fallback
    public char[] evaluateGuess(String guess) {
        return evaluateGuess(guess, "normal");
    }

    // Keep for reveal-word endpoint
    public String getCurrentWord() {
        return getWordForMode("normal");
    }

    private char[] evaluate(String guess, String word) {
        char[] result = new char[5];
        boolean[] used = new boolean[5];

        for (int i = 0; i < 5; i++) {
            if (guess.charAt(i) == word.charAt(i)) {
                result[i] = 'G';
                used[i] = true;
            }
        }

        for (int i = 0; i < 5; i++) {
            if (result[i] == 'G') continue;
            boolean found = false;
            for (int j = 0; j < 5; j++) {
                if (!used[j] && guess.charAt(i) == word.charAt(j)) {
                    found = true;
                    used[j] = true;
                    break;
                }
            }
            result[i] = found ? 'Y' : 'X';
        }

        return result;
    }
}