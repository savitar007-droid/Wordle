package com.wordle.wordle.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
            "SPARK", "THINK", "ULTRA", "VAULT", "WRATH"
    );

    private static final List<String> SUDDEN_WORDS = List.of(
            "HELLO", "BRAVE", "FROST", "GLOOM", "HARSH",
            "INPUT", "JOKER", "KNACK", "LIVER", "MIXER",
            "NOBLE", "ORBIT", "PATSY", "QUIRK", "REACH",
            "SALVO", "TIMID", "UNDER", "VENOM", "WALTZ"
    );

    private static final Map<String, String> WORD_HINTS = new HashMap<>();

    static {
        // Normal mode hints
        WORD_HINTS.put("CRANE", "💡 A tall machine used on construction sites");
        WORD_HINTS.put("SLATE", "💡 A grey rock used for roofs and chalkboards");
        WORD_HINTS.put("TRAIN", "💡 Travels on tracks and carries passengers");
        WORD_HINTS.put("LIGHT", "💡 What you need to see in the dark");
        WORD_HINTS.put("STONE", "💡 A hard, solid piece of rock");
        WORD_HINTS.put("PLUMB", "💡 A weight on a string to check if something is vertical");
        WORD_HINTS.put("GRIEF", "💡 Deep sadness, especially after a loss");
        WORD_HINTS.put("STAMP", "💡 You put this on a letter before mailing it");
        WORD_HINTS.put("TOWER", "💡 A very tall, narrow building");
        WORD_HINTS.put("BLAZE", "💡 A large, fierce fire");
        WORD_HINTS.put("CLOTH", "💡 Fabric used to make clothes or wipe surfaces");
        WORD_HINTS.put("DRAFT", "💡 The first version of a written document");
        WORD_HINTS.put("FRAME", "💡 What you put around a picture");
        WORD_HINTS.put("GLINT", "💡 A quick flash or sparkle of light");
        WORD_HINTS.put("HOVER", "💡 To float in the air without moving");
        WORD_HINTS.put("BRAVE", "💡 Having courage, not afraid of danger");
        WORD_HINTS.put("CHEST", "💡 The front part of your body between neck and stomach");
        WORD_HINTS.put("FIELD", "💡 An open area of land, often used for farming");
        WORD_HINTS.put("GLOBE", "💡 A round model of the Earth");
        WORD_HINTS.put("HINGE", "💡 The metal joint that lets a door swing open");

        // Time mode hints
        WORD_HINTS.put("ADIEU", "💡 French word for 'goodbye'");
        WORD_HINTS.put("STARE", "💡 To look at something for a long time with wide eyes");
        WORD_HINTS.put("BREAK", "💡 To separate into pieces or take a rest");
        WORD_HINTS.put("PRIZE", "💡 What you win in a competition");
        WORD_HINTS.put("WORLD", "💡 The Earth and all the people on it");
        WORD_HINTS.put("DRINK", "💡 To swallow liquid");
        WORD_HINTS.put("FLOAT", "💡 To stay on the surface of water without sinking");
        WORD_HINTS.put("GRAZE", "💡 What cows do when they eat grass in a field");
        WORD_HINTS.put("JOUST", "💡 Medieval knights fighting on horseback with lances");
        WORD_HINTS.put("KNEEL", "💡 To go down on your knees");
        WORD_HINTS.put("LAPSE", "💡 A temporary failure or slip in memory");
        WORD_HINTS.put("MANOR", "💡 A large house in the countryside with land");
        WORD_HINTS.put("NERVE", "💡 Carries signals between brain and body");
        WORD_HINTS.put("ONSET", "💡 The beginning or start of something");
        WORD_HINTS.put("REALM", "💡 A kingdom or field of activity");
        WORD_HINTS.put("SPARK", "💡 A tiny, bright particle from a fire");
        WORD_HINTS.put("THINK", "💡 To use your mind to consider or reason");
        WORD_HINTS.put("ULTRA", "💡 Going beyond what is normal; extreme");
        WORD_HINTS.put("VAULT", "💡 A secure room for storing valuables");
        WORD_HINTS.put("WRATH", "💡 Extreme anger or fury");

        // Sudden death mode hints
        WORD_HINTS.put("HELLO", "💡 A common greeting when you meet someone");
        WORD_HINTS.put("FROST", "💡 Ice crystals that form on cold surfaces");
        WORD_HINTS.put("GLOOM", "💡 Darkness or a feeling of sadness");
        WORD_HINTS.put("HARSH", "💡 Rough, unpleasant, or severe");
        WORD_HINTS.put("INPUT", "💡 Information or data entered into a system");
        WORD_HINTS.put("JOKER", "💡 Someone who tells jokes or a wild card");
        WORD_HINTS.put("KNACK", "💡 A special skill or talent for something");
        WORD_HINTS.put("LIVER", "💡 An organ that filters your blood");
        WORD_HINTS.put("MIXER", "💡 A machine that blends ingredients together");
        WORD_HINTS.put("NOBLE", "💡 Having high moral qualities or aristocratic rank");
        WORD_HINTS.put("ORBIT", "💡 The path a planet takes around a star");
        WORD_HINTS.put("PATSY", "💡 Someone who is easily blamed or taken advantage of");
        WORD_HINTS.put("QUIRK", "💡 A strange habit or unusual behavior");
        WORD_HINTS.put("REACH", "💡 To stretch out to touch or grab something");
        WORD_HINTS.put("SALVO", "💡 A simultaneous firing of guns");
        WORD_HINTS.put("TIMID", "💡 Shy and lacking confidence");
        WORD_HINTS.put("UNDER", "💡 Below or beneath something");
        WORD_HINTS.put("VENOM", "💡 Poison produced by snakes or spiders");
        WORD_HINTS.put("WALTZ", "💡 A ballroom dance in 3/4 time");
    }

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

    public String getHintForMode(String mode) {
        String word = getWordForMode(mode);
        return WORD_HINTS.getOrDefault(word, "💡 Guess the 5-letter word!");
    }

    public char[] evaluateGuess(String guess, String mode) {
        String word = getWordForMode(mode);
        return evaluate(guess, word);
    }

    public char[] evaluateGuess(String guess) {
        return evaluateGuess(guess, "normal");
    }

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