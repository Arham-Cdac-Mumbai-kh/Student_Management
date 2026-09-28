package com.Student.Management.repository;

import com.Student.Management.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface Studentrepositry extends JpaRepository<Student, Long> {
boolean existsByEmail(String email);

    @Query(value = """
        SELECT s.*
        FROM student s
        JOIN student_course sc
            ON s.id = sc.student_id
        JOIN course c
            ON c.id = sc.course_id
        WHERE c.course_name = :courseName
        """, nativeQuery = true)
    List<Student> findByCourse(@Param("courseName") String courseName);


}
