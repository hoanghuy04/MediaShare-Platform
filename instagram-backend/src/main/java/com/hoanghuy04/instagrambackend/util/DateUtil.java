package com.hoanghuy04.instagrambackend.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Utility class for date and time operations.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
public class DateUtil {
    
    private static final DateTimeFormatter DEFAULT_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    private DateUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    /**
     * Get the current date and time.
     *
     * @return current LocalDateTime
     */
    public static LocalDateTime now() {
        return LocalDateTime.now();
    }
    
    /**
     * Format a LocalDateTime to string.
     *
     * @param dateTime the date time to format
     * @return formatted string
     */
    public static String format(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DEFAULT_FORMATTER) : null;
    }
    
    /**
     * Format a LocalDateTime with custom pattern.
     *
     * @param dateTime the date time to format
     * @param pattern the pattern to use
     * @return formatted string
     */
    public static String format(LocalDateTime dateTime, String pattern) {
        if (dateTime == null) {
            return null;
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
        return dateTime.format(formatter);
    }
    
    /**
     * Parse a string to LocalDateTime.
     *
     * @param dateTimeString the string to parse
     * @return parsed LocalDateTime
     */
    public static LocalDateTime parse(String dateTimeString) {
        return dateTimeString != null ? LocalDateTime.parse(dateTimeString, DEFAULT_FORMATTER) : null;
    }
    
    /**
     * Calculate the difference in seconds between two date times.
     *
     * @param from start date time
     * @param to end date time
     * @return difference in seconds
     */
    public static long differenceInSeconds(LocalDateTime from, LocalDateTime to) {
        return ChronoUnit.SECONDS.between(from, to);
    }
    
    /**
     * Calculate the difference in minutes between two date times.
     *
     * @param from start date time
     * @param to end date time
     * @return difference in minutes
     */
    public static long differenceInMinutes(LocalDateTime from, LocalDateTime to) {
        return ChronoUnit.MINUTES.between(from, to);
    }
    
    /**
     * Calculate the difference in hours between two date times.
     *
     * @param from start date time
     * @param to end date time
     * @return difference in hours
     */
    public static long differenceInHours(LocalDateTime from, LocalDateTime to) {
        return ChronoUnit.HOURS.between(from, to);
    }
    
    /**
     * Calculate the difference in days between two date times.
     *
     * @param from start date time
     * @param to end date time
     * @return difference in days
     */
    public static long differenceInDays(LocalDateTime from, LocalDateTime to) {
        return ChronoUnit.DAYS.between(from, to);
    }
    
    /**
     * Check if a date time is in the past.
     *
     * @param dateTime the date time to check
     * @return true if in the past, false otherwise
     */
    public static boolean isPast(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isBefore(LocalDateTime.now());
    }
    
    /**
     * Check if a date time is in the future.
     *
     * @param dateTime the date time to check
     * @return true if in the future, false otherwise
     */
    public static boolean isFuture(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isAfter(LocalDateTime.now());
    }
}

