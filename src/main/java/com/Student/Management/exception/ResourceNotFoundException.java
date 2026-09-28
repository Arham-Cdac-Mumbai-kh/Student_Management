package com.Student.Management.exception;

public class ResourceNotFoundException extends  RuntimeException{
    public  ResourceNotFoundException(String message){
        super(message);
    }
}
