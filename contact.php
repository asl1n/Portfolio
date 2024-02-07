<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve form data
    $name = $_POST["name"];
    $email = $_POST["email"];
    $message = $_POST["message"];

    // Send email (example)
    $to = "your_email@example.com";
    $subject = "New Contact Form Submission";
    $email_body = "Name: $name\nEmail: $email\nMessage: $message";
    $headers = "From: $email";

    // Send the email
    mail($to, $subject, $email_body, $headers);

    // Redirect to thank you page
    header("Location: thank-you.html");
    exit();
}
?>
