<?php
// Run this in PHP to get the correct hash
$password = '12345678';
$hash = password_hash($password, PASSWORD_BCRYPT);
echo "Hash: " . $hash;
?>