-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 09, 2025 at 12:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smart_cms`
--

-- --------------------------------------------------------

--
-- Table structure for table `allergy_findings`
--

CREATE TABLE `allergy_findings` (
  `AllergyFindingID` int(11) NOT NULL,
  `ConsultationID` int(11) NOT NULL,
  `AllergyName` varchar(255) NOT NULL,
  `Reaction` varchar(255) DEFAULT NULL,
  `Severity` enum('mild','moderate','severe','life-threatening') DEFAULT NULL,
  `OnsetDate` date DEFAULT NULL,
  `Status` enum('active','resolved','unknown') DEFAULT 'active',
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment`
--

CREATE TABLE `appointment` (
  `AppointmentID` int(11) NOT NULL,
  `AppointmentDateTime` datetime NOT NULL,
  `Purpose` text DEFAULT NULL,
  `Status` enum('scheduled','confirmed','cancelled','no-show') DEFAULT 'scheduled',
  `PatientID` int(11) NOT NULL,
  `DoctorID` int(11) NOT NULL,
  `CreatedBy` int(11) NOT NULL,
  `QueueNumber` varchar(20) DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  `UpdatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment`
--

INSERT INTO `appointment` (`AppointmentID`, `AppointmentDateTime`, `Purpose`, `Status`, `PatientID`, `DoctorID`, `CreatedBy`, `QueueNumber`, `Notes`, `UpdatedAt`, `start_time`, `end_time`) VALUES
(29, '2025-12-09 09:30:00', 'testappointnm', 'scheduled', 9, 9, 10, 'Q-251209-001', '', '2025-12-09 09:56:32', NULL, NULL),
(30, '2025-12-09 09:30:00', 'testappointnm', 'scheduled', 3, 9, 10, 'Q-251209-011', '', '2025-12-09 09:58:04', NULL, NULL),
(31, '2025-12-09 16:00:00', 'testappointnm', 'confirmed', 2, 9, 10, NULL, '', '2025-12-09 19:21:25', '16:00:00', '16:30:00'),
(32, '2025-12-09 19:22:20', 'test assign', 'confirmed', 3, 9, 10, 'Q-251209-002', NULL, '2025-12-09 19:22:20', NULL, NULL),
(33, '2025-12-10 08:00:00', 'testappointnm', 'scheduled', 1, 9, 10, NULL, '', '2025-12-09 19:31:25', '08:00:00', '08:30:00'),
(34, '2025-12-09 19:38:30', 'test', 'confirmed', 4, 9, 10, 'Q-251209-004', NULL, '2025-12-09 19:38:30', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `billing`
--

CREATE TABLE `billing` (
  `BillID` int(11) NOT NULL,
  `AmountDue` decimal(10,2) NOT NULL,
  `AmountPaid` decimal(10,2) DEFAULT NULL,
  `PaymentMethod` varchar(20) DEFAULT NULL,
  `PaymentDate` date DEFAULT NULL,
  `Status` enum('pending','partial','paid','overdue','cancelled') DEFAULT NULL,
  `PatientID` int(11) NOT NULL,
  `AppointmentID` int(11) NOT NULL,
  `HandledBy` int(11) NOT NULL,
  `DueDate` date DEFAULT NULL,
  `BillingDate` date NOT NULL,
  `TotalAmount` decimal(10,2) NOT NULL,
  `InsuranceCoverage` decimal(10,2) DEFAULT 0.00,
  `PatientResponsibility` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billingitem`
--

CREATE TABLE `billingitem` (
  `BillingItemID` int(11) NOT NULL,
  `BillID` int(11) NOT NULL,
  `ServiceID` int(11) NOT NULL,
  `Quantity` int(11) DEFAULT 1,
  `UnitPrice` decimal(10,2) NOT NULL,
  `TotalAmount` decimal(10,2) NOT NULL,
  `Description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chatbotinteraction`
--

CREATE TABLE `chatbotinteraction` (
  `ChatID` int(11) NOT NULL,
  `MessageFrom` enum('Patient','AI') NOT NULL,
  `MessageText` text NOT NULL,
  `Timestamp` datetime NOT NULL,
  `PatientAccountID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultation`
--

CREATE TABLE `consultation` (
  `ConsultationID` int(11) NOT NULL,
  `VisitID` int(11) NOT NULL,
  `DoctorID` int(11) NOT NULL,
  `StartTime` datetime DEFAULT NULL,
  `EndTime` datetime DEFAULT NULL,
  `ChiefComplaint` text DEFAULT NULL,
  `HistoryOfPresentIllness` text DEFAULT NULL,
  `PhysicalExamFindings` text DEFAULT NULL,
  `Diagnosis` text DEFAULT NULL,
  `DiagnosisCode` varchar(50) DEFAULT NULL,
  `TreatmentPlan` text DEFAULT NULL,
  `PrescriptionGiven` tinyint(1) DEFAULT 0,
  `LabTestsOrdered` tinyint(1) DEFAULT 0,
  `ReferralGiven` tinyint(1) DEFAULT 0,
  `FollowUpDate` date DEFAULT NULL,
  `FollowUpInstructions` text DEFAULT NULL,
  `ConsultationNotes` text DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `UpdatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dailyreceptionstats`
--

CREATE TABLE `dailyreceptionstats` (
  `StatID` int(11) NOT NULL,
  `StatDate` date NOT NULL,
  `TotalAppointments` int(11) DEFAULT 0,
  `CheckedInPatients` int(11) DEFAULT 0,
  `WaitingPatients` int(11) DEFAULT 0,
  `WalkInPatients` int(11) DEFAULT 0,
  `PaymentsProcessed` int(11) DEFAULT 0,
  `TotalRevenue` decimal(10,2) DEFAULT 0.00,
  `ReceptionistID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dispensingrecord`
--

CREATE TABLE `dispensingrecord` (
  `DispensingID` int(11) NOT NULL,
  `PrescriptionID` int(11) NOT NULL,
  `PharmacistID` int(11) NOT NULL,
  `DispensedDate` datetime NOT NULL,
  `BatchNumber` varchar(100) DEFAULT NULL,
  `QuantityDispensed` int(11) NOT NULL,
  `Notes` text DEFAULT NULL,
  `ReceiptNumber` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctorassignment`
--

CREATE TABLE `doctorassignment` (
  `AssignmentID` int(11) NOT NULL,
  `DoctorID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `AssignmentType` enum('consultation','follow-up','referral') DEFAULT NULL,
  `Priority` enum('routine','urgent','critical') DEFAULT NULL,
  `Instructions` text DEFAULT NULL,
  `AssignedAt` datetime NOT NULL,
  `CompletedAt` datetime DEFAULT NULL,
  `Status` enum('pending','in-progress','completed') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctorprofile`
--

CREATE TABLE `doctorprofile` (
  `DoctorID` int(11) NOT NULL,
  `Specialization` varchar(255) DEFAULT NULL,
  `LicenseNo` varchar(50) DEFAULT NULL,
  `ClinicRoom` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctorprofile`
--

INSERT INTO `doctorprofile` (`DoctorID`, `Specialization`, `LicenseNo`, `ClinicRoom`) VALUES
(2, 'General Medicine', 'MED12345', 'Room 101'),
(4, 'General Medicine', 'MED12346', 'Room 102'),
(7, 'General Medicine', 'MED12347', 'Room 103'),
(9, 'Broken Bone', 'adaadad', '104');

-- --------------------------------------------------------

--
-- Table structure for table `doctortask`
--

CREATE TABLE `doctortask` (
  `TaskID` int(11) NOT NULL,
  `DoctorID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `TaskType` enum('lab-order','referral','follow-up','nurse-assignment') DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `DueDate` date DEFAULT NULL,
  `Status` enum('pending','in-progress','completed') DEFAULT NULL,
  `CreatedAt` datetime NOT NULL,
  `CompletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drug`
--

CREATE TABLE `drug` (
  `DrugID` int(11) NOT NULL,
  `DrugName` varchar(255) NOT NULL,
  `Category` varchar(100) DEFAULT NULL,
  `UnitPrice` decimal(10,2) DEFAULT NULL,
  `QuantityInStock` int(11) NOT NULL,
  `ReorderLevel` int(11) DEFAULT NULL,
  `ExpiryDate` date DEFAULT NULL,
  `LastUpdated` datetime NOT NULL,
  `MinStockLevel` int(11) DEFAULT 0,
  `Location` varchar(50) DEFAULT NULL,
  `Supplier` varchar(255) DEFAULT NULL,
  `BatchNumber` varchar(100) DEFAULT NULL,
  `LastRestocked` date DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1,
  `CreatedBy` int(11) DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `expiringmedications`
-- (See below for the actual view)
--
CREATE TABLE `expiringmedications` (
`DrugID` int(11)
,`DrugName` varchar(255)
,`QuantityInStock` int(11)
,`Location` varchar(50)
,`ExpiryDate` date
,`DaysUntilExpiry` int(7)
,`ExpiryStatus` varchar(8)
);

-- --------------------------------------------------------

--
-- Table structure for table `inventorylog`
--

CREATE TABLE `inventorylog` (
  `LogID` int(11) NOT NULL,
  `Action` varchar(20) NOT NULL,
  `QuantityChange` int(11) NOT NULL,
  `Timestamp` datetime NOT NULL,
  `DrugID` int(11) NOT NULL,
  `PerformedBy` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `labtestorder`
--

CREATE TABLE `labtestorder` (
  `OrderID` int(11) NOT NULL,
  `DoctorID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `ConsultationID` int(11) DEFAULT NULL,
  `TestType` varchar(100) DEFAULT NULL,
  `Instructions` text DEFAULT NULL,
  `Priority` enum('routine','urgent') DEFAULT NULL,
  `OrderDate` datetime NOT NULL,
  `Status` enum('ordered','in-progress','completed') DEFAULT NULL,
  `Results` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `lowstockalerts`
-- (See below for the actual view)
--
CREATE TABLE `lowstockalerts` (
`DrugID` int(11)
,`DrugName` varchar(255)
,`QuantityInStock` int(11)
,`MinStockLevel` int(11)
,`Location` varchar(50)
,`StockStatus` varchar(12)
);

-- --------------------------------------------------------

--
-- Table structure for table `medicalcondition`
--

CREATE TABLE `medicalcondition` (
  `ConditionID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `ConditionName` varchar(255) NOT NULL,
  `DiagnosedDate` date DEFAULT NULL,
  `Status` enum('active','resolved','chronic') DEFAULT NULL,
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medicalrecord`
--

CREATE TABLE `medicalrecord` (
  `RecordID` int(11) NOT NULL,
  `Diagnosis` text DEFAULT NULL,
  `ChronicDisease` enum('Y','N') DEFAULT NULL,
  `Allergy` enum('Y','N') DEFAULT NULL,
  `RecordDate` date NOT NULL,
  `Notes` text DEFAULT NULL,
  `PatientID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `NotificationID` int(11) NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Message` text NOT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL,
  `PatientAccountID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient`
--

CREATE TABLE `patient` (
  `PatientID` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `ICNo` varchar(20) NOT NULL,
  `Gender` enum('M','F') NOT NULL,
  `DOB` date NOT NULL,
  `Address` text DEFAULT NULL,
  `PhoneNumber` varchar(15) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `BloodType` char(3) DEFAULT NULL,
  `InsuranceName` varchar(255) DEFAULT NULL,
  `ChronicDisease` enum('Y','N') DEFAULT NULL,
  `Allergy` enum('Y','N') DEFAULT NULL,
  `EmergencyContactName` varchar(255) DEFAULT NULL,
  `EmergencyContactPhone` varchar(15) DEFAULT NULL,
  `InsuranceProvider` varchar(255) DEFAULT NULL,
  `InsurancePolicyNo` varchar(100) DEFAULT NULL,
  `RegistrationDate` datetime DEFAULT current_timestamp(),
  `CreatedBy` int(11) DEFAULT NULL,
  `AddressLine1` varchar(255) DEFAULT NULL,
  `AddressLine2` varchar(255) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `ZipCode` varchar(20) DEFAULT NULL,
  `Country` varchar(100) DEFAULT 'USA'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient`
--

INSERT INTO `patient` (`PatientID`, `Name`, `ICNo`, `Gender`, `DOB`, `Address`, `PhoneNumber`, `Email`, `BloodType`, `InsuranceName`, `ChronicDisease`, `Allergy`, `EmergencyContactName`, `EmergencyContactPhone`, `InsuranceProvider`, `InsurancePolicyNo`, `RegistrationDate`, `CreatedBy`, `AddressLine1`, `AddressLine2`, `City`, `State`, `ZipCode`, `Country`) VALUES
(1, 'Test Patient', '900101010101', 'M', '1990-01-01', '123 Test Street', '0123456789', 'test@example.com', 'A+', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-01 13:56:47', 1, '123 Test Street', NULL, '', '', NULL, 'USA'),
(2, 'Muhd Aliff', '040821081191', 'M', '2004-08-21', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', '01172658055', 'm.aliff.affandi@gmail.com', 'O+', NULL, 'N', 'N', 'N', '0136643482', NULL, NULL, '2025-12-01 15:06:38', 8, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'USA'),
(3, 'Test 1', '040821081193', 'M', '2025-11-30', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', '01112733069', 'm.aliff.affandi@gmail.com', 'A-', NULL, 'N', 'N', 'N', '0136643482', NULL, NULL, '2025-12-01 15:11:47', 8, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'USA'),
(4, 'Test 1', '0408210811914', 'F', '2025-11-05', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', '01112733069', 'aliff11@gmail.com', 'O+', NULL, 'N', 'N', 'N', '0136643482', NULL, NULL, '2025-12-01 16:55:11', 8, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'MY'),
(5, 'Test Aliff', '040821081197', 'F', '2025-11-30', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', '0117265805', 'admin@gmail.com', 'O+', NULL, 'N', 'N', 'N', '0136643482', NULL, NULL, '2025-12-01 17:10:40', 8, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'MY'),
(6, 'Test 1', '04082108119111', 'M', '2025-11-30', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', '+601172658055', 'ado.adomin1024@gmail.com', 'A+', NULL, 'N', 'N', 'N', '0136643482', NULL, NULL, '2025-12-01 17:12:43', 8, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'MY'),
(7, 'Test 1', '040821081190', 'F', '2025-11-30', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', '+601172658055', 'aliff2@gmail.com', 'A-', NULL, 'N', 'N', 'N', '0136643482', NULL, NULL, '2025-12-01 20:07:57', 8, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'MY'),
(8, 'Muhd Afiq', '040821081199', 'M', '2025-12-01', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN, SEREMBAN, NEGERI SEMBILAN, 71900, MY', '01172658055', 'afiq@gmail.com', 'AB-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 20:14:19', 10, NULL, NULL, NULL, NULL, NULL, 'USA'),
(9, 'Test Afiq', '040821081177', 'M', '2025-12-01', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN, SEREMBAN, NEGERI SEMBILAN, 71900, MY', '01172658055', 'admin@gmail.com', 'AB-', NULL, 'N', 'N', NULL, NULL, NULL, NULL, '2025-12-02 20:21:10', 10, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'MY'),
(10, 'Test 3', '040821081181', 'M', '2025-12-04', 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN, SEREMBAN, NEGERI SEMBILAN, 71900, MY', '01172658055', 'test3@gmail.com', 'O-', NULL, 'N', 'N', NULL, NULL, NULL, NULL, '2025-12-05 20:16:46', 10, 'NO 145 JALAN SENDAYAN INDAH 7, TAMAN SENDAYAN INDAH, SEREMBAN 71900, NEGERI SEMBILAN', NULL, 'SEREMBAN', 'NEGERI SEMBILAN', '71900', 'MY');

-- --------------------------------------------------------

--
-- Table structure for table `patientaccount`
--

CREATE TABLE `patientaccount` (
  `PatientAccountID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Email` varchar(255) NOT NULL,
  `Phone` varchar(15) DEFAULT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `CreatedAt` datetime NOT NULL,
  `LastLogin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patientallergy`
--

CREATE TABLE `patientallergy` (
  `AllergyID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `AllergyName` varchar(255) NOT NULL,
  `Severity` enum('mild','moderate','severe') DEFAULT NULL,
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patientmedication`
--

CREATE TABLE `patientmedication` (
  `MedicationID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `MedicationName` varchar(255) NOT NULL,
  `Dosage` varchar(100) DEFAULT NULL,
  `Frequency` varchar(100) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `PrescribedBy` int(11) DEFAULT NULL,
  `Status` enum('active','discontinued','completed') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_visit`
--

CREATE TABLE `patient_visit` (
  `VisitID` int(11) NOT NULL,
  `AppointmentID` int(11) DEFAULT NULL,
  `PatientID` int(11) NOT NULL,
  `DoctorID` int(11) DEFAULT NULL,
  `VisitType` enum('first-time','follow-up','walk-in') NOT NULL DEFAULT 'walk-in',
  `ArrivalTime` datetime DEFAULT NULL,
  `CheckInTime` datetime DEFAULT NULL,
  `CheckOutTime` datetime DEFAULT NULL,
  `VisitStatus` enum('scheduled','checked-in','in-consultation','waiting-for-results','ready-for-checkout','completed','cancelled','no-show') DEFAULT 'scheduled',
  `NextAppointmentID` int(11) DEFAULT NULL,
  `VisitNotes` text DEFAULT NULL,
  `QueueNumber` varchar(20) DEFAULT NULL,
  `QueuePosition` int(11) DEFAULT NULL,
  `QueueStatus` enum('waiting','in-progress','completed','cancelled') DEFAULT 'waiting',
  `CalledTime` datetime DEFAULT NULL,
  `TriagePriority` enum('low','medium','high','critical') DEFAULT 'low'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_visit`
--

INSERT INTO `patient_visit` (`VisitID`, `AppointmentID`, `PatientID`, `DoctorID`, `VisitType`, `ArrivalTime`, `CheckInTime`, `CheckOutTime`, `VisitStatus`, `NextAppointmentID`, `VisitNotes`, `QueueNumber`, `QueuePosition`, `QueueStatus`, `CalledTime`, `TriagePriority`) VALUES
(49, NULL, 9, 9, 'follow-up', NULL, NULL, NULL, 'scheduled', NULL, NULL, 'Q-251209-001', NULL, 'waiting', NULL, 'low'),
(50, 29, 9, 9, 'follow-up', NULL, NULL, NULL, 'scheduled', NULL, NULL, 'Q-251209-001', NULL, 'waiting', NULL, 'low'),
(51, 30, 3, 9, 'follow-up', NULL, NULL, NULL, 'scheduled', NULL, NULL, 'Q-251209-011', NULL, 'waiting', NULL, 'low'),
(52, 31, 2, 9, 'follow-up', '2025-12-09 19:21:25', '2025-12-09 19:21:25', NULL, 'checked-in', NULL, 'testappointnm', 'Q-251209-001', 1, 'waiting', NULL, 'low'),
(53, NULL, 3, 9, 'walk-in', '2025-12-09 19:22:20', '2025-12-09 19:22:20', NULL, 'checked-in', NULL, 'test assign', 'Q-251209-002', 2, 'waiting', NULL, 'low'),
(54, NULL, 1, NULL, 'walk-in', '2025-12-09 19:38:10', '2025-12-09 19:38:10', NULL, 'checked-in', NULL, 'test', 'Q-251209-003', 3, 'waiting', NULL, 'low'),
(55, NULL, 4, 9, 'walk-in', '2025-12-09 19:38:30', '2025-12-09 19:38:30', NULL, 'checked-in', NULL, 'test', 'Q-251209-004', 4, 'waiting', NULL, 'low');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `PaymentID` int(11) NOT NULL,
  `BillID` int(11) NOT NULL,
  `AmountPaid` decimal(10,2) NOT NULL,
  `PaymentMethod` enum('cash','credit','debit','insurance','check','online') DEFAULT NULL,
  `PaymentDate` datetime NOT NULL,
  `TransactionID` varchar(100) DEFAULT NULL,
  `ProcessedBy` int(11) NOT NULL,
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescription`
--

CREATE TABLE `prescription` (
  `PrescriptionID` int(11) NOT NULL,
  `PrescribedDate` date NOT NULL,
  `Remarks` text DEFAULT NULL,
  `DoctorID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `ConsultationID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescriptionitem`
--

CREATE TABLE `prescriptionitem` (
  `ItemID` int(11) NOT NULL,
  `Dosage` varchar(50) DEFAULT NULL,
  `Frequency` varchar(50) DEFAULT NULL,
  `Duration` varchar(50) DEFAULT NULL,
  `PrescriptionID` int(11) NOT NULL,
  `DrugID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescriptionstatus`
--

CREATE TABLE `prescriptionstatus` (
  `StatusID` int(11) NOT NULL,
  `PrescriptionID` int(11) NOT NULL,
  `Status` enum('pending','preparing','ready','dispensed','cancelled') DEFAULT 'pending',
  `UpdatedBy` int(11) NOT NULL,
  `UpdatedAt` datetime DEFAULT current_timestamp(),
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral`
--

CREATE TABLE `referral` (
  `ReferralID` int(11) NOT NULL,
  `DoctorID` int(11) NOT NULL,
  `PatientID` int(11) NOT NULL,
  `ConsultationID` int(11) DEFAULT NULL,
  `Specialty` varchar(100) DEFAULT NULL,
  `Reason` text DEFAULT NULL,
  `Urgency` enum('routine','urgent','emergency') DEFAULT NULL,
  `ReferralDate` datetime NOT NULL,
  `Status` enum('pending','accepted','completed') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reorderrequest`
--

CREATE TABLE `reorderrequest` (
  `RequestID` int(11) NOT NULL,
  `DrugID` int(11) NOT NULL,
  `RequestedQuantity` int(11) NOT NULL,
  `Urgency` enum('low','medium','high','critical') DEFAULT NULL,
  `Supplier` varchar(255) DEFAULT NULL,
  `RequestedBy` int(11) NOT NULL,
  `RequestedAt` datetime DEFAULT current_timestamp(),
  `Status` enum('pending','ordered','received','cancelled') DEFAULT NULL,
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service`
--

CREATE TABLE `service` (
  `ServiceID` int(11) NOT NULL,
  `ServiceName` varchar(255) NOT NULL,
  `Description` text DEFAULT NULL,
  `StandardFee` decimal(10,2) NOT NULL,
  `Category` varchar(100) DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service`
--

INSERT INTO `service` (`ServiceID`, `ServiceName`, `Description`, `StandardFee`, `Category`, `IsActive`) VALUES
(1, 'Consultation', 'Doctor consultation fee', 150.00, 'Consultation', 1),
(2, 'Check-up', 'Regular health check-up', 100.00, 'Check-up', 1),
(3, 'Lab Tests', 'Basic laboratory tests', 80.00, 'Laboratory', 1),
(4, 'X-Ray', 'X-Ray imaging service', 120.00, 'Radiology', 1),
(5, 'Surgery Consultation', 'Surgical specialist consultation', 200.00, 'Consultation', 1),
(6, 'Follow-up', 'Follow-up appointment', 75.00, 'Consultation', 1);

-- --------------------------------------------------------

--
-- Table structure for table `stockadjustment`
--

CREATE TABLE `stockadjustment` (
  `AdjustmentID` int(11) NOT NULL,
  `DrugID` int(11) NOT NULL,
  `AdjustmentType` enum('add','remove','correction','return') DEFAULT NULL,
  `QuantityChange` int(11) NOT NULL,
  `Reason` varchar(255) DEFAULT NULL,
  `AdjustedBy` int(11) NOT NULL,
  `AdjustedAt` datetime DEFAULT current_timestamp(),
  `PreviousStock` int(11) NOT NULL,
  `NewStock` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `SupplierID` int(11) NOT NULL,
  `SupplierName` varchar(255) NOT NULL,
  `ContactPerson` varchar(255) DEFAULT NULL,
  `Phone` varchar(15) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `useraccount`
--

CREATE TABLE `useraccount` (
  `UserID` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Role` varchar(50) NOT NULL,
  `PhoneNum` varchar(15) DEFAULT NULL,
  `ICNo` varchar(20) DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `useraccount`
--

INSERT INTO `useraccount` (`UserID`, `Name`, `Email`, `PasswordHash`, `Role`, `PhoneNum`, `ICNo`, `Status`) VALUES
(1, 'Admin', 'admin@gmail.com', '$2y$10$cI5I4Tz/0bcQsJCHqVwqIOSckS3ol081nV6Ysi3QW/B10WlrnG8HG', 'Admin', '1234567890', '040821081171', 'Active'),
(2, 'Aliff test', 'test@gmail.com', '$2b$10$lIx0wyp8g704iMpZl9YBq.eKNQSL8rNDdMvNNxXHlBPhkqbzXHw9a', 'doctor', '01127368044', '040821081191', 'Active'),
(4, 'adomination', 'adomination@gmail.com', '$2b$10$tCtpVlIlDip10ITq761/BOIAozVCLMu53avVHS4onWt.B8uAmPSm.', 'doctor', '01127368044', '040821081191', 'Active'),
(7, 'Aliff', 'aliff@gmail.com', '$2b$10$zzKSHmR7a7Daf.2kEmxZdOtyYWfDC8dwOKbmcgREqgnGSeX79C7.q', 'doctor', '01127368044', '0401030204', 'Active'),
(8, 'aliff2', 'aliff2@gmail.com', '$2b$10$58zrLQDh1As0tKAqT.SgG.bgjyzFlvCIJWYt8c/keMetIowM6mTmm', 'receptionist', '01127368044', '0401010201053', 'Active'),
(9, 'Real Doctor', 'realdoctor@gmail.com', '$2b$10$aW8fzVM21soqkFaod8.ezOm/2KGgcjinP59Ehpz22bxyfQvUmrf/u', 'doctor', '01127368044', '040821081191', 'Active'),
(10, 'Real Receptionist', 'receptionist@gmail.com', '$2b$10$2xpxENaqVwUzXhenLNKOxuRXkM2JBe7PbN0QvPW7QHNZ9gg8g3K8i', 'receptionist', '01127368044', '040821-08-1199', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `vital_signs`
--

CREATE TABLE `vital_signs` (
  `VitalSignID` int(11) NOT NULL,
  `ConsultationID` int(11) NOT NULL,
  `TakenBy` int(11) NOT NULL,
  `TakenAt` datetime NOT NULL,
  `BloodPressureSystolic` int(11) DEFAULT NULL,
  `BloodPressureDiastolic` int(11) DEFAULT NULL,
  `HeartRate` int(11) DEFAULT NULL,
  `RespiratoryRate` int(11) DEFAULT NULL,
  `Temperature` decimal(4,2) DEFAULT NULL,
  `OxygenSaturation` decimal(5,2) DEFAULT NULL,
  `Height` decimal(5,2) DEFAULT NULL,
  `Weight` decimal(5,2) DEFAULT NULL,
  `BMI` decimal(5,2) DEFAULT NULL,
  `PainLevel` int(11) DEFAULT NULL,
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `expiringmedications`
--
DROP TABLE IF EXISTS `expiringmedications`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `expiringmedications`  AS SELECT `drug`.`DrugID` AS `DrugID`, `drug`.`DrugName` AS `DrugName`, `drug`.`QuantityInStock` AS `QuantityInStock`, `drug`.`Location` AS `Location`, `drug`.`ExpiryDate` AS `ExpiryDate`, to_days(`drug`.`ExpiryDate`) - to_days(curdate()) AS `DaysUntilExpiry`, CASE WHEN to_days(`drug`.`ExpiryDate`) - to_days(curdate()) <= 14 THEN 'critical' WHEN to_days(`drug`.`ExpiryDate`) - to_days(curdate()) <= 30 THEN 'warning' WHEN to_days(`drug`.`ExpiryDate`) - to_days(curdate()) <= 60 THEN 'notice' ELSE 'safe' END AS `ExpiryStatus` FROM `drug` WHERE `drug`.`ExpiryDate` is not null AND to_days(`drug`.`ExpiryDate`) - to_days(curdate()) <= 60 AND `drug`.`QuantityInStock` > 0 ORDER BY `drug`.`ExpiryDate` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `lowstockalerts`
--
DROP TABLE IF EXISTS `lowstockalerts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `lowstockalerts`  AS SELECT `drug`.`DrugID` AS `DrugID`, `drug`.`DrugName` AS `DrugName`, `drug`.`QuantityInStock` AS `QuantityInStock`, `drug`.`MinStockLevel` AS `MinStockLevel`, `drug`.`Location` AS `Location`, CASE WHEN `drug`.`QuantityInStock` = 0 THEN 'out-of-stock' WHEN `drug`.`QuantityInStock` <= `drug`.`MinStockLevel` * 0.2 THEN 'critical' WHEN `drug`.`QuantityInStock` <= `drug`.`MinStockLevel` * 0.5 THEN 'low' ELSE 'adequate' END AS `StockStatus` FROM `drug` WHERE `drug`.`IsActive` = 1 ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `allergy_findings`
--
ALTER TABLE `allergy_findings`
  ADD PRIMARY KEY (`AllergyFindingID`),
  ADD KEY `ConsultationID` (`ConsultationID`);

--
-- Indexes for table `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`AppointmentID`),
  ADD KEY `PatientID` (`PatientID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `CreatedBy` (`CreatedBy`);

--
-- Indexes for table `billing`
--
ALTER TABLE `billing`
  ADD PRIMARY KEY (`BillID`),
  ADD KEY `PatientID` (`PatientID`),
  ADD KEY `AppointmentID` (`AppointmentID`),
  ADD KEY `HandledBy` (`HandledBy`);

--
-- Indexes for table `billingitem`
--
ALTER TABLE `billingitem`
  ADD PRIMARY KEY (`BillingItemID`),
  ADD KEY `BillID` (`BillID`),
  ADD KEY `ServiceID` (`ServiceID`);

--
-- Indexes for table `chatbotinteraction`
--
ALTER TABLE `chatbotinteraction`
  ADD PRIMARY KEY (`ChatID`),
  ADD KEY `PatientAccountID` (`PatientAccountID`);

--
-- Indexes for table `consultation`
--
ALTER TABLE `consultation`
  ADD PRIMARY KEY (`ConsultationID`),
  ADD UNIQUE KEY `VisitID` (`VisitID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `idx_consultation_date` (`StartTime`),
  ADD KEY `idx_diagnosis` (`DiagnosisCode`);

--
-- Indexes for table `dailyreceptionstats`
--
ALTER TABLE `dailyreceptionstats`
  ADD PRIMARY KEY (`StatID`),
  ADD KEY `ReceptionistID` (`ReceptionistID`);

--
-- Indexes for table `dispensingrecord`
--
ALTER TABLE `dispensingrecord`
  ADD PRIMARY KEY (`DispensingID`),
  ADD UNIQUE KEY `ReceiptNumber` (`ReceiptNumber`),
  ADD KEY `PrescriptionID` (`PrescriptionID`),
  ADD KEY `PharmacistID` (`PharmacistID`);

--
-- Indexes for table `doctorassignment`
--
ALTER TABLE `doctorassignment`
  ADD PRIMARY KEY (`AssignmentID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `PatientID` (`PatientID`);

--
-- Indexes for table `doctorprofile`
--
ALTER TABLE `doctorprofile`
  ADD PRIMARY KEY (`DoctorID`);

--
-- Indexes for table `doctortask`
--
ALTER TABLE `doctortask`
  ADD PRIMARY KEY (`TaskID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `PatientID` (`PatientID`);

--
-- Indexes for table `drug`
--
ALTER TABLE `drug`
  ADD PRIMARY KEY (`DrugID`),
  ADD KEY `CreatedBy` (`CreatedBy`);

--
-- Indexes for table `inventorylog`
--
ALTER TABLE `inventorylog`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `DrugID` (`DrugID`),
  ADD KEY `PerformedBy` (`PerformedBy`);

--
-- Indexes for table `labtestorder`
--
ALTER TABLE `labtestorder`
  ADD PRIMARY KEY (`OrderID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `PatientID` (`PatientID`),
  ADD KEY `ConsultationID` (`ConsultationID`);

--
-- Indexes for table `medicalcondition`
--
ALTER TABLE `medicalcondition`
  ADD PRIMARY KEY (`ConditionID`),
  ADD KEY `PatientID` (`PatientID`);

--
-- Indexes for table `medicalrecord`
--
ALTER TABLE `medicalrecord`
  ADD PRIMARY KEY (`RecordID`),
  ADD KEY `PatientID` (`PatientID`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`NotificationID`),
  ADD KEY `PatientAccountID` (`PatientAccountID`);

--
-- Indexes for table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`PatientID`),
  ADD UNIQUE KEY `ICNo` (`ICNo`),
  ADD KEY `CreatedBy` (`CreatedBy`);

--
-- Indexes for table `patientaccount`
--
ALTER TABLE `patientaccount`
  ADD PRIMARY KEY (`PatientAccountID`),
  ADD KEY `PatientID` (`PatientID`);

--
-- Indexes for table `patientallergy`
--
ALTER TABLE `patientallergy`
  ADD PRIMARY KEY (`AllergyID`),
  ADD KEY `PatientID` (`PatientID`);

--
-- Indexes for table `patientmedication`
--
ALTER TABLE `patientmedication`
  ADD PRIMARY KEY (`MedicationID`),
  ADD KEY `PatientID` (`PatientID`),
  ADD KEY `PrescribedBy` (`PrescribedBy`);

--
-- Indexes for table `patient_visit`
--
ALTER TABLE `patient_visit`
  ADD PRIMARY KEY (`VisitID`),
  ADD KEY `AppointmentID` (`AppointmentID`),
  ADD KEY `PatientID` (`PatientID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `NextAppointmentID` (`NextAppointmentID`),
  ADD KEY `idx_queue_status` (`QueueStatus`),
  ADD KEY `idx_queue_position` (`QueuePosition`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`PaymentID`),
  ADD KEY `BillID` (`BillID`),
  ADD KEY `ProcessedBy` (`ProcessedBy`);

--
-- Indexes for table `prescription`
--
ALTER TABLE `prescription`
  ADD PRIMARY KEY (`PrescriptionID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `PatientID` (`PatientID`),
  ADD KEY `ConsultationID` (`ConsultationID`);

--
-- Indexes for table `prescriptionitem`
--
ALTER TABLE `prescriptionitem`
  ADD PRIMARY KEY (`ItemID`),
  ADD KEY `PrescriptionID` (`PrescriptionID`),
  ADD KEY `DrugID` (`DrugID`);

--
-- Indexes for table `prescriptionstatus`
--
ALTER TABLE `prescriptionstatus`
  ADD PRIMARY KEY (`StatusID`),
  ADD KEY `PrescriptionID` (`PrescriptionID`),
  ADD KEY `UpdatedBy` (`UpdatedBy`);

--
-- Indexes for table `referral`
--
ALTER TABLE `referral`
  ADD PRIMARY KEY (`ReferralID`),
  ADD KEY `DoctorID` (`DoctorID`),
  ADD KEY `PatientID` (`PatientID`),
  ADD KEY `ConsultationID` (`ConsultationID`);

--
-- Indexes for table `reorderrequest`
--
ALTER TABLE `reorderrequest`
  ADD PRIMARY KEY (`RequestID`),
  ADD KEY `DrugID` (`DrugID`),
  ADD KEY `RequestedBy` (`RequestedBy`);

--
-- Indexes for table `service`
--
ALTER TABLE `service`
  ADD PRIMARY KEY (`ServiceID`);

--
-- Indexes for table `stockadjustment`
--
ALTER TABLE `stockadjustment`
  ADD PRIMARY KEY (`AdjustmentID`),
  ADD KEY `DrugID` (`DrugID`),
  ADD KEY `AdjustedBy` (`AdjustedBy`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`SupplierID`);

--
-- Indexes for table `useraccount`
--
ALTER TABLE `useraccount`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD PRIMARY KEY (`VitalSignID`),
  ADD KEY `ConsultationID` (`ConsultationID`),
  ADD KEY `TakenBy` (`TakenBy`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `allergy_findings`
--
ALTER TABLE `allergy_findings`
  MODIFY `AllergyFindingID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment`
--
ALTER TABLE `appointment`
  MODIFY `AppointmentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `BillID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billingitem`
--
ALTER TABLE `billingitem`
  MODIFY `BillingItemID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chatbotinteraction`
--
ALTER TABLE `chatbotinteraction`
  MODIFY `ChatID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultation`
--
ALTER TABLE `consultation`
  MODIFY `ConsultationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dailyreceptionstats`
--
ALTER TABLE `dailyreceptionstats`
  MODIFY `StatID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dispensingrecord`
--
ALTER TABLE `dispensingrecord`
  MODIFY `DispensingID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `doctorassignment`
--
ALTER TABLE `doctorassignment`
  MODIFY `AssignmentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `doctortask`
--
ALTER TABLE `doctortask`
  MODIFY `TaskID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `drug`
--
ALTER TABLE `drug`
  MODIFY `DrugID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventorylog`
--
ALTER TABLE `inventorylog`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `labtestorder`
--
ALTER TABLE `labtestorder`
  MODIFY `OrderID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medicalcondition`
--
ALTER TABLE `medicalcondition`
  MODIFY `ConditionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medicalrecord`
--
ALTER TABLE `medicalrecord`
  MODIFY `RecordID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patient`
--
ALTER TABLE `patient`
  MODIFY `PatientID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `patientaccount`
--
ALTER TABLE `patientaccount`
  MODIFY `PatientAccountID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patientallergy`
--
ALTER TABLE `patientallergy`
  MODIFY `AllergyID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patientmedication`
--
ALTER TABLE `patientmedication`
  MODIFY `MedicationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patient_visit`
--
ALTER TABLE `patient_visit`
  MODIFY `VisitID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `PaymentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prescription`
--
ALTER TABLE `prescription`
  MODIFY `PrescriptionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prescriptionitem`
--
ALTER TABLE `prescriptionitem`
  MODIFY `ItemID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prescriptionstatus`
--
ALTER TABLE `prescriptionstatus`
  MODIFY `StatusID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `referral`
--
ALTER TABLE `referral`
  MODIFY `ReferralID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reorderrequest`
--
ALTER TABLE `reorderrequest`
  MODIFY `RequestID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service`
--
ALTER TABLE `service`
  MODIFY `ServiceID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `stockadjustment`
--
ALTER TABLE `stockadjustment`
  MODIFY `AdjustmentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `SupplierID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `useraccount`
--
ALTER TABLE `useraccount`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `vital_signs`
--
ALTER TABLE `vital_signs`
  MODIFY `VitalSignID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `allergy_findings`
--
ALTER TABLE `allergy_findings`
  ADD CONSTRAINT `fk_allergyfindings_consultation` FOREIGN KEY (`ConsultationID`) REFERENCES `consultation` (`ConsultationID`) ON DELETE CASCADE;

--
-- Constraints for table `appointment`
--
ALTER TABLE `appointment`
  ADD CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`),
  ADD CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`),
  ADD CONSTRAINT `appointment_ibfk_3` FOREIGN KEY (`CreatedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `billing`
--
ALTER TABLE `billing`
  ADD CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`),
  ADD CONSTRAINT `billing_ibfk_2` FOREIGN KEY (`AppointmentID`) REFERENCES `appointment` (`AppointmentID`),
  ADD CONSTRAINT `billing_ibfk_3` FOREIGN KEY (`HandledBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `billingitem`
--
ALTER TABLE `billingitem`
  ADD CONSTRAINT `billingitem_ibfk_1` FOREIGN KEY (`BillID`) REFERENCES `billing` (`BillID`),
  ADD CONSTRAINT `billingitem_ibfk_2` FOREIGN KEY (`ServiceID`) REFERENCES `service` (`ServiceID`);

--
-- Constraints for table `chatbotinteraction`
--
ALTER TABLE `chatbotinteraction`
  ADD CONSTRAINT `chatbotinteraction_ibfk_1` FOREIGN KEY (`PatientAccountID`) REFERENCES `patientaccount` (`PatientAccountID`);

--
-- Constraints for table `consultation`
--
ALTER TABLE `consultation`
  ADD CONSTRAINT `fk_consultation_doctor` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`),
  ADD CONSTRAINT `fk_consultation_visit` FOREIGN KEY (`VisitID`) REFERENCES `patient_visit` (`VisitID`) ON DELETE CASCADE;

--
-- Constraints for table `dailyreceptionstats`
--
ALTER TABLE `dailyreceptionstats`
  ADD CONSTRAINT `dailyreceptionstats_ibfk_1` FOREIGN KEY (`ReceptionistID`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `dispensingrecord`
--
ALTER TABLE `dispensingrecord`
  ADD CONSTRAINT `dispensingrecord_ibfk_1` FOREIGN KEY (`PrescriptionID`) REFERENCES `prescription` (`PrescriptionID`),
  ADD CONSTRAINT `dispensingrecord_ibfk_2` FOREIGN KEY (`PharmacistID`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `doctorassignment`
--
ALTER TABLE `doctorassignment`
  ADD CONSTRAINT `doctorassignment_ibfk_1` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`),
  ADD CONSTRAINT `doctorassignment_ibfk_2` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `doctorprofile`
--
ALTER TABLE `doctorprofile`
  ADD CONSTRAINT `doctorprofile_ibfk_1` FOREIGN KEY (`DoctorID`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `doctortask`
--
ALTER TABLE `doctortask`
  ADD CONSTRAINT `doctortask_ibfk_1` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`),
  ADD CONSTRAINT `doctortask_ibfk_2` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `drug`
--
ALTER TABLE `drug`
  ADD CONSTRAINT `drug_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `inventorylog`
--
ALTER TABLE `inventorylog`
  ADD CONSTRAINT `inventorylog_ibfk_1` FOREIGN KEY (`DrugID`) REFERENCES `drug` (`DrugID`),
  ADD CONSTRAINT `inventorylog_ibfk_2` FOREIGN KEY (`PerformedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `labtestorder`
--
ALTER TABLE `labtestorder`
  ADD CONSTRAINT `labtestorder_ibfk_1` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`),
  ADD CONSTRAINT `labtestorder_ibfk_2` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `medicalcondition`
--
ALTER TABLE `medicalcondition`
  ADD CONSTRAINT `medicalcondition_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `medicalrecord`
--
ALTER TABLE `medicalrecord`
  ADD CONSTRAINT `medicalrecord_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`PatientAccountID`) REFERENCES `patientaccount` (`PatientAccountID`);

--
-- Constraints for table `patient`
--
ALTER TABLE `patient`
  ADD CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `patientaccount`
--
ALTER TABLE `patientaccount`
  ADD CONSTRAINT `patientaccount_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `patientallergy`
--
ALTER TABLE `patientallergy`
  ADD CONSTRAINT `patientallergy_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `patientmedication`
--
ALTER TABLE `patientmedication`
  ADD CONSTRAINT `patientmedication_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`),
  ADD CONSTRAINT `patientmedication_ibfk_2` FOREIGN KEY (`PrescribedBy`) REFERENCES `doctorprofile` (`DoctorID`);

--
-- Constraints for table `patient_visit`
--
ALTER TABLE `patient_visit`
  ADD CONSTRAINT `patient_visit_ibfk_1` FOREIGN KEY (`AppointmentID`) REFERENCES `appointment` (`AppointmentID`) ON DELETE SET NULL,
  ADD CONSTRAINT `patient_visit_ibfk_2` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_visit_ibfk_3` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`) ON DELETE SET NULL,
  ADD CONSTRAINT `patient_visit_ibfk_4` FOREIGN KEY (`NextAppointmentID`) REFERENCES `appointment` (`AppointmentID`) ON DELETE SET NULL;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`BillID`) REFERENCES `billing` (`BillID`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`ProcessedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `prescription`
--
ALTER TABLE `prescription`
  ADD CONSTRAINT `prescription_ibfk_1` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`),
  ADD CONSTRAINT `prescription_ibfk_2` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `prescriptionitem`
--
ALTER TABLE `prescriptionitem`
  ADD CONSTRAINT `prescriptionitem_ibfk_1` FOREIGN KEY (`PrescriptionID`) REFERENCES `prescription` (`PrescriptionID`),
  ADD CONSTRAINT `prescriptionitem_ibfk_2` FOREIGN KEY (`DrugID`) REFERENCES `drug` (`DrugID`);

--
-- Constraints for table `prescriptionstatus`
--
ALTER TABLE `prescriptionstatus`
  ADD CONSTRAINT `prescriptionstatus_ibfk_1` FOREIGN KEY (`PrescriptionID`) REFERENCES `prescription` (`PrescriptionID`),
  ADD CONSTRAINT `prescriptionstatus_ibfk_2` FOREIGN KEY (`UpdatedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `referral`
--
ALTER TABLE `referral`
  ADD CONSTRAINT `referral_ibfk_1` FOREIGN KEY (`DoctorID`) REFERENCES `doctorprofile` (`DoctorID`),
  ADD CONSTRAINT `referral_ibfk_2` FOREIGN KEY (`PatientID`) REFERENCES `patient` (`PatientID`);

--
-- Constraints for table `reorderrequest`
--
ALTER TABLE `reorderrequest`
  ADD CONSTRAINT `reorderrequest_ibfk_1` FOREIGN KEY (`DrugID`) REFERENCES `drug` (`DrugID`),
  ADD CONSTRAINT `reorderrequest_ibfk_2` FOREIGN KEY (`RequestedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `stockadjustment`
--
ALTER TABLE `stockadjustment`
  ADD CONSTRAINT `stockadjustment_ibfk_1` FOREIGN KEY (`DrugID`) REFERENCES `drug` (`DrugID`),
  ADD CONSTRAINT `stockadjustment_ibfk_2` FOREIGN KEY (`AdjustedBy`) REFERENCES `useraccount` (`UserID`);

--
-- Constraints for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD CONSTRAINT `fk_vitals_consultation` FOREIGN KEY (`ConsultationID`) REFERENCES `consultation` (`ConsultationID`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_vitals_takenby` FOREIGN KEY (`TakenBy`) REFERENCES `useraccount` (`UserID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
