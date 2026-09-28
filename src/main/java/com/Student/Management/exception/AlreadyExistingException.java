package com.Student.Management.exception;

public class AlreadyExistingException extends RuntimeException {
    public AlreadyExistingException(String message) {
        super(message);
    }
}
