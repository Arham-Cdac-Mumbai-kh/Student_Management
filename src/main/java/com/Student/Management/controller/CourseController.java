package com.Student.Management.controller;

import com.Student.Management.entity.Course;
import com.Student.Management.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Course")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @PostMapping("/save")
    public Course saveCourse(@RequestBody Course course) {
        return courseRepository.save(course);
    }
    @GetMapping("/getAll")
    public java.util.List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @DeleteMapping("/delete/{id}")
    public org.springframework.http.ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        if (!courseRepository.existsById(id)) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        courseRepository.deleteById(id);
        return org.springframework.http.ResponseEntity.noContent().build();
    }
}