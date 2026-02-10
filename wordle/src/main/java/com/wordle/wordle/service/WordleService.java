package com.wordle.wordle.service;

import org.springframework.stereotype.Service;

@Service
public class WordleService {

    private static final String WORD = "HELLO";

    public char[] evaluateGuess(String guess) {

        char[] result = new char[5];
        boolean[] used = new boolean[5];

        for (int i = 0; i < 5; i++) {
            if (guess.charAt(i) == WORD.charAt(i)) {
                result[i] = 'G';
                used[i] = true;
            }
        }

        for (int i = 0; i < 5; i++) {
            if (result[i] == 'G') continue;

            boolean found = false;
            for (int j = 0; j < 5; j++) {
                if (!used[j] && guess.charAt(i) == WORD.charAt(j)) {
                    found = true;
                    used[j] = true;
                    break;
                }
            }
            result[i] = found ? 'Y' : 'X';
        }

        return result;
    }

    // NEW METHOD: Get the current word for reveal functionality
    public String getCurrentWord() {
        return WORD;
    }
}