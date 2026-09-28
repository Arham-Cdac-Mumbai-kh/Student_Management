package com.Student.Management.service;

import com.Student.Management.entity.Course;
import com.Student.Management.entity.Student;
import com.Student.Management.exception.AlreadyExistingException;
import com.Student.Management.exception.ResourceNotFoundException;
import com.Student.Management.repository.CourseRepository;
import com.Student.Management.repository.Studentrepositry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class StudentSeriveImpl implements  StudentService{
    @Autowired
    private Studentrepositry studentrepositry;

    @Autowired
    private CourseRepository courseRepository;


    @Override
    public Student addStudent(Student student) {
        if(studentrepositry.existsByEmail(student.getEmail())){
            throw  new AlreadyExistingException(" Student already exists with email: "+  student.getEmail());
        }
        List<Course> courses = student.getCourse();
        if (courses != null && !courses.isEmpty()) {
            List<Course> existingcourses = courses.stream()
                    .map(course -> courseRepository.findById(course.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Course not found with id:" + course.getId())))
                    .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
            student.setCourse(existingcourses);
        } else {
            student.setCourse(new java.util.ArrayList<>());
        }
        return studentrepositry.save(student);
    }

    @Override
    public List<Student> getAllStudent() {
        return studentrepositry.findAll();
    }

    @Override
    public Student getStudentById(Long id) {
        return studentrepositry.findById(id).orElseThrow(()->new ResourceNotFoundException("Student not found with id:"+" "+ id));
    }

    @Override
    public Student updateStudent(Long id, Student student) {

        Student existing = studentrepositry.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student not found with id: " + id
                        ));

        existing.setName(student.getName());
        existing.setEmail(student.getEmail());

        List<Course> courses = student.getCourse();
        if (courses != null) {
            List<Course> existingCourses = courses.stream()
                    .map(course -> courseRepository.findById(course.getId())
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Course not found with id: "
                                                    + course.getId()
                                    )))
                    .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

            if (existing.getCourse() == null) {
                existing.setCourse(new java.util.ArrayList<>());
            } else {
                existing.getCourse().clear();
                existing.getCourse().addAll(existingCourses);
            }
        }

        return studentrepositry.save(existing);
    }


    @Override
    public void deleteStudent(Long id) {

        Student student = studentrepositry.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found with id: " + id));

        studentrepositry.delete(student);

    }

    @Override
    public List<Student> getStudentBycourse(String course) {
        return studentrepositry.findByCourse(course);
    }






}
